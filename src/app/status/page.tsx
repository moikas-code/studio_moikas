"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Clock, Wifi, WifiOff } from "lucide-react";

type ServiceStatus = "operational" | "degraded" | "down";
type OverallStatus = "operational" | "degraded" | "outage";

type Service = {
  name: string;
  display_name: string;
  status: ServiceStatus;
  description: string;
  responseTime?: number;
  lastChecked: Date;
  error?: string;
};

type HealthData = {
  status: OverallStatus;
  services: Record<
    string,
    {
      status: ServiceStatus;
      responseTime: number;
      error?: string;
    }
  >;
  timestamp: string;
  cached?: boolean;
};

const SERVICE_DISPLAY_NAMES: Record<string, { name: string; description: string }> = {
  database: { name: "Database", description: "Core data storage" },
  cache: { name: "Cache/Redis", description: "Performance optimization" },
  "image-generation": { name: "Image Generation", description: "AI image models" },
  payments: { name: "Payment Processing", description: "Stripe integration" },
  authentication: { name: "Authentication", description: "User login system" },
  "ai-agents": { name: "AI Agents", description: "MEMU workflow system" },
};

export default function StatusPage() {
  const [services, set_services] = useState<Service[]>([]);
  const [overall_status, set_overall_status] = useState<OverallStatus>("operational");
  const [is_checking, set_is_checking] = useState(false);
  const [last_updated, set_last_updated] = useState(new Date());
  const [is_online, set_is_online] = useState(true);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [auto_refresh, set_auto_refresh] = useState(true);

  const get_status_icon = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const get_status_color = (status: ServiceStatus) => {
    switch (status) {
      case "operational":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "degraded":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "down":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    }
  };

  const get_response_time_color = (time?: number) => {
    if (!time) return "text-gray-500";
    if (time < 500) return "text-green-600";
    if (time < 2000) return "text-yellow-600";
    return "text-red-600";
  };

  const get_overall_status_text = () => {
    switch (overall_status) {
      case "operational":
        return "All Systems Operational";
      case "degraded":
        return "Partial Service Disruption";
      case "outage":
        return "Major Service Outage";
    }
  };

  const fetch_status = useCallback(async () => {
    set_is_checking(true);
    set_error_message(null);

    try {
      const response = await fetch("/api/health", {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Check for rate limiting or other errors that don't return data
      if (!response.ok && response.status !== 503) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // If it's a 503 but no data, that's an actual error
      if (response.status === 503 && !data?.data) {
        throw new Error("Service unavailable");
      }
      const health_data = data.data as HealthData;

      // Map API response to service array
      const mapped_services: Service[] = Object.entries(health_data.services).map(
        ([key, service]) => {
          const display = SERVICE_DISPLAY_NAMES[key] || { name: key, description: "" };
          return {
            name: key,
            display_name: display.name,
            status: service.status,
            description: display.description,
            responseTime: service.responseTime,
            lastChecked: new Date(health_data.timestamp),
            error: service.error,
          };
        }
      );

      set_services(mapped_services);
      set_overall_status(health_data.status);
      set_last_updated(new Date());
      set_is_online(true);
    } catch (error) {
      console.error("Failed to fetch status:", error);
      set_error_message(error instanceof Error ? error.message : "Failed to connect");
      set_is_online(false);
    } finally {
      set_is_checking(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    // Initial fetch
    fetch_status();

    // Set up auto-refresh interval
    let interval: NodeJS.Timeout | null = null;

    if (auto_refresh) {
      interval = setInterval(fetch_status, 30000); // 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [auto_refresh, fetch_status]);

  // Calculate time since last update
  const get_time_since_update = () => {
    const seconds = Math.floor((Date.now() - last_updated.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">System Status</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real-time status of Studio Moikas services
          </p>

          {/* Overall Status Banner */}
          <div className="mt-8 p-6 glass dark:glass-dark rounded-2xl shadow-macos">
            <div className="flex items-center justify-center gap-3 mb-2">
              {overall_status === "operational" ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : overall_status === "degraded" ? (
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {get_overall_status_text()}
              </h2>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Updated {get_time_since_update()}
              </span>
              <span className="flex items-center gap-1">
                {is_online ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Offline</span>
                  </>
                )}
              </span>
            </div>
            {error_message && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">Error: {error_message}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={auto_refresh}
              onChange={(e) => set_auto_refresh(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh every 30s</span>
          </label>

          <button
            onClick={fetch_status}
            disabled={is_checking}
            className={`flex items-center gap-2 px-4 py-2 glass dark:glass-dark rounded-xl shadow-macos hover:shadow-macos-hover transition-all ${
              is_checking ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${is_checking ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">
              {is_checking ? "Checking..." : "Refresh Status"}
            </span>
          </button>
        </div>

        {/* Services List */}
        {services.length === 0 && !is_checking ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={`p-4 rounded-xl border transition-all ${get_status_color(service.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {get_status_icon(service.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {service.display_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {service.description}
                      </p>
                      {service.error && service.status === "down" && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {service.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                      {service.status}
                    </span>
                    {service.responseTime !== undefined && (
                      <p className={`text-xs ${get_response_time_color(service.responseTime)}`}>
                        {service.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center space-y-4">
          <div className="p-4 glass dark:glass-dark rounded-xl">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Response Time Legend
            </h4>
            <div className="flex justify-center gap-6 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">&lt; 500ms (Fast)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">500-2000ms (Normal)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">&gt; 2000ms (Slow)</span>
              </span>
            </div>
          </div>

          <div className="p-4 glass dark:glass-dark rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Early Access Notice:</strong> Studio Moikas is currently in early access. This
              status page shows real-time health checks of our services.
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            For urgent issues, please contact support through the feedback form. Status updates
            every 30 seconds when auto-refresh is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
