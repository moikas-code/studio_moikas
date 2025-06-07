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
    const fal_status = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
      requestId: job.fal_request_id
    })

    if (error || !job) {
      console.error('Job not found:', job_id, 'error:', error)
      return api_error('Job not found', 404)
    }

    // 5. Check fal.ai status if job is completed but has no audio URL
    let audio_url = job.audio_url
    
    if (job.fal_request_id && job.status === 'completed' && !job.audio_url || fal_status.status === 'COMPLETED') {
      try {

        
        // Define proper type for fal status response
        interface FalStatusResponse {
          status: string
          result?: string | { url?: string; audio_url?: string; audio?: string; output?: string }
        }
        
        const typed_fal_status = fal_status as FalStatusResponse
        
        console.log('Fal status check for missing audio URL:', {
          job_id: job.job_id,
          fal_status: typed_fal_status.status,
          has_result: !!typed_fal_status.result
        })
        
        if (typed_fal_status.status === 'COMPLETED' && typed_fal_status.result) {
          // Extract audio URL from result
          if (typeof typed_fal_status.result === 'string') {
            audio_url = typed_fal_status.result
          } else if (typeof typed_fal_status.result === 'object') {
            audio_url = typed_fal_status.result.url || 
                       typed_fal_status.result.audio_url || 
                       typed_fal_status.result.audio || 
                       typed_fal_status.result.output || 
                       null
          }
          
          // Update database if we found the URL
          if (audio_url) {
            console.log('Updating job with missing audio URL:', job.job_id)
            await supabase
              .from('audio_jobs')
              .update({
                audio_url,
                completed_at: job.completed_at || new Date().toISOString()
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
      status: job.status,
      progress: job.progress || 0,
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