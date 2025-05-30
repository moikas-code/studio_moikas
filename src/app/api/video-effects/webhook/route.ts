import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export const runtime = "nodejs"; // Ensure this runs in Node.js, not Edge

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      request_id,
      status,
      payload,
      error,
      payload_error,
    } = body;

    if (!request_id) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    const update_data: Record<string, unknown> = {
      status: status === "OK" ? "done" : status === "ERROR" ? "error" : status?.toLowerCase() || "unknown",
      updated_at: new Date().toISOString(),
    };

    if (status === "OK" && payload) {
      // Try to extract video URL from all possible locations
      let video_url = null;
      if (payload.video?.url) {
        video_url = payload.video.url;
      } else if (payload.videos?.[0]?.url) {
        video_url = payload.videos[0].url;
      } else if (payload.output?.video?.url) {
        video_url = payload.output.video.url;
      } else if (payload.output?.videos?.[0]?.url) {
        video_url = payload.output.videos[0].url;
      }
      if (video_url) {
        update_data.video_url = video_url;
      }
    } else if (status === "ERROR") {
      update_data.error_message = error || (payload_error ? String(payload_error) : "Unknown error");
    }

    // Update the job in the DB
    const { error: db_error } = await supabase
      .from("video_jobs")
      .update(update_data)
      .eq("job_id", request_id);

    if (db_error) {
      return NextResponse.json({ error: db_error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Webhook error" }, { status: 500 });
  }
} 