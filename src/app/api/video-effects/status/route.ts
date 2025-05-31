import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_service_role_client } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const job_id = req.nextUrl.searchParams.get("job_id");
    if (!job_id)
      return NextResponse.json({ error: "Missing job_id" }, { status: 400 });

    console.log(`[Status Check] Checking status for job_id: ${job_id}, user: ${userId}`);
    console.log(`[Status Check] job_id type: ${typeof job_id}, length: ${job_id.length}`);
    console.log(`[Status Check] job_id encoded: ${encodeURIComponent(job_id)}`);

    // Look up the job in Supabase using service role client to bypass RLS
    const supabase = create_service_role_client();
    
    // First get the user's internal ID
    const { data: user_row, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id")
      .eq("clerk_id", userId)
      .single();
      
    console.log(`[Status Check] User lookup result:`, { user_row, userError, clerk_id: userId });
      
    if (!user_row || userError) {
      console.error(`[Status Check] User not found for clerk_id: ${userId}, error:`, userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the job with user validation
    const { data: job, error: jobError } = await supabase
      .from("video_jobs")
      .select("status, video_url, error_message, model_id, result_payload, created_at, updated_at, tokens_refunded")
      .eq("job_id", job_id)
      .eq("user_id", user_row.id)
      .single();
      
    if (jobError || !job) {
      console.error(`[Status Check] Job not found - job_id: ${job_id}, user_id: ${user_row.id}, error:`, jobError);
      
      // First, let's check all jobs for this user
      const { data: userJobs } = await supabase
        .from("video_jobs")
        .select("job_id, status, created_at")
        .eq("user_id", user_row.id)
        .order("created_at", { ascending: false })
        .limit(5);
        
      console.log(`[Status Check] Recent jobs for user ${user_row.id}:`, userJobs);
      
      // Check if job exists at all (without user filter)
      const { data: anyJob, error: anyJobError } = await supabase
        .from("video_jobs")
        .select("job_id, user_id, status, created_at")
        .eq("job_id", job_id)
        .eq("user_id", user_row.id)
        .eq("status", "pending")
        .single();
        
      console.log(`[Status Check] Job lookup without user filter:`, { anyJob, anyJobError });

      // if job is found, return the status
      if (anyJob) {
        return NextResponse.json({ status: anyJob.status });
      }
        
      if (!anyJob) {
        console.error(`[Status Check] Job exists but belongs to different user. Job user: ${user_row.id}, requesting user: ${user_row.id}`);
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      
      // Try different query approaches to debug
      const { data: jobByTextSearch } = await supabase
        .from("video_jobs")
        .select("job_id, user_id, status")
        .textSearch("job_id", job_id);
        
      console.log(`[Status Check] Text search results:`, jobByTextSearch);

      if (jobByTextSearch && jobByTextSearch.length > 0) {
        return NextResponse.json({ status: jobByTextSearch[0].status });
      }
      
      // Also try with LIKE to see if there's whitespace or encoding issues
      const { data: likeQueryResult } = await supabase
        .from("video_jobs")
        .select("job_id, user_id, status")
        .like("job_id", `%${job_id.trim()}%`)
        .limit(5);

      if (likeQueryResult && likeQueryResult.length > 0) {
        return NextResponse.json({ status: likeQueryResult[0].status });
      }
        
      console.log(`[Status Check] LIKE query results for trimmed job_id:`, likeQueryResult);
      
      // Check if the job_id has any special characters
      console.log(`[Status Check] job_id characters:`, job_id.split('').map(c => `${c} (${c.charCodeAt(0)})`));
      
      console.log(`[Status Check] Job doesn't exist in database or query issue`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.log(`[Status Check] Job found - status: ${job.status}, has_video_url: ${!!job.video_url}`);

    // Return the job status from database
    if (job.status === "done") {
      if (job.video_url) {
        return NextResponse.json({ 
          status: "done", 
          video_url: job.video_url 
        });
      } else {
        // Job marked as done but no video URL - this shouldn't happen
        console.error(`[Status Check] Job marked as done but no video_url present`);
        return NextResponse.json({ 
          status: "error", 
          error: "Video generation completed but URL not found" 
        });
      }
    } else if (job.status === "error") {
      // Include refund info in error message if tokens were refunded
      let error_message = job.error_message || "Video generation failed";
      if (job.tokens_refunded && job.tokens_refunded > 0) {
        error_message += `. ${job.tokens_refunded} MP has been refunded to your account.`;
      }
      
      return NextResponse.json({ 
        status: "error", 
        error: error_message
      });
    } else if (job.status === "pending" || job.status === "processing") {
      // Check if job is stuck (no update for > 10 minutes)
      const updated_at = new Date(job.updated_at);
      const now = new Date();
      const minutes_since_update = (now.getTime() - updated_at.getTime()) / (1000 * 60);
      
      if (minutes_since_update > 10) {
        console.warn(`[Status Check] Job appears stuck - no update for ${minutes_since_update.toFixed(1)} minutes`);
        
        // If job is really stuck, mark it as error
        if (minutes_since_update > 15) {
          await supabase
            .from("video_jobs")
            .update({
              status: "error",
              error_message: "Job timed out - no response from video generation service",
              updated_at: new Date().toISOString()
            })
            .eq("job_id", job_id);
            
          return NextResponse.json({ 
            status: "error", 
            error: "Job timed out - please try again" 
          });
        }
      }
      
      return NextResponse.json({ 
        status: "processing" 
      });
    } else {
      // Unknown status
      console.warn(`[Status Check] Unknown job status: ${job.status}`);
      return NextResponse.json({ 
        status: "processing" 
      });
    }
  } catch (err) {
    console.error("[Status Check] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}