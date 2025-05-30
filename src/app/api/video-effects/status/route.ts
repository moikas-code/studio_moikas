import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { fal } from "@fal-ai/client";

export async function GET(req: NextRequest) {
  try {
    const job_id = req.nextUrl.searchParams.get("job_id");
    if (!job_id)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    // Look up the job in Supabase for status, video_url, and error_message
    const supabase = await create_clerk_supabase_client_ssr();
    const { data: job } = await supabase
      .from("video_jobs")
      .select("status, video_url, error_message, model_id")
      .eq("job_id", job_id)
      .single();
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const status = await fal.queue.status(
      job.model_id as string,
      {
        requestId: job_id,
        logs: true,
      }
    );

    if (status.status === "COMPLETED") {
      // Try all possible locations for the video URL
      let video_url = null;
      const s = status as unknown as Record<string, unknown>;
      if ((s.video as { url?: string } | undefined)?.url) {
        video_url = (s.video as { url?: string }).url;
      } else if ((s.videos as Array<{ url?: string }> | undefined)?.[0]?.url) {
        video_url = (s.videos as Array<{ url?: string }>)[0].url;
      } else if ((s.output as { video?: { url?: string }; videos?: Array<{ url?: string }> } | undefined)?.video?.url) {
        video_url = (s.output as { video?: { url?: string } }).video?.url;
      } else if ((s.output as { videos?: Array<{ url?: string }> } | undefined)?.videos?.[0]?.url) {
        video_url = (s.output as { videos?: Array<{ url?: string }> }).videos?.[0]?.url;
      }
      if (video_url) {
        await supabase.from("video_jobs").update({
          status: "done",
          video_url,
        }).eq("job_id", job_id);
        return NextResponse.json({ status: "done", video_url });
      }
      return NextResponse.json({ status: "processing" });
    } else if (String(status.status) === "FAILED") {
      const s = status as unknown as Record<string, unknown>;
      return NextResponse.json({ status: "error", error: (s.error as string) || "Unknown error" });
    } else {
      return NextResponse.json({ status: status.status });
    }
  } catch (err) {
    console.error("Status route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
