import { check_admin_access } from "@/lib/utils/api/admin";
import { run_health_checks } from "@/lib/utils/health/health_monitor";
import { api_success, api_error } from "@/lib/utils/api/response";
import { get_redis_client } from "@/lib/utils/database/redis";

// Admin health endpoint with detailed information
export async function GET() {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Unauthorized", 401);
    }

    // Rate limiting for admin endpoint (more generous)
    const redis = get_redis_client();
    if (redis) {
      const rate_limit_key = `health:admin:rate:${admin_check.user_id}`;
      const requests = await redis.incr(rate_limit_key);

      if (requests === 1) {
        await redis.expire(rate_limit_key, 60); // 1 minute window
      }

      if (requests > 30) {
        return api_error("Rate limit exceeded", 429);
      }
    }

    // Run health checks without caching for real-time data
    const health_data = await run_health_checks(false);

    // Return full details for admin
    const status_code = health_data.status === "operational" ? 200 : 503;

    return api_success(health_data, undefined, status_code);
  } catch (error) {
    console.error("Admin health check error:", error);
    return api_error("Health check failed", 500);
  }
}
