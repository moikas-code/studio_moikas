/**
 * Health check type definitions
 */

export type ServiceStatus = "operational" | "degraded" | "down";
export type OverallStatus = "operational" | "degraded" | "outage";

export interface ServiceHealth {
  status: ServiceStatus;
  responseTime: number; // milliseconds
  lastChecked: Date;
  error?: string;
}

export interface HealthCheckResponse {
  status: OverallStatus;
  services: Record<string, ServiceHealth>;
  timestamp: Date;
  cached?: boolean;
}

export interface ServiceCheckResult {
  healthy: boolean;
  responseTime: number;
  error?: string;
}

export const CRITICAL_SERVICES = ["database", "authentication"];
export const SERVICE_TIMEOUT = 5000; // 5 seconds
export const CACHE_DURATION = 5000; // 5 seconds for public endpoint
