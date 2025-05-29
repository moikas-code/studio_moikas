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

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SUPPORTED_ASPECTS = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    let rate;
    if (userId) {
      rate = await redis.incr(`video_rate:${userId}`);
      if (rate === 1) {
        await redis.expire(`video_rate:${userId}`, 60);
      }
      if (rate > 5) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again soon." },
          { status: 429 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const {
      prompt,
      negative_prompt = "",
      image_url,
      aspect,
      model_id,
      duration = 5,
    } = body;
    if (
      !prompt ||
      !image_url ||
      !SUPPORTED_ASPECTS[aspect as keyof typeof SUPPORTED_ASPECTS] ||
      !model_id
    ) {
      return NextResponse.json(
        { error: "Missing or invalid input." },
        { status: 400 }
      );
    }
    const selected_model = VIDEO_MODELS.find((m) => m.value === model_id);
    if (!selected_model) {
      return NextResponse.json(
        { error: "Invalid model selected." },
        { status: 400 }
      );
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
    try {
      await deduct_tokens({
        supabase,
        user_id: user_row.id,
        required_tokens: calculateGenerationMP(selected_model) * duration,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Insufficient tokens",
        },
        { status: 402 }
      );
    }
    // Call fal.ai video generation
    const result = (await fal.subscribe(model_id, {
      input: {
        prompt,
        negative_prompt,
        ...(selected_model.is_image_to_video && { image_url }),
        aspect_ratio: aspect,
        duration,
      },
    })) as unknown as { videos?: { url: string }[] };
    await track("Video Generation", {
      user_id: userId,
      aspect,
      prompt: prompt.slice(0, 128),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ video_url: result?.videos?.[0]?.url || null });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
