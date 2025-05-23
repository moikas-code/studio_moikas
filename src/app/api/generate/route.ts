import { NextRequest, NextResponse } from "next/server";
import { generate_flux_image } from "@/lib/fal_client";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { auth } from "@clerk/nextjs/server";
import { track } from "@vercel/analytics/server";
import { Redis } from "@upstash/redis";
import {
  check_rate_limit,
  generate_imggen_cache_key,
  get_model_cost,
  get_tokens_for_size,
  FREE_MODEL_IDS,
  STANDARD_MODEL_IDS,
} from "@/lib/generate_helpers";
import { SupabaseClient } from "@supabase/supabase-js";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis key schema:
// imggen:{user_id}:{model_id}:{hash} => { image_base64: string, created_at: string, ... }

export async function POST(req: NextRequest) {
  let selected_model_id: string = "";
  let plan: string = "";
  // --- Refund mechanism variables ---
  let previous_renewable_tokens = 0;
  let previous_permanent_tokens = 0;
  let previous_premium_generations_used = 0;
  let tokens_deducted = false;
  let user: { id: string; stripe_customer_id?: string | null } | null = null;
  let supabase: SupabaseClient | null = null;
  // --- Move prompt and body variables here ---
  let prompt: string = "";
  let body: Record<string, unknown> = {};
  let width: number = 1024;
  let height: number = 1024;
  let model_id: string = "";
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine user plan and queue type
    const is_standard = plan === "standard";
    // Apply different rate limits
    const rate = await check_rate_limit(
      redis,
      userId,
      is_standard ? 60 : 10,
      60
    ); // 60/min for standard, 10/min for free
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rate.remaining.toString(),
            "X-RateLimit-Reset": rate.reset.toString(),
          },
        }
      );
    }
    // Artificial delay for free users (slow queue)
    if (!is_standard) {
      await new Promise((res) => setTimeout(res, 2000)); // 2s delay for free users
    }

    // Parse and validate request body
    body = await req.json();
    console.log('Received /api/generate body:', body);
    prompt = typeof body.prompt === "string" ? body.prompt : "";
    width = typeof body.width === "number" ? body.width : 1024;
    height = typeof body.height === "number" ? body.height : 1024;
    model_id = typeof body.model_id === "string" ? body.model_id : "";
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Determine width and height from aspect_ratio
    if (typeof body.aspect_ratio === "string") {
      // Map aspect_ratio to width/height
      const aspect_map: Record<string, { width: number; height: number }> = {
        portrait_4_3: { width: 800, height: 1066 },
        portrait_16_9: { width: 896, height: 1600 },
        square: { width: 1024, height: 1024 },
        square_hd: { width: 1536, height: 1536 },
        landscape_4_3: { width: 1066, height: 800 },
        landscape_16_9: { width: 1600, height: 896 },
      };
      if (aspect_map[body.aspect_ratio]) {
        width = aspect_map[body.aspect_ratio].width;
        height = aspect_map[body.aspect_ratio].height;
      }
    }

    const size_tokens = get_tokens_for_size(width, height);
    const model_tokens = get_model_cost(plan, model_id);
    const required_tokens = size_tokens * model_tokens;

    // Caching: hash the request params and use a namespaced key
    const safe_user_id = typeof userId === "string" ? userId : "";
    const safe_prompt = typeof prompt === "string" ? prompt : "";
    const safe_model_id = typeof model_id === "string" ? model_id : "";
    const cache_key = generate_imggen_cache_key(
      safe_user_id,
      safe_model_id,
      safe_prompt,
      width,
      height
    );
    let cached: unknown;
    try {
      cached = await redis.get(cache_key);
    } catch (err) {
      console.error("Redis get error:", err);
      cached = null;
    }
    if (typeof cached === "string" && cached.trim().startsWith("{")) {
      try {
        const cached_obj = JSON.parse(cached);
        return NextResponse.json({
          image_base64: cached_obj.image_base64,
          mp_used: cached_obj.mp_used,
          cached: true,
        });
      } catch (err) {
        console.error("Redis cached value parse error:", err, "Value:", cached);
      }
    } else if (cached) {
      console.warn("Redis cache value is not a valid JSON string:", cached);
    }

    // Initialize Supabase client
    supabase = await create_clerk_supabase_client_ssr();

    // Fetch user and subscription data
    const { data: user_data, error: user_error } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("clerk_id", userId)
      .single();
    user = user_data;

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.stripe_customer_id) {
      return NextResponse.json({ error: "Account issue: Stripe customer not linked. Please contact support." }, { status: 400 });
    }

    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select(
        "plan, renewed_at, premium_generations_used, renewable_tokens, permanent_tokens"
      )
      .eq("user_id", user.id)
      .single();

    if (sub_error || !subscription) {
      console.error("Subscription fetch error:", sub_error?.message);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    plan = subscription.plan;
    const renewable_tokens = subscription.renewable_tokens ?? 0;
    const permanent_tokens = subscription.permanent_tokens ?? 0;
    // --- Store previous token state for refund logic ---
    previous_renewable_tokens = renewable_tokens;
    previous_permanent_tokens = permanent_tokens;
    previous_premium_generations_used =
      subscription.premium_generations_used ?? 0;

    // Restrict model access by plan
    selected_model_id = model_id;
    if (plan === "free") {
      if (!selected_model_id || !FREE_MODEL_IDS.includes(selected_model_id)) {
        selected_model_id = FREE_MODEL_IDS[0];
      }
      if (model_id && !FREE_MODEL_IDS.includes(model_id)) {
        return NextResponse.json(
          {
            error:
              `Free users can only use: ${FREE_MODEL_IDS.join(", ")}`,
          },
          { status: 403 }
        );
      }
    } else if (plan === "standard") {
      if (!selected_model_id) {
        selected_model_id = "fal-ai/flux/dev";
      }
      if (!STANDARD_MODEL_IDS.includes(selected_model_id)) {
        return NextResponse.json(
          {
            error:
              `Standard users can only use: ${STANDARD_MODEL_IDS.join(", ")}`,
          },
          { status: 403 }
        );
      }
    } else {
      // fallback: only allow schnell
      selected_model_id = "fal-ai/flux/schnell";
    }

    // Special logic for pro model monthly cap
    if (plan === "standard" && selected_model_id === "fal-ai/flux-pro") {
      if (subscription.premium_generations_used >= 100) {
        return NextResponse.json(
          { error: "Premium generation limit reached (100)." },
          { status: 403 }
        );
      }
      // Deduct from renewable first, then permanent if needed
      let to_deduct = required_tokens;
      let new_renewable = renewable_tokens;
      let new_permanent = permanent_tokens;
      if (renewable_tokens >= to_deduct) {
        new_renewable -= to_deduct;
        to_deduct = 0;
      } else {
        to_deduct -= renewable_tokens;
        new_renewable = 0;
        if (permanent_tokens >= to_deduct) {
          new_permanent -= to_deduct;
          to_deduct = 0;
        } else {
          return NextResponse.json(
            {
              error: "Insufficient tokens",
              required_tokens,
              renewable_tokens,
              permanent_tokens,
            },
            { status: 402 }
          );
        }
      }
      // Update tokens in Supabase
      const { error: update_error } = await supabase
        .from("subscriptions")
        .update({
          renewable_tokens: new_renewable,
          permanent_tokens: new_permanent,
          premium_generations_used: subscription.premium_generations_used + 1,
        })
        .eq("user_id", user.id);
      if (update_error) {
        console.error("Token deduction error:", update_error.message);
        return NextResponse.json(
          { error: "Failed to deduct tokens" },
          { status: 500 }
        );
      }
      // --- Mark deduction for refund logic ---
      tokens_deducted = true;
    } else {
      // Non-pro model: deduct from renewable first, then permanent if needed
      let to_deduct = required_tokens;
      let new_renewable = renewable_tokens;
      let new_permanent = permanent_tokens;
      if (renewable_tokens >= to_deduct) {
        new_renewable -= to_deduct;
        to_deduct = 0;
      } else {
        to_deduct -= renewable_tokens;
        new_renewable = 0;
        if (permanent_tokens >= to_deduct) {
          new_permanent -= to_deduct;
          to_deduct = 0;
        } else {
          return NextResponse.json(
            {
              error: "Insufficient tokens",
              required_tokens,
              renewable_tokens,
              permanent_tokens,
            },
            { status: 402 }
          );
        }
      }
      // Update tokens in Supabase
      const { error: update_error } = await supabase
        .from("subscriptions")
        .update({
          renewable_tokens: new_renewable,
          permanent_tokens: new_permanent,
        })
        .eq("user_id", user.id);
      if (update_error) {
        console.error("Token deduction error:", update_error.message);
        return NextResponse.json(
          { error: "Failed to deduct tokens" },
          { status: 500 }
        );
      }
      // --- Mark deduction for refund logic ---
      tokens_deducted = true;
    }

    // Prepare sana options if model is fal-ai/sana
    const sana_options =
      model_id === "fal-ai/sana"
        ? {
            negative_prompt:
              typeof body.negative_prompt === "string"
                ? body.negative_prompt
                : undefined,
            num_inference_steps:
              typeof body.num_inference_steps === "number"
                ? body.num_inference_steps
                : undefined,
            seed:
              typeof body.seed === "number"
                ? body.seed
                : undefined,
            style_name:
              typeof body.style_name === "string"
                ? body.style_name
                : undefined,
          }
        : {};
    console.log('SANA options for fal_client:', sana_options);

    // Generate the image
    const result = await generate_flux_image(
      prompt,
      width,
      height,
      selected_model_id,
      sana_options
    );
    // Extract image URL and convert to base64
    const image_url = result.data?.images?.[0]?.url;
    let image_base64 = null;
    if (image_url) {
      const response = await fetch(image_url);
      const arrayBuffer = await response.arrayBuffer();
      image_base64 = Buffer.from(arrayBuffer).toString("base64");
    }

    // On successful generation
    await track("Image Generated", {
      status: "success",
      model_id: selected_model_id ?? "unknown",
      plan: plan ?? "unknown",
      prompt_length: prompt.length,
      timestamp: new Date().toISOString(),
    });

    // Cache the result as a JSON object with metadata
    const cache_value = JSON.stringify({
      image_base64,
      created_at: new Date().toISOString(),
      model_id: selected_model_id,
      prompt,
      width,
      height,
      mp_used: required_tokens,
    });
    try {
      await redis.set(cache_key, cache_value, { ex: 3600 });
    } catch (err) {
      console.error("Redis set error:", err);
      // Fallback: do not cache if Redis is unavailable
    }

    // Return model cost in the response
    return NextResponse.json({
      image_base64,
      mp_used: required_tokens,
      model_cost: required_tokens,
      model_id: selected_model_id,
      width,
      height,
      plan,
      enhancement_mp: body.enhancement_mp || 0,
    });
  } catch (error: unknown) {
    // --- Refund logic: If tokens were deducted but image generation failed, refund tokens ---
    if (tokens_deducted && user && supabase) {
      try {
        const update_data: Record<string, unknown> = {
          renewable_tokens: previous_renewable_tokens,
          permanent_tokens: previous_permanent_tokens,
        };
        if (plan === "standard" && selected_model_id === "fal-ai/flux-pro") {
          update_data.premium_generations_used =
            previous_premium_generations_used;
        }
        await supabase
          .from("subscriptions")
          .update(update_data)
          .eq("user_id", user.id);
        // Optionally log refund success
        console.log(
          "[Refund] Tokens refunded due to image generation failure."
        );
      } catch (refund_error) {
        // Optionally log refund failure for manual review
        console.error("[Refund] Failed to refund tokens:", refund_error);
      }
    }
    if (error instanceof Error) {
      console.error("Image generation error:", error.message);
      await track("Image Generation Failed", {
        status: "error",
        model_id: selected_model_id ?? "unknown",
        plan: plan ?? "unknown",
        prompt_length: typeof prompt === "string" ? prompt.length : 0,
        error_message: error.message.slice(0, 255),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown image generation error:", error);
    await track("Image Generation Failed", {
      status: "error",
      model_id: selected_model_id ?? "unknown",
      plan: "unknown",
      prompt_length: typeof prompt === "string" ? prompt.length : 0,
      error_message: "Unknown error",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
