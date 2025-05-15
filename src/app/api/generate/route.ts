import { NextRequest, NextResponse } from "next/server";
import { generate_flux_image } from "@/lib/fal_client";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { auth } from "@clerk/nextjs/server";
import { track } from '@vercel/analytics/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { calculate_required_tokens, get_plan_limit, is_new_month, check_rate_limit } from '@/lib/generate_helpers';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  let selected_model_id: string = '';
  let plan: string = '';
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        { status: 429, headers: { 'X-RateLimit-Remaining': rate.remaining.toString(), 'X-RateLimit-Reset': rate.reset.toString() } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    const width = typeof body.width === 'number' ? body.width : 1024;
    const height = typeof body.height === 'number' ? body.height : 1024;
    const model_id = typeof body.model_id === 'string' ? body.model_id : '';
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const required_tokens = calculate_required_tokens(width, height);

    // Caching: hash the request params
    const safe_user_id = typeof userId === 'string' ? userId : '';
    const safe_prompt = typeof prompt === 'string' ? prompt : '';
    const safe_model_id = typeof model_id === 'string' ? model_id : '';
    const cache_key = crypto.createHash('sha256').update(`${safe_user_id}:${safe_prompt}:${width}:${height}:${safe_model_id}`).digest('hex');
    const cached = await redis.get(`imggen:${cache_key}`);
    if (typeof cached === 'string') {
      return NextResponse.json({ image_base64: cached, mp_used: required_tokens, cached: true });
    }

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Fetch user and subscription data
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select("tokens, plan, renewed_at")
      .eq("user_id", user.id)
      .single();

    if (sub_error || !subscription) {
      console.error("Subscription fetch error:", sub_error?.message);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    let { tokens, renewed_at } = subscription;
    plan = subscription.plan;
    const plan_limit = get_plan_limit(plan);

    // Restrict model access by plan
    selected_model_id = model_id;
    if (plan === "free") {
      if (!selected_model_id || selected_model_id !== "fal-ai/flux/schnell") {
        selected_model_id = "fal-ai/flux/schnell";
      }
      if (model_id && model_id !== "fal-ai/flux/schnell") {
        return NextResponse.json(
          { error: "Free users can only use fal-ai/flux/schnell" },
          { status: 403 }
        );
      }
    } else if (plan === "standard") {
      if (!selected_model_id) {
        selected_model_id = "fal-ai/flux/dev";
      }
      if (selected_model_id !== "fal-ai/flux/schnell" && selected_model_id !== "fal-ai/flux/dev") {
        return NextResponse.json(
          { error: "Standard users can only use fal-ai/flux/schnell or fal-ai/flux/dev" },
          { status: 403 }
        );
      }
    } else {
      // fallback: only allow schnell
      selected_model_id = "fal-ai/flux/schnell";
    }

    // Reset tokens if a new month has started, but only for non-free plans
    if (plan !== "free" && is_new_month(renewed_at)) {
      tokens = plan_limit;
      renewed_at = new Date().toISOString();
      const { error: reset_error } = await supabase
        .from("subscriptions")
        .update({ tokens, renewed_at })
        .eq("user_id", user.id);

      if (reset_error) {
        console.error("Token reset error:", reset_error.message);
        return NextResponse.json(
          { error: "Failed to reset tokens" },
          { status: 500 }
        );
      }
      console.log(`Tokens reset for user ${userId}: ${tokens} tokens`);
    }

    // Deduct tokens atomically using stored procedure
    const { error: deduct_error } = await supabase.rpc("deduct_tokens", {
      p_user_id: user.id,
      p_required_tokens: required_tokens,
    });

    if (deduct_error) {
      console.error("Token deduction error:", deduct_error.message);
      if (deduct_error.message.includes("Insufficient tokens")) {
        return NextResponse.json(
          { error: "Insufficient tokens" },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: "Failed to deduct tokens" },
        { status: 500 }
      );
    }

    // Generate the image
    const image = await generate_flux_image(prompt, width, height, selected_model_id);
    const base64 = Buffer.from(image.uint8Array).toString("base64");

    // On successful generation
    await track('Image Generated', {
      status: 'success',
      model_id: selected_model_id ?? 'unknown',
      plan: plan ?? 'unknown',
      prompt_length: prompt.length,
      timestamp: new Date().toISOString(),
    });

    // Cache the result
    await redis.set(`imggen:${cache_key}`, base64);

    return NextResponse.json({ image_base64: base64, mp_used: required_tokens });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Image generation error:", error.message);
      await track('Image Generation Failed', {
        status: 'error',
        model_id: selected_model_id ?? 'unknown',
        plan: plan ?? 'unknown',
        prompt_length: prompt.length,
        error_message: error.message.slice(0, 255),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown image generation error:", error);
    await track('Image Generation Failed', {
      status: 'error',
      model_id: selected_model_id ?? 'unknown',
      plan: 'unknown',
      prompt_length: prompt.length,
      error_message: 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
