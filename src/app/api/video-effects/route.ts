import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import {
  calculateGenerationMP,
  deduct_tokens,
  VIDEO_MODELS,
} from "@/lib/generate_helpers";
import { track } from "@vercel/analytics/server";
import { fal } from "@fal-ai/client";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUPPORTED_ASPECTS = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

function generate_video_job_cache_key(
  user_id: string,
  model_id: string,
  prompt: string,
  aspect: string,
  duration: number,
  image_url: string
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${prompt}:${aspect}:${duration}:${image_url}`)
    .digest("hex");
  return `videojob:${user_id}:${model_id}:${hash}`;
}

export async function POST(req: NextRequest) {
  // --- Refund mechanism variables ---
  let previous_renewable_tokens = 0;
  let previous_permanent_tokens = 0;
  let tokens_deducted = false;
  let user_id_for_refund: string | null = null;
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      prompt = "",
      negative_prompt = "",
      image_url = "",
      aspect = "16:9",
      model_id = "fal-ai/kling-video/v2.1/master/text-to-video",
      duration = 5,
    } = body;
    if (!prompt || !SUPPORTED_ASPECTS[aspect as keyof typeof SUPPORTED_ASPECTS] || !model_id) {
      return NextResponse.json({ error: "Missing or invalid input." }, { status: 400 });
    }
    const selected_model = VIDEO_MODELS.find((m) => m.value === model_id);
    if (!selected_model) {
      return NextResponse.json({ error: "Invalid model selected." }, { status: 400 });
    }

    // Generate cache key and check Redis for existing job
    const cache_key = generate_video_job_cache_key(
      userId,
      model_id,
      prompt,
      aspect,
      duration,
      image_url
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
        await track("Video Job Cache Hit", {
          user_id: userId,
          model_id,
          aspect,
          duration,
          cached: true,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({
          job_id: cached_obj.job_id,
          status: cached_obj.status,
          cached: true,
        });
      } catch (err) {
        console.error("Redis cached value parse error:", err, "Value:", cached);
      }
    } else if (cached) {
      console.warn("Redis cache value is not a valid JSON string:", cached);
    }

    // Deduct tokens (scale by duration)
    const supabase = await create_clerk_supabase_client_ssr();
    const { data: user_row, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();
    if (user_error || !user_row?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    user_id_for_refund = user_row.id;
    // --- Fetch current token balances before deduction ---
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("renewable_tokens, permanent_tokens")
      .eq("user_id", user_row.id)
      .single();
    previous_renewable_tokens = subscription?.renewable_tokens ?? 0;
    previous_permanent_tokens = subscription?.permanent_tokens ?? 0;
    try {
      await deduct_tokens({
        supabase,
        user_id: user_row.id,
        required_tokens: calculateGenerationMP(selected_model) * duration,
      });
      tokens_deducted = true;
    } catch (error) {
      await track("Video Job Token Deduction Failed", {
        user_id: userId,
        model_id,
        error: error instanceof Error ? error.message : "Insufficient tokens",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Insufficient tokens",
      }, { status: 402 });
    }
    // Start FAL.AI job (async, don't wait for result)
    let job_id: string;
    try {
      const fal_job = await fal.subscribe(model_id, {
        input: {
          prompt,
          negative_prompt,
          ...(selected_model.is_image_to_video && { image_url }),
          aspect_ratio: aspect,
          duration,
        },
        logs: false,
      });
      // Type-safe extraction of job_id
      if (
        fal_job &&
        typeof fal_job === "object" &&
        fal_job !== null &&
        "id" in fal_job &&
        typeof (fal_job as Record<string, unknown>).id === "string"
      ) {
        job_id = (fal_job as Record<string, string>).id;
      } else {
        job_id = uuidv4();
      }
    } catch (err) {
      // --- Refund tokens if job creation fails ---
      if (tokens_deducted && user_id_for_refund) {
        await supabase
          .from("subscriptions")
          .update({
            renewable_tokens: previous_renewable_tokens,
            permanent_tokens: previous_permanent_tokens,
          })
          .eq("user_id", user_id_for_refund);
      }
      await track("Video Job Creation Failed", {
        user_id: userId,
        model_id,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Failed to start video job" }, { status: 500 });
    }
    // Store job in Supabase
    try {
      await supabase.from("video_jobs").insert({
        id: uuidv4(),
        user_id: user_row.id,
        job_id,
        status: "pending",
        prompt,
        negative_prompt,
        model_id,
        aspect,
        duration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      // --- Refund tokens if DB insert fails ---
      if (tokens_deducted && user_id_for_refund) {
        await supabase
          .from("subscriptions")
          .update({
            renewable_tokens: previous_renewable_tokens,
            permanent_tokens: previous_permanent_tokens,
          })
          .eq("user_id", user_id_for_refund);
      }
      await track("Video Job DB Insert Failed", {
        user_id: userId,
        model_id,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Failed to record video job" }, { status: 500 });
    }
    // Cache the job metadata
    const cache_value = JSON.stringify({
      job_id,
      status: "pending",
      model_id,
      aspect,
      duration,
      prompt,
      image_url,
      created_at: new Date().toISOString(),
    });
    try {
      await redis.set(cache_key, cache_value, { ex: 3600 }); // 1 hour expiry
    } catch (err) {
      console.error("Redis set error:", err);
    }
    await track("Video Job Created", {
      user_id: userId,
      model_id,
      aspect,
      duration,
      job_id,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ job_id, status: "pending" });
  } catch (err) {
    // --- Refund tokens if any other error occurs after deduction ---
    if (tokens_deducted && user_id_for_refund) {
      const supabase = await create_clerk_supabase_client_ssr();
      await supabase
        .from("subscriptions")
        .update({
          renewable_tokens: previous_renewable_tokens,
          permanent_tokens: previous_permanent_tokens,
        })
        .eq("user_id", user_id_for_refund);
    }
    await track("Video Job Server Error", {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
