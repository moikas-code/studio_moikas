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
    
    console.log(`Job ${job_id} status check:`, {
      has_fal_request_id: !!job.fal_request_id,
      status: job.status,
      has_audio_url: !!job.audio_url,
      should_check_fal: job.fal_request_id && (job.status !== 'completed' || !job.audio_url)
    })
    
    if (job.fal_request_id && (job.status !== 'completed' || !job.audio_url)) {
      try {
        console.log('Checking fal status for job:', job_id, 'with request ID:', job.fal_request_id)
        
        // Always try to get the result for completed jobs without audio
        let fal_result = null
        
        // For completed jobs with no audio URL, go directly to result
        if (job.status === 'completed' && !job.audio_url) {
          console.log(`Job ${job_id} is marked completed but has no audio URL - fetching result directly`)
          try {
            fal_result = await fal.queue.result("resemble-ai/chatterboxhd/text-to-speech", {
              requestId: job.fal_request_id
            })
            console.log('Direct fal result response:', JSON.stringify(fal_result, null, 2))
          } catch (result_error) {
            console.error('Failed to get direct fal result:', result_error)
            // If direct result fails, try status check
            const status_response = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
              requestId: job.fal_request_id
            }) as { status: string }
            console.log('Fal status response:', JSON.stringify(status_response, null, 2))
            
            if (status_response.status === 'COMPLETED') {
              current_status = 'completed'
            }
          }
        } else {
          // For non-completed jobs, check status first
          const status_response = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
            requestId: job.fal_request_id
          }) as { status: string }
          console.log('Fal status response:', JSON.stringify(status_response, null, 2))
          
          // Update status based on fal.ai response
          if (status_response.status === 'IN_PROGRESS') {
            current_status = 'processing'
          } else if (status_response.status === 'IN_QUEUE') {
            current_status = 'pending'
          } else if (status_response.status === 'COMPLETED') {
            current_status = 'completed'
            // Try to get the result
            try {
              fal_result = await fal.queue.result("resemble-ai/chatterboxhd/text-to-speech", {
                requestId: job.fal_request_id
              })
              console.log('Fal result response:', JSON.stringify(fal_result, null, 2))
            } catch (result_error) {
              console.error('Failed to get fal result:', result_error)
            }
          } else if (status_response.status === 'FAILED') {
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
        }
        
        // Extract audio URL from result if we have one
        if (fal_result) {
          console.log('Processing fal_result')
          
          if (typeof fal_result === 'string') {
            audio_url = fal_result
            console.log('Got audio URL from string result:', audio_url)
          } else if (typeof fal_result === 'object' && fal_result !== null) {
            const result_obj = fal_result as Record<string, unknown>
            
            // Direct properties
            if (typeof result_obj.url === 'string') audio_url = result_obj.url
            else if (typeof result_obj.audio_url === 'string') audio_url = result_obj.audio_url
            else if (typeof result_obj.audio === 'string') audio_url = result_obj.audio
            else if (typeof result_obj.audio_file === 'string') audio_url = result_obj.audio_file
            
            // Nested properties
            if (!audio_url && result_obj.output && typeof result_obj.output === 'object') {
              const output = result_obj.output as Record<string, unknown>
              if (typeof output.audio_url === 'string') audio_url = output.audio_url
              else if (typeof output.url === 'string') audio_url = output.url
              else if (typeof output.audio === 'string') audio_url = output.audio
            }
            
            if (!audio_url && result_obj.data && typeof result_obj.data === 'object') {
              const data = result_obj.data as Record<string, unknown>
              if (typeof data.audio_url === 'string') audio_url = data.audio_url
              else if (typeof data.url === 'string') audio_url = data.url
              else if (typeof data.audio === 'string') audio_url = data.audio
            }
            
            if (!audio_url && result_obj.outputs && typeof result_obj.outputs === 'object') {
              const outputs = result_obj.outputs as Record<string, unknown>
              if (typeof outputs.audio_url === 'string') audio_url = outputs.audio_url
              else if (typeof outputs.url === 'string') audio_url = outputs.url
              else if (typeof outputs.audio === 'string') audio_url = outputs.audio
            }
                   
            console.log('Available keys in fal_result:', Object.keys(result_obj))
            console.log('Extracted audio URL:', audio_url)
          }
          
          // Update database if we found an audio URL
          if (audio_url && (!job.audio_url || job.audio_url !== audio_url)) {
            console.log('Updating job with new audio URL in database')
            
            const update_data: Record<string, unknown> = {
              audio_url: audio_url,
              status: 'completed'
            }
            if (!job.completed_at) {
              update_data.completed_at = new Date().toISOString()
            }
            
            const update_result = await supabase
              .from('audio_jobs')
              .update(update_data)
              .eq('id', job.id)
              
            if (update_result.error) {
              console.error('Failed to update job:', update_result.error)
            } else {
              console.log('Successfully updated job with audio URL')
            }
          } else if (!audio_url) {
            console.warn('No audio URL found in fal result')
          }
        }
      } catch (fal_error) {
        console.error('Failed to check fal status:', fal_error)
      }
    }

    // 6. Return job status with all metadata
    return api_success({
      job_id: job.job_id,
      status: current_status,
      progress: current_status === 'completed' ? 100 : (job.progress || 0),
      audio_url: audio_url,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at,
      metadata: {
        ...job.metadata,
        total_text_length: job.text?.length || job.metadata?.total_text_length || 0,
        total_cost: job.cost || job.metadata?.total_cost || 0
      }
    })
  } catch (error) {
    return handle_api_error(error)
  }
}