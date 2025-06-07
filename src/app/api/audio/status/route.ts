import { NextRequest } from "next/server"
import { get_service_role_client } from "@/lib/utils/database/supabase"
import { require_auth } from "@/lib/utils/api/auth"
import { 
  api_error, 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { fal } from "@fal-ai/client"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()

    // 2. Get job_id from query params
    const { searchParams } = new URL(req.url)
    const job_id = searchParams.get('job_id')
    
    if (!job_id) {
      return api_error('Missing job_id parameter', 400)
    }
    

    // 3. Get job from database
    const supabase = get_service_role_client()

    // 4. Get job status (RLS ensures user can only see their own jobs)
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .single()

    if (error || !job) {
      console.error('Job not found:', job_id, 'error:', error)
      return api_error('Job not found', 404)
    }

    // 5. Check fal.ai status if job has a request ID and is not completed with audio
    let audio_url = job.audio_url
    let current_status = job.status
    
    if (job.fal_request_id && (job.status !== 'completed' || !job.audio_url)) {
      try {
        console.log('Checking fal status for job:', job_id, 'with request ID:', job.fal_request_id)
        
        const fal_status = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
          requestId: job.fal_request_id
        })
        console.log('Fal status response:', fal_status)
  
        // Define proper type for fal status response
        interface FalStatusResponse {
          status: string
          result?: string | { url?: string; audio_url?: string; audio?: string; output?: string }
        }
        
        const typed_fal_status = fal_status as FalStatusResponse
        
        // Update current status based on fal.ai status
        if (typed_fal_status.status === 'IN_PROGRESS') {
          current_status = 'processing'
        } else if (typed_fal_status.status === 'IN_QUEUE') {
          current_status = 'pending'
        } else if (typed_fal_status.status === 'COMPLETED') {
          current_status = 'completed'
          
          // Extract audio URL from result
          if (typed_fal_status.result) {
            if (typeof typed_fal_status.result === 'string') {
              audio_url = typed_fal_status.result
            } else if (typeof typed_fal_status.result === 'object') {
              audio_url = typed_fal_status.result.url || 
                         typed_fal_status.result.audio_url || 
                         typed_fal_status.result.audio || 
                         typed_fal_status.result.output || 
                         null
            }
          }
          
          // Update database with new status and audio URL
          if (current_status !== job.status || (audio_url && audio_url !== job.audio_url)) {
            console.log('Updating job with fal.ai results:', {
              job_id: job.job_id,
              new_status: current_status,
              has_audio_url: !!audio_url
            })
            
            const update_data: Record<string, unknown> = {
              status: current_status
            }
            if (audio_url) {
              update_data.audio_url = audio_url
            }
            if (current_status === 'completed' && !job.completed_at) {
              update_data.completed_at = new Date().toISOString()
            }
            
            await supabase
              .from('audio_jobs')
              .update(update_data)
              .eq('id', job.id)
          }
        } else if (typed_fal_status.status === 'FAILED') {
          current_status = 'failed'
          
          // Update database if status changed
          if (current_status !== job.status) {
            await supabase
              .from('audio_jobs')
              .update({
                status: 'failed',
                error: 'Job failed in fal.ai',
                completed_at: new Date().toISOString()
              })
              .eq('id', job.id)
          }
        }
      } catch (fal_error) {
        console.error('Failed to check fal status:', fal_error)
      }
    }

    // 6. Return job status
    return api_success({
      job_id: job.job_id,
      status: current_status,
      progress: current_status === 'completed' ? 100 : (job.progress || 0),
      audio_url: audio_url,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at,
      metadata: job.metadata
    })
  } catch (error) {
    return handle_api_error(error)
  }
}