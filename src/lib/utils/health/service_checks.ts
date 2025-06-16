/**
 * Individual service health check implementations
 */

import { get_service_role_client } from "@/lib/utils/database/supabase";
import { get_redis_client } from "@/lib/utils/database/redis";
import { ServiceCheckResult, SERVICE_TIMEOUT } from "./types";
import Stripe from "stripe";

/**
 * Check Supabase database health
 */
export async function check_database_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    const supabase = get_service_role_client();

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SERVICE_TIMEOUT);

    const { error } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);
    const responseTime = Date.now() - start;

    return {
      healthy: !error,
      responseTime,
      error: error?.message,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Database check failed",
    };
  }
}

/**
 * Check Redis/Upstash health
 */
export async function check_redis_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    const redis = get_redis_client();

    if (!redis) {
      return {
        healthy: false,
        responseTime: 0,
        error: "Redis not configured",
      };
    }

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Redis check timeout")), SERVICE_TIMEOUT);
    });

    // Race between redis operations and timeout
    await Promise.race([
      (async () => {
        await redis.ping();
        await redis.setex("health:check", 10, "ok");
        const value = await redis.get("health:check");
        if (value !== "ok") throw new Error("Redis read/write test failed");
      })(),
      timeoutPromise,
    ]);

    const responseTime = Date.now() - start;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Redis check failed",
    };
  }
}

/**
 * Check fal.ai API health
 */
export async function check_fal_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    if (!process.env.FAL_KEY) {
      return {
        healthy: false,
        responseTime: 0,
        error: "FAL_KEY not configured",
      };
    }

    // Check fal.ai status using their public status API
    const response = await fetch("https://status.fal.ai/summary.json", {
      method: "GET",
      signal: AbortSignal.timeout(SERVICE_TIMEOUT),
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      return {
        healthy: false,
        responseTime,
        error: `Status API returned ${response.status}`,
      };
    }

    const data = await response.json();

    // Check if fal.ai reports their service as UP
    const healthy = data.page?.status === "UP";

    return {
      healthy,
      responseTime,
      error: healthy ? undefined : `fal.ai status: ${data.page?.status || "unknown"}`,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "fal.ai check failed",
    };
  }
}

/**
 * Check Stripe API health
 */
export async function check_stripe_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        healthy: false,
        responseTime: 0,
        error: "Stripe not configured",
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
      timeout: SERVICE_TIMEOUT,
    });

    // List products with minimal data
    await stripe.products.list({ limit: 1 });

    const responseTime = Date.now() - start;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Stripe check failed",
    };
  }
}

/**
 * Check Clerk authentication health
 */
export async function check_clerk_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return {
        healthy: false,
        responseTime: 0,
        error: "Clerk not configured",
      };
    }

    // Check Clerk API by fetching minimal user data
    const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(SERVICE_TIMEOUT),
    });

    const responseTime = Date.now() - start;

    return {
      healthy: response.ok,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Clerk check failed",
    };
  }
}

/**
 * Check xAI API health (optional service)
 */
export async function check_xai_health(): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    if (!process.env.XAI_API_KEY) {
      // xAI is optional, so no API key is not an error
      return {
        healthy: true,
        responseTime: 0,
      };
    }

    // Check xAI API by listing models
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(SERVICE_TIMEOUT),
    });

    const responseTime = Date.now() - start;

    return {
      healthy: response.ok,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "xAI check failed",
    };
  }
}
