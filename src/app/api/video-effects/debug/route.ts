import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

// Debug endpoint to check database state
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user info
    const { data: user_row } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();
      
    // Get recent jobs
    const { data: recentJobs } = await supabase
      .from("video_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
      
    // Get jobs for this user specifically
    const { data: userJobs } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("user_id", user_row?.id)
      .order("created_at", { ascending: false })
      .limit(10);
      
    return NextResponse.json({
      clerk_id: userId,
      user: user_row,
      recent_jobs_all: recentJobs,
      recent_jobs_user: userJobs,
      debug_info: {
        user_found: !!user_row,
        user_id: user_row?.id,
        total_user_jobs: userJobs?.length || 0
      }
    });
  } catch (err) {
    console.error("Debug route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}