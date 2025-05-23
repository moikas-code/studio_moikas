/**
 * Helper functions for image generation API (centralized).
 * All identifiers use snake_case.
 */
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate required tokens (megapixels) for a given image size.
 */
export function calculate_required_tokens(
  width: number,
  height: number
): number {
  const megapixels = (width * height) / 1_000_000;
  return Math.floor(megapixels);
}

/**
 * Get the token limit for a given plan.
 */
export function get_plan_limit(plan: string): number {
  if (plan === "standard") return 4000;
  return 100; // default to free
}

const FREE_MODELS = [
  {
    value: "fal-ai/sana",
    label: "SANA Base",
    cost: 1,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/sana/sprint",
    label: "SANA Fast",
    cost: 1,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux/schnell",
    label: "FLUX.1 [schnell]",
    cost: 1,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/luma-photon/flash",
    label: "Luma Photon Flash",
    cost: 1,
    plans: ["free", "standard"],
  },
];

// Export free model IDs for use elsewhere
export const FREE_MODEL_IDS = FREE_MODELS.map((m) => m.value);

// Centralized model options and cost logic
export const MODEL_OPTIONS = [
  ...FREE_MODELS,
  {
    value: "fal-ai/aura-flow",
    label: "AURA-Flow",
    cost: 5,
    plans: ["standard"],
  },
  {
    value: "fal-ai/flux/dev",
    label: "FLUX.1 [dev]",
    cost: 8,
    plans: ["standard"],
  },
  {
    value: "fal-ai/flux-pro",
    label: "FLUX.1 [pro]",
    cost: 17,
    plans: ["standard"],
  },
];

// Export standard model IDs for use elsewhere
export const STANDARD_MODEL_IDS = MODEL_OPTIONS.filter((m) => m.plans.includes("standard")).map((m) => m.value);

export function get_model_cost(plan: string, model_id: string): number {
  const model = MODEL_OPTIONS.find((m) => m.value === model_id);
  if (!model) return 1;
  if (
    plan === "free" &&
    !["fal-ai/flux/schnell", "fal-ai/aura-flow", "fal-ai/sana/sprint"].includes(
      model.value
    )
  )
    return 1;
  return model.cost;
}

/**
 * Check if a new month has started since last_reset (ISO string).
 */
export function is_new_month(last_reset: string | null): boolean {
  if (!last_reset) return true;
  const last = new Date(last_reset);
  const now = new Date();
  return (
    last.getUTCFullYear() !== now.getUTCFullYear() ||
    last.getUTCMonth() !== now.getUTCMonth()
  );
}

/**
 * Per-user sliding window rate-limiting using Redis sorted set.
 * Returns { allowed, remaining, reset }.
 */
export async function check_rate_limit(
  redis: Redis,
  user_id: string,
  max_requests = 20,
  window_seconds = 60
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:${user_id}`;
  const now = Math.floor(Date.now() / 1000);
  const window_start = now - window_seconds;
  await redis.zremrangebyscore(key, 0, window_start);
  const count = (await redis.zcard(key)) as number;
  if (count >= max_requests) {
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    let reset: number;
    if (oldest && oldest.length > 1 && typeof oldest[1] === "string") {
      reset = parseInt(oldest[1]) + window_seconds;
    } else {
      reset = now + window_seconds;
    }
    return { allowed: false, remaining: 0, reset };
  }
  await redis.zadd(key, { score: now, member: `${now}` });
  await redis.expire(key, window_seconds);
  return {
    allowed: true,
    remaining: Math.max(0, max_requests - count - 1),
    reset: now + window_seconds,
  };
}

/**
 * Generate a namespaced Redis cache key for image generation.
 * Key format: imggen:{user_id}:{model_id}:{hash}
 */
export function generate_imggen_cache_key(
  user_id: string,
  model_id: string,
  prompt: string,
  width: number,
  height: number
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${prompt}:${width}:${height}`)
    .digest("hex");
  return `imggen:${user_id}:${model_id}:${hash}`;
}

/**
 * Deduct tokens from a user's account, prioritizing renewable tokens before permanent tokens.
 * Throws an error if the user has insufficient tokens.
 * Returns the updated token balances.
 */
export async function deduct_tokens({
  supabase,
  user_id,
  required_tokens,
}: {
  supabase: SupabaseClient;
  user_id: string;
  required_tokens: number;
}): Promise<{ renewable_tokens: number; permanent_tokens: number }> {
  // Fetch current token balances
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("renewable_tokens, permanent_tokens")
    .eq("user_id", user_id)
    .single();
  if (error || !subscription) {
    throw new Error("Subscription not found");
  }
  let renewable_tokens = subscription.renewable_tokens ?? 0;
  let permanent_tokens = subscription.permanent_tokens ?? 0;
  let to_deduct = required_tokens;
  if (renewable_tokens >= to_deduct) {
    renewable_tokens -= to_deduct;
    to_deduct = 0;
  } else {
    to_deduct -= renewable_tokens;
    renewable_tokens = 0;
    if (permanent_tokens >= to_deduct) {
      permanent_tokens -= to_deduct;
      to_deduct = 0;
    } else {
      throw new Error("Insufficient tokens");
    }
  }
  // Update tokens in Supabase
  const { error: update_error } = await supabase
    .from("subscriptions")
    .update({ renewable_tokens, permanent_tokens })
    .eq("user_id", user_id);
  if (update_error) {
    throw new Error("Failed to deduct tokens");
  }
  return { renewable_tokens, permanent_tokens };
}

// Calculate pixel-based cost
export function get_tokens_for_size(width: number, height: number) {
  const megapixels = (width * height) / 1_000_000;
  return megapixels <= 1.05 ? 1 : Math.ceil(megapixels);
}

// Helper to add overlay text to image (bottom right corner)
export async function add_overlay_to_image(base64: string, overlay_text = "studio.moikas.com"): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");
      ctx.drawImage(img, 0, 0);

      // Set overlay style
      const font_size = Math.max(16, Math.floor(img.height * 0.04));
      ctx.font = `bold ${font_size}px sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#000";
      // Draw background for text for better visibility
      const text_width = ctx.measureText(overlay_text).width;
      const padding = 8;
      const margin = 12;
      ctx.fillRect(
        canvas.width - text_width - 2 * padding - margin,
        canvas.height - font_size - padding - margin,
        text_width + 2 * padding,
        font_size + 2 * padding
      );
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#fff";
      ctx.fillText(
        overlay_text,
        canvas.width - margin - padding,
        canvas.height - margin - padding
      );
      resolve(canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""));
    };
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}

/**
 * Logs events and errors for auditing and debugging.
 * Extend this to log to external services (e.g., Sentry, Logtail, Datadog) as needed.
 */
export function log_event(event_type: string, details: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] [${event_type}]`, details);
}
