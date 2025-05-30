import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const job_id = req.nextUrl.searchParams.get("job_id");
    if (!job_id)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    // Look up the job in Supabase for status, video_url, and error_message
    const supabase = await create_clerk_supabase_client_ssr();
    const { data: job } = await supabase
      .from("video_jobs")
      .select("status, video_url, error_message")
      .eq("job_id", job_id)
      .single();
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "done" && job.video_url) {
      return NextResponse.json({ status: "done", video_url: job.video_url });
    } else if (job.status === "error" && job.error_message) {
      return NextResponse.json({ status: "error", error: job.error_message });
    } else {
      return NextResponse.json({ status: "processing" });
    }
  } catch (err) {
    console.error("Status route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
