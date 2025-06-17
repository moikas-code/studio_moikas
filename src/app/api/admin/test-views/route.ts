import { NextResponse } from "next/server";
import { require_admin_access } from "@/lib/utils/api/admin";
import { create_service_role_client } from "@/lib/supabase_server";

export async function GET() {
  // Check admin access
  const admin_error = await require_admin_access();
  if (admin_error) {
    return admin_error;
  }

  try {
    const supabase = create_service_role_client();

    // Test each view individually
    const test_results: Record<
      string,
      {
        data: unknown;
        error: unknown;
        has_data: boolean;
        count?: number;
        has_operation_type?: boolean;
      }
    > = {};

    // Test admin_user_stats
    const { data: user_stats, error: user_error } = await supabase
      .from("admin_user_stats")
      .select("*")
      .maybeSingle();

    test_results.user_stats = {
      data: user_stats,
      error: user_error,
      has_data: !!user_stats,
    };

    // Test admin_usage_stats
    const { data: usage_stats, error: usage_error } = await supabase
      .from("admin_usage_stats")
      .select("*")
      .maybeSingle();

    test_results.usage_stats = {
      data: usage_stats,
      error: usage_error,
      has_data: !!usage_stats,
    };

    // Test admin_revenue_stats
    const { data: revenue_stats, error: revenue_error } = await supabase
      .from("admin_revenue_stats")
      .select("*")
      .maybeSingle();

    test_results.revenue_stats = {
      data: revenue_stats,
      error: revenue_error,
      has_data: !!revenue_stats,
    };

    // Test admin_daily_usage_trends
    const { data: daily_trends, error: trends_error } = await supabase
      .from("admin_daily_usage_trends")
      .select("*")
      .limit(5);

    test_results.daily_trends = {
      data: daily_trends,
      error: trends_error,
      has_data: !!daily_trends && daily_trends.length > 0,
      count: daily_trends?.length || 0,
    };

    // Also test if usage table has the operation_type column
    const { data: usage_sample, error: usage_sample_error } = await supabase
      .from("usage")
      .select("id, operation_type, tokens_used, created_at")
      .limit(5);

    test_results.usage_table_sample = {
      data: usage_sample,
      error: usage_sample_error,
      has_operation_type:
        usage_sample && usage_sample.length > 0 && "operation_type" in usage_sample[0],
    };

    return NextResponse.json({
      success: true,
      test_results,
    });
  } catch (error) {
    console.error("Error testing admin views:", error);
    return NextResponse.json(
      {
        error: "Failed to test admin views",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
