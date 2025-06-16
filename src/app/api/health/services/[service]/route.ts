import { NextRequest } from "next/server";
import { check_admin_access } from "@/lib/utils/api/admin";
import { get_service_health } from "@/lib/utils/health/health_monitor";
import { api_success, api_error } from "@/lib/utils/api/response";

// Individual service health check endpoint (admin only)
export async function GET(req: NextRequest, { params }: { params: Promise<{ service: string }> }) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Unauthorized", 401);
    }

    const { service: service_name } = await params;
    const valid_services = [
      "database",
      "cache",
      "image-generation",
      "payments",
      "authentication",
      "ai-agents",
    ];

    if (!valid_services.includes(service_name)) {
      return api_error("Invalid service name", 400);
    }

    // Get health for specific service
    const health = await get_service_health(service_name);

    if (!health) {
      return api_error("Service not found", 404);
    }

    const status_code = health.status === "operational" ? 200 : 503;

    return api_success(
      {
        service: service_name,
        health,
      },
      undefined,
      status_code
    );
  } catch (error) {
    console.error("Service health check error:", error);
    return api_error("Health check failed", 500);
  }
}
