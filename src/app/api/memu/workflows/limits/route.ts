import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { check_workflow_creation_limit } from "@/lib/generate_helpers";

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Get user
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get workflow limit information
    try {
      const limit_check = await check_workflow_creation_limit({
        supabase,
        user_id: user.id,
      });

      return NextResponse.json({
        current_count: limit_check.current_count,
        max_allowed: limit_check.max_allowed,
        can_create: limit_check.allowed,
        plan: limit_check.plan,
        is_unlimited: limit_check.max_allowed === -1
      });

    } catch (limit_error) {
      console.error("Error checking workflow limits:", limit_error);
      return NextResponse.json(
        { error: "Failed to check workflow limits" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("GET workflow limits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}