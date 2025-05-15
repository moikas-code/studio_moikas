import { NextRequest, NextResponse } from "next/server";
import { generate_flux_image } from "@/lib/fal_client";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { auth } from "@clerk/nextjs/server";
import { track } from '@vercel/analytics/server';
import { Redis } from '@upstash/redis';
import { check_rate_limit, generate_imggen_cache_key, get_model_cost } from '@/lib/generate_helpers';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key schema:
// imggen:{user_id}:{model_id}:{hash} => { image_base64: string, created_at: string, ... }

export async function POST(req: NextRequest) {
  let selected_model_id: string = '';
  let plan: string = '';
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine user plan and queue type
    const is_standard = plan === 'standard';
    // Apply different rate limits
    const rate = await check_rate_limit(redis, userId, is_standard ? 60 : 10, 60); // 60/min for standard, 10/min for free
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        { status: 429, headers: { 'X-RateLimit-Remaining': rate.remaining.toString(), 'X-RateLimit-Reset': rate.reset.toString() } }
      );
    }
    // Artificial delay for free users (slow queue)
    if (!is_standard) {
      await new Promise(res => setTimeout(res, 2000)); // 2s delay for free users
    }

    // Parse and validate request body
    const body = await req.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt : '';
    let width = typeof body.width === 'number' ? body.width : 1024;
    let height = typeof body.height === 'number' ? body.height : 1024;
    const model_id = typeof body.model_id === 'string' ? body.model_id : '';
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Determine width and height from aspect_ratio
    if (typeof body.aspect_ratio === 'string') {
      // Map aspect_ratio to width/height
      const aspect_map: Record<string, { width: number, height: number }> = {
        'portrait_4_3': { width: 800, height: 1066 },
        'portrait_16_9': { width: 896, height: 1600 },
        'square': { width: 1024, height: 1024 },
        'square_hd': { width: 1536, height: 1536 },
        'landscape_4_3': { width: 1066, height: 800 },
        'landscape_16_9': { width: 1600, height: 896 },
      };
      if (aspect_map[body.aspect_ratio]) {
        width = aspect_map[body.aspect_ratio].width;
        height = aspect_map[body.aspect_ratio].height;
      }
    }
    // Calculate pixel-based cost
    function get_tokens_for_size(width: number, height: number) {
      return Math.ceil((width * height) / 1_000_000);
    }
    const size_tokens = get_tokens_for_size(width, height);
    const model_tokens = get_model_cost(plan, selected_model_id);
    const required_tokens = size_tokens * model_tokens;

    // Caching: hash the request params and use a namespaced key
    const safe_user_id = typeof userId === 'string' ? userId : '';
    const safe_prompt = typeof prompt === 'string' ? prompt : '';
    const safe_model_id = typeof model_id === 'string' ? model_id : '';
    const cache_key = generate_imggen_cache_key(safe_user_id, safe_model_id, safe_prompt, width, height);
    let cached;
    try {
      cached = await redis.get(cache_key);
    } catch (err) {
      console.error('Redis get error:', err);
      cached = null;
    }
    if (typeof cached === 'string') {
      try {
        const cached_obj = JSON.parse(cached);
        return NextResponse.json({ image_base64: cached_obj.image_base64, mp_used: cached_obj.mp_used, cached: true });
      } catch (err) {
        console.error('Redis cached value parse error:', err);
      }
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
      .select("tokens, plan, renewed_at, pro_tokens_used, pro_tokens_cap")
      .eq("user_id", user.id)
      .single();

    if (sub_error || !subscription) {
      console.error("Subscription fetch error:", sub_error?.message);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const { tokens, pro_tokens_used, pro_tokens_cap } = subscription;
    plan = subscription.plan;

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
      if (
        selected_model_id !== "fal-ai/flux/schnell" &&
        selected_model_id !== "fal-ai/flux/dev" &&
        selected_model_id !== "fal-ai/flux/pro"
      ) {
        return NextResponse.json(
          { error: "Standard users can only use fal-ai/flux/schnell, fal-ai/flux/dev, or fal-ai/flux/pro" },
          { status: 403 }
        );
      }
    } else {
      // fallback: only allow schnell
      selected_model_id = "fal-ai/flux/schnell";
    }

    // Special logic for pro model monthly cap
    if (plan === "standard" && selected_model_id === "fal-ai/flux/pro") {
      if ((pro_tokens_used ?? 0) + required_tokens > (pro_tokens_cap ?? 1700)) {
        return NextResponse.json(
          { error: "Monthly cap for FLUX.1 [pro] reached.", pro_tokens_used, pro_tokens_cap },
          { status: 402 }
        );
      }
      // Deduct from both pools
      const { error: deduct_error } = await supabase.rpc("deduct_tokens", {
        p_user_id: user.id,
        p_required_tokens: required_tokens,
      });
      if (deduct_error) {
        console.error("Token deduction error:", deduct_error.message);
        if (deduct_error.message.includes("Insufficient tokens")) {
          return NextResponse.json(
            { error: "Insufficient tokens", required_tokens, tokens },
            { status: 402 }
          );
        }
        return NextResponse.json(
          { error: "Failed to deduct tokens" },
          { status: 500 }
        );
      }
      // Increment pro_tokens_used
      const { error: pro_error } = await supabase
        .from("subscriptions")
        .update({ pro_tokens_used: (pro_tokens_used ?? 0) + required_tokens })
        .eq("user_id", user.id);
      if (pro_error) {
        console.error("Pro tokens update error:", pro_error.message);
        return NextResponse.json(
          { error: "Failed to update pro model usage" },
          { status: 500 }
        );
      }
    } else {
      // Non-pro model: only deduct from general tokens
      if (tokens < required_tokens) {
        return NextResponse.json(
          { error: "Insufficient tokens", required_tokens, tokens },
          { status: 402 }
        );
      }
      const { error: deduct_error } = await supabase.rpc("deduct_tokens", {
        p_user_id: user.id,
        p_required_tokens: required_tokens,
      });
      if (deduct_error) {
        console.error("Token deduction error:", deduct_error.message);
        if (deduct_error.message.includes("Insufficient tokens")) {
          return NextResponse.json(
            { error: "Insufficient tokens", required_tokens, tokens },
            { status: 402 }
          );
        }
        return NextResponse.json(
          { error: "Failed to deduct tokens" },
          { status: 500 }
        );
      }
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

    // Cache the result as a JSON object with metadata
    const cache_value = JSON.stringify({
      image_base64: base64,
      created_at: new Date().toISOString(),
      model_id: selected_model_id,
      prompt,
      width,
      height,
      mp_used: required_tokens
    });
    try {
      await redis.set(cache_key, cache_value, { ex: 3600 });
    } catch (err) {
      console.error('Redis set error:', err);
      // Fallback: do not cache if Redis is unavailable
    }

    // Return model cost in the response
    return NextResponse.json({ image_base64: base64, mp_used: required_tokens, model_cost: required_tokens });
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
