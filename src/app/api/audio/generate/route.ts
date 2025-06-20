import { NextRequest } from "next/server";
import { fal } from "@/lib/fal_client";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { api_error, api_success, handle_api_error } from "@/lib/utils/api/response";
import { apply_rate_limit } from "@/lib/utils/api/rate_limiter";
import { validate_request } from "@/lib/utils/api/validation";
import { require_auth, get_user_subscription } from "@/lib/utils/api/auth";
import { z } from "zod";
import { TTS_LIMITS, calculateTTSCost } from "@/app/tools/audio/types";
import { require_age_verification } from "@/lib/utils/api/age_verification";

// Types for fal.ai responses
interface FalAudioInput {
  text: string;
  audio_url?: string; // for voice cloning
  exaggeration?: number;
  cfg?: number;
  temperature?: number;
}

// Schema validation
const audio_generation_schema = z.object({
  text: z.string().min(1).max(TTS_LIMITS.max_text_length),
  voice: z.string().optional(),
  source_audio_url: z.string().url().optional(),
  high_quality_audio: z.boolean().default(true),
  exaggeration: z
    .number()
    .min(TTS_LIMITS.min_exaggeration)
    .max(TTS_LIMITS.max_exaggeration)
    .optional(),
  cfg: z.number().min(TTS_LIMITS.min_cfg).max(TTS_LIMITS.max_cfg).optional(),
  temperature: z
    .number()
    .min(TTS_LIMITS.min_temperature)
    .max(TTS_LIMITS.max_temperature)
    .optional(),
  seed: z.number().min(0).max(TTS_LIMITS.max_seed).optional(),
  use_webhook: z.boolean().default(true),
});

// Define custom rate limit configs for audio
const audio_rate_limit_standard = {
  requests: 60,
  window_seconds: 60,
  key_prefix: "rl:audio:std",
};

const audio_rate_limit_free = {
  requests: 10,
  window_seconds: 60,
  key_prefix: "rl:audio:free",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth();

    // 2. Check age verification
    const age_error = await require_age_verification();
    if (age_error) return age_error;

    // 3. Get user subscription
    const subscription = await get_user_subscription(user.user_id);
    const { plan, renewable_tokens, permanent_tokens } = subscription;
    const total_tokens = renewable_tokens + permanent_tokens;

    // 3. Apply rate limiting
    const rate_limit_config =
      plan === "standard" ? audio_rate_limit_standard : audio_rate_limit_free;
    const rate_limit_result = await apply_rate_limit(user.clerk_id, rate_limit_config);
    if (!rate_limit_result.allowed) {
      return api_error("Too many requests", 429);
    }

    // 4. Validate request
    const body = await req.json();
    const validated = validate_request(audio_generation_schema, body);

    // 5. Calculate cost
    const cost = calculateTTSCost(validated.text.length, plan);

    // 6. Check token balance
    if (total_tokens < cost) {
      return api_error("Insufficient tokens", 402);
    }

    // 7. Deduct tokens using stored function
    const service_supabase = get_service_role_client();
    const { error: deduct_error } = await service_supabase.rpc("deduct_tokens", {
      p_user_id: user.user_id,
      p_amount: cost,
      p_description: `Text-to-speech: ${validated.text.substring(0, 50)}...`,
    });

    if (deduct_error) {
      console.error("Token deduction error:", deduct_error);
      return api_error("Failed to deduct tokens", 500);
    }

    // 8. Create job record
    const job_id = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const { data: job, error: job_error } = await service_supabase
      .from("audio_jobs")
      .insert({
        user_id: user.user_id,
        job_id,
        status: "pending",
        type: "text",
        text: validated.text,
        voice: validated.voice,
        source_audio_url: validated.source_audio_url,
        high_quality_audio: validated.high_quality_audio,
        exaggeration: validated.exaggeration,
        cfg: validated.cfg,
        temperature: validated.temperature,
        seed: validated.seed,
        cost,
        metadata: {
          plan,
          text_length: validated.text.length,
        },
      })
      .select()
      .single();

    if (job_error || !job) {
      console.error("Job creation error:", job_error);
      // Refund tokens
      await service_supabase.rpc("deduct_tokens", {
        p_user_id: user.user_id,
        p_amount: -cost,
        p_description: "Refund: Failed to create audio job",
      });
      return api_error("Failed to create job", 500);
    }

    // 9. Prepare fal.ai request
    const fal_input: FalAudioInput = {
      text: validated.text,
    };

    // Add optional parameters
    // Use audio_url for voice cloning
    if (validated.source_audio_url) {
      fal_input.audio_url = validated.source_audio_url;
    }
    if (validated.exaggeration !== undefined) {
      fal_input.exaggeration = validated.exaggeration;
    }
    if (validated.cfg !== undefined) {
      fal_input.cfg = validated.cfg;
    }
    if (validated.temperature !== undefined) {
      fal_input.temperature = validated.temperature;
    }

    // 10. Determine if we should use webhook
    let webhook_url: string | undefined;
    if (validated.use_webhook) {
      const base_url =
        process.env.VERCEL_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        process.env.URL;

      if (base_url) {
        webhook_url = `https://${base_url.replace(/^https?:\/\//, "")}/api/webhooks/fal-ai`;
      }
    }

    try {
      // 11. Call fal.ai
      if (webhook_url) {
        // Async with webhook
        const result = await fal.queue.submit("resemble-ai/chatterboxhd/text-to-speech", {
          input: fal_input,
          webhookUrl: webhook_url,
        });

        // Update job with fal request ID
        await service_supabase
          .from("audio_jobs")
          .update({
            fal_request_id: result.request_id,
            status: "processing",
          })
          .eq("id", job.id);

        return api_success({
          job_id: job.job_id,
          status: "processing",
          message: "Audio generation started. Check status for updates.",
        });
      } else {
        // Throw error to trigger the error handling in the catch block and refund tokens
        throw new Error("Webhook URL not found");
      }
    } catch (fal_error) {
      console.error("fal.ai error:", fal_error);

      // Update job as failed
      await service_supabase
        .from("audio_jobs")
        .update({
          status: "failed",
          error: fal_error instanceof Error ? fal_error.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Refund tokens
      await service_supabase.rpc("deduct_tokens", {
        p_user_id: user.user_id,
        p_amount: -cost,
        p_description: "Refund: Audio generation failed",
      });

      throw fal_error;
    }
  } catch (error) {
    return handle_api_error(error);
  }
}
