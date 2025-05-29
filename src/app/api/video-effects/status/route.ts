import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const job_id = req.nextUrl.searchParams.get("job_id");
    if (!job_id)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    // Check Supabase for job status
    const supabase = await create_clerk_supabase_client_ssr();
    const { data: job } = await supabase
      .from("video_jobs")
      .select("*")
      .eq("job_id", job_id)
      .single();

    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // If already done, return video_url
    if (job.status === "done") {
      return NextResponse.json({ status: "done", video_url: job.video_url });
    }

    // Poll FAL.AI REST API for job status
    const falRes = await fetch(`https://api.fal.ai/v1/jobs/${job_id}`, {
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!falRes.ok) {
      return NextResponse.json({ status: "processing" });
    }
    const falStatus = await falRes.json();

    if (
      falStatus.status === "COMPLETED" &&
      falStatus.result?.videos?.[0]?.url
    ) {
      // Update Supabase
      await supabase
        .from("video_jobs")
        .update({
          status: "done",
          video_url: falStatus.result.videos[0].url,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", job_id);
      return NextResponse.json({
        status: "done",
        video_url: falStatus.result.videos[0].url,
      });
    } else if (falStatus.status === "FAILED") {
      await supabase
        .from("video_jobs")
        .update({ status: "error", updated_at: new Date().toISOString() })
        .eq("job_id", job_id);
      return NextResponse.json({ status: "error" });
    }

    // Still processing
    return NextResponse.json({ status: "processing" });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
