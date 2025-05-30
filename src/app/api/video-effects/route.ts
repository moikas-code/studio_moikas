import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import {
  calculateGenerationMP,
  deduct_tokens,
  VIDEO_MODELS,
} from "@/lib/generate_helpers";
import { track } from "@vercel/analytics/server";
import { fal } from "@fal-ai/client";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";


const SUPPORTED_ASPECTS = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

// Helper to upload a buffer as a File to FAL.AI
async function upload_buffer_to_fal(
  buffer: Buffer,
  filename: string,
  mime_type: string
) {
  const file = new File([buffer], filename, { type: mime_type });
  return await fal.storage.upload(file);
}

// Helper to fetch a remote image and upload to FAL.AI
async function upload_remote_image_to_fal(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch remote image: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const content_type = res.headers.get("content-type") || "image/png";
  return await upload_buffer_to_fal(buffer, "remote_image.png", content_type);
}

export async function POST(req: NextRequest) {
  // --- Refund mechanism variables ---
  let previous_renewable_tokens = 0;
  let previous_permanent_tokens = 0;
  let tokens_deducted = false;
  let user_id_for_refund: string | null = null;
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      prompt = "",
      negative_prompt = "",
      image_url = "",
      aspect = "16:9",
      model_id = "fal-ai/kling-video/v2.1/master/text-to-video",
      duration = 5,
      image_file_base64 = "", // Optionally support base64-encoded file
    } = body;
    if (
      !prompt ||
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
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Insufficient tokens",
        },
        { status: 402 }
      );
    }

    // --- Robust image handling for FAL.AI ---
    let final_image_url = image_url;
    if (selected_model.is_image_to_video) {
      if (image_file_base64) {
        // 1. User uploaded a file (base64-encoded)
        const buffer = Buffer.from(image_file_base64, "base64");
        final_image_url = await upload_buffer_to_fal(
          buffer,
          "user_upload.png",
          "image/png"
        );
      } else if (image_url && image_url.startsWith("http")) {
        // 2. User provided a URL (use directly, or optionally upload to FAL.AI for reliability)
        final_image_url = await upload_remote_image_to_fal(image_url);
        // final_image_url = image_url;
      } else {
        // 3. No image: use black PNG placeholder, upload to FAL.AI
        const black_png_buffer = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZkAAAAASUVORK5CYII=",
          "base64"
        );
        final_image_url = await upload_buffer_to_fal(
          black_png_buffer,
          "black.png",
          "image/png"
        );
      }
    }

    // Submit FAL.AI job and return job_id immediately
    let job_id: string;
    try {
      // Construct webhook URL
      const base_url = process.env.NEXT_PUBLIC_APP_URL || "https://studio.moikas.com";
      const webhook_url = `${base_url}/api/video-effects/webhook`;
      // Use the queue endpoint with fal_webhook as a query param
      const endpoint_with_webhook = `${model_id}?fal_webhook=${encodeURIComponent(webhook_url)}`;
      const falRes = await fal.queue.submit(endpoint_with_webhook, {
        input: {
          prompt,
          ...(negative_prompt.length > 0 && { negative_prompt }),
          ...(selected_model.is_image_to_video && {
            image_url: final_image_url,
          }),
          aspect_ratio: aspect,
          duration: duration.toString(),
        },
      });
      job_id = falRes.request_id;
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
      return NextResponse.json(
        { error: "Failed to start video job" },
        { status: 500 }
      );
    }

    // Store job metadata for analytics/history (optional, no polling required)
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
      return NextResponse.json(
        { error: "Failed to record video job" },
        { status: 500 }
      );
    }
    await track("Video Job Created", {
      user_id: userId,
      model_id,
      aspect,
      duration,
      job_id,
      timestamp: new Date().toISOString(),
    });
    // Return only the job_id and pending status
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
