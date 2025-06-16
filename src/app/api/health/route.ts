import { NextRequest } from "next/server";
import { run_health_checks } from "@/lib/utils/health/health_monitor";
import { api_success, api_error } from "@/lib/utils/api/response";
import { get_redis_client } from "@/lib/utils/database/redis";

// Public health endpoint with caching and rate limiting
export async function GET(req: NextRequest) {
  try {
    // Rate limiting for public endpoint
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const redis = get_redis_client();

    if (redis) {
      const rate_limit_key = `health:rate:${ip}`;
      const requests = await redis.incr(rate_limit_key);

      if (requests === 1) {
        await redis.expire(rate_limit_key, 60); // 1 minute window
      }

      if (requests > 10) {
        return api_error("Rate limit exceeded", 429);
      }
    }

    // Run health checks with caching enabled
    const health_data = await run_health_checks(true);

    // Sanitize response for public consumption
    const public_response = {
      status: health_data.status,
      services: Object.entries(health_data.services).reduce(
        (acc, [name, health]) => {
          acc[name] = {
            status: health.status,
            responseTime: health.responseTime,
          };
          return acc;
        },
        {} as Record<string, { status: string; responseTime: number }>
      ),
      timestamp: health_data.timestamp,
      cached: health_data.cached,
    };

    // Set appropriate status code based on health
    const status_code = health_data.status === "operational" ? 200 : 503;

    return api_success(public_response, undefined, status_code);
  } catch (error) {
    console.error("Health check error:", error);
    return api_error("Health check failed", 500);
  }
}
