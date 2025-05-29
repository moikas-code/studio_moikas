import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const job_id = req.nextUrl.searchParams.get("job_id");
    if (!job_id)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    // Look up the job in Supabase to get the model_id
    const supabase = await create_clerk_supabase_client_ssr();
    const { data: job } = await supabase
      .from("video_jobs")
      .select("model_id")
      .eq("job_id", job_id)
      .single();
    if (!job || !job.model_id) {
      return NextResponse.json({ error: "Job not found or missing model_id" }, { status: 404 });
    }
    const model_id = job.model_id;

    // Use FAL.AI queue endpoint for status
    const falStatusRes = await fetch(
      `https://queue.fal.run/${model_id}/requests/${job_id}/status?logs=1`,
      {
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!falStatusRes.ok) {
      const text = await falStatusRes.text();
      console.error("FAL.AI status fetch failed", text);
      return NextResponse.json({ status: "processing" });
    }
    const falStatus = await falStatusRes.json();
    console.log("FAL.AI status:", falStatus);

    if (falStatus.status === "COMPLETED") {
      // Get the result (video URL)
      const resultRes = await fetch(
        `https://queue.fal.run/${model_id}/requests/${job_id}`,
        {
          headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!resultRes.ok) {
        const text = await resultRes.text();
        console.error("FAL.AI result fetch failed", text);
        return NextResponse.json({ status: "processing" });
      }
      const result = await resultRes.json();
      console.log("FAL.AI result:", result);
      // Try all possible locations for the video URL
      let video_url = null;
      if (result.response?.video?.url) {
        video_url = result.response.video.url;
      } else if (result.response?.videos?.[0]?.url) {
        video_url = result.response.videos[0].url;
      } else if (result.response?.output?.video?.url) {
        video_url = result.response.output.video.url;
      } else if (result.response?.output?.videos?.[0]?.url) {
        video_url = result.response.output.videos[0].url;
      }
      if (video_url) {
        return NextResponse.json({ status: "done", video_url });
      } else {
        // If completed but no video yet, keep polling
        return NextResponse.json({ status: "processing" });
      }
    } else if (falStatus.status === "FAILED") {
      return NextResponse.json({ status: "error" });
    } else if (falStatus.status === "IN_QUEUE" || falStatus.status === "IN_PROGRESS") {
      return NextResponse.json({ status: "processing" });
    } else {
      // Unknown status
      return NextResponse.json({ status: "processing" });
    }
  } catch (err) {
    console.error("Status route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
