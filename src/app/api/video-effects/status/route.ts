import { NextRequest } from "next/server"
import { 
  get_service_role_client 
} from "@/lib/utils/database/supabase"
import { 
  require_auth 
} from "@/lib/utils/api/auth"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { fal } from "@fal-ai/client"

// Next.js route configuration
export const dynamic = 'force-dynamic' // Job status is always fresh
export const runtime = 'nodejs'

// Type definitions for fal.ai responses
interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
  logs?: Array<{
    message: string
    timestamp?: string
  }>
}

interface FalResultResponse {
  data: {
    video: {
      url?: string
    }
    requestId?: string
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()
    
    // 2. Get job_id from query params
    const job_id = req.nextUrl.searchParams.get("job_id")
    if (!job_id) {
      return api_error("Missing job_id parameter", 400)
    }
    
    // 3. Look up job in database
    const supabase = get_service_role_client()
    const { data: job, error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('job_id', job_id) // Use job_id field, not id
      .eq('user_id', user.user_id) // Ensure user owns this job
      .single()
    
    if (error || !job) {
      return api_error("Job not found", 404)
    }
    
    // 4. If job has fal_request_id and is not completed, check fal.ai status
    let current_status = job.status
    let video_url = job.video_url
    let progress = job.progress || 0
    let job_error = job.error
    
    if (job.fal_request_id && job.status !== 'completed' && job.status !== 'failed') {
      try {
        console.log(`Checking fal.ai status for job ${job_id} with request ID: ${job.fal_request_id}`)
        
        // First, check the status
        const status_response = await fal.queue.status(job.model_id, {
          requestId: job.fal_request_id,
          logs: true
        }) as FalStatusResponse
        
        console.log('Fal status response:', JSON.stringify(status_response, null, 2))
        
        // Map fal.ai status to our status
        if (status_response.status === 'IN_PROGRESS') {
          current_status = 'processing'
          progress = status_response.progress || 50
        } else if (status_response.status === 'IN_QUEUE') {
          current_status = 'pending'
          progress = 0
        } else if (status_response.status === 'COMPLETED') {
          current_status = 'completed'
          progress = 100
          
          // Try to get the result
          try {
            const { data: result_response } = await fal.queue.result(job.model_id, {
              requestId: job.fal_request_id
            }) as FalResultResponse
            
            console.log('Fal result response:', JSON.stringify(result_response, null, 2))
            
            // Extract video URL
            video_url = result_response.video?.url || null
                       
            if (!video_url) {
              console.error('No video URL found in fal.ai result:', result_response)
              current_status = 'failed'
              job_error = 'No video URL in response'
            }
          } catch (result_error) {
            console.error('Failed to get fal.ai result:', result_error)
            // Even if we can't get the result, the job is complete
          }
        } else if (status_response.status === 'FAILED') {
          current_status = 'failed'
          job_error = 'Video generation failed in fal.ai'
          progress = 0
        }
        
        // Update database if status changed or we got a video URL
        if (current_status !== job.status || (video_url && !job.video_url)) {
          const update_data: Record<string, unknown> = {
            status: current_status,
            progress: progress
          }
          
          if (video_url && !job.video_url) {
            update_data.video_url = video_url
          }
          
          if (current_status === 'completed' || current_status === 'failed') {
            update_data.completed_at = new Date().toISOString()
          }
          
          if (job_error) {
            update_data.error = job_error
          }
          
          const { error: update_error } = await supabase
            .from('video_jobs')
            .update(update_data)
            .eq('id', job.id)
            
          if (update_error) {
            console.error('Failed to update job in database:', update_error)
          } else {
            console.log(`Updated job ${job_id} in database with status: ${current_status}`)
          }
        }
      } catch (fal_error) {
        console.error('Failed to check fal.ai status:', fal_error)
        // Continue with database values if fal.ai check fails
      }
    }
    
    // 5. Return job status
    return api_success({
      job_id: job.job_id, // Return the string job_id
      status: current_status,
      video_url: video_url,
      error: job_error,
      progress: progress,
      created_at: job.created_at,
      completed_at: job.completed_at
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}