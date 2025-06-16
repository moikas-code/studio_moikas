/**
 * Main health monitoring orchestrator
 */

import {
  check_database_health,
  check_redis_health,
  check_fal_health,
  check_stripe_health,
  check_clerk_health,
  check_xai_health,
} from "./service_checks";
import {
  ServiceHealth,
  HealthCheckResponse,
  OverallStatus,
  ServiceStatus,
  ServiceCheckResult,
  CRITICAL_SERVICES,
} from "./types";

// Cache for public endpoint
let cached_result: HealthCheckResponse | null = null;
let cache_timestamp: number = 0;
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Map service check result to service health status
 */
function map_to_service_health(result: {
  healthy: boolean;
  responseTime: number;
  error?: string;
}): ServiceHealth {
  let status: ServiceStatus = "operational";

  if (!result.healthy) {
    status = "down";
  } else if (result.responseTime > 2000) {
    status = "degraded";
  }

  return {
    status,
    responseTime: result.responseTime,
    lastChecked: new Date(),
    error: result.error,
  };
}

/**
 * Determine overall status based on individual service statuses
 */
function determine_overall_status(services: Record<string, ServiceHealth>): OverallStatus {
  const service_entries = Object.entries(services);

  // Check if any critical services are down
  const critical_down = service_entries.some(
    ([name, health]) => CRITICAL_SERVICES.includes(name) && health.status === "down"
  );

  if (critical_down) {
    return "outage";
  }

  // Check if any service is down or degraded
  const any_down = service_entries.some(([, health]) => health.status === "down");
  const any_degraded = service_entries.some(([, health]) => health.status === "degraded");

  if (any_down || any_degraded) {
    return "degraded";
  }

  return "operational";
}

/**
 * Run all health checks in parallel
 */
export async function run_health_checks(use_cache: boolean = false): Promise<HealthCheckResponse> {
  // Check cache for public endpoint
  if (use_cache && cached_result && Date.now() - cache_timestamp < CACHE_DURATION) {
    return {
      ...cached_result,
      cached: true,
    };
  }

  // Run all checks in parallel
  const [database, redis, fal, stripe, clerk, xai] = await Promise.allSettled([
    check_database_health(),
    check_redis_health(),
    check_fal_health(),
    check_stripe_health(),
    check_clerk_health(),
    check_xai_health(),
  ]);

  // Process results
  const services: Record<string, ServiceHealth> = {
    database: map_to_service_health(
      database.status === "fulfilled"
        ? database.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
    cache: map_to_service_health(
      redis.status === "fulfilled"
        ? redis.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
    "image-generation": map_to_service_health(
      fal.status === "fulfilled"
        ? fal.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
    payments: map_to_service_health(
      stripe.status === "fulfilled"
        ? stripe.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
    authentication: map_to_service_health(
      clerk.status === "fulfilled"
        ? clerk.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
    "ai-agents": map_to_service_health(
      xai.status === "fulfilled"
        ? xai.value
        : { healthy: false, responseTime: 0, error: "Check failed" }
    ),
  };

  const result: HealthCheckResponse = {
    status: determine_overall_status(services),
    services,
    timestamp: new Date(),
    cached: false,
  };

  // Update cache
  if (use_cache) {
    cached_result = result;
    cache_timestamp = Date.now();
  }

  return result;
}

/**
 * Get health check for a specific service
 */
export async function get_service_health(service: string): Promise<ServiceHealth | null> {
  const check_map: Record<string, () => Promise<ServiceCheckResult>> = {
    database: check_database_health,
    cache: check_redis_health,
    "image-generation": check_fal_health,
    payments: check_stripe_health,
    authentication: check_clerk_health,
    "ai-agents": check_xai_health,
  };

  const check_function = check_map[service];
  if (!check_function) {
    return null;
  }

  try {
    const result = await check_function();
    return map_to_service_health(result);
  } catch (error) {
    return map_to_service_health({
      healthy: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : "Check failed",
    });
  }
}
