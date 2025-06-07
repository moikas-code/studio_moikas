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
        
        // For completed jobs with no audio URL, skip status check and go directly to result
        let fal_status: { status: string; result?: unknown } = { status: 'UNKNOWN' }
        
        if (job.status === 'completed' && !job.audio_url) {
          console.log(`Job ${job_id} is marked completed but has no audio URL - skipping status check`)
          fal_status = { status: 'COMPLETED' }
        } else {
          // First check the status
          const status_response = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
            requestId: job.fal_request_id
          })
          fal_status = status_response as { status: string; result?: unknown }
          console.log('Fal status response:', JSON.stringify(fal_status, null, 2))
        }
        
        // If completed, try to get the actual result
        let fal_result = null
        if (fal_status.status === 'COMPLETED' || (job.status === 'completed' && !job.audio_url)) {
          console.log(`Job ${job_id} is completed but may need audio URL - fetching result from fal.ai`)
          try {
            // Try to get the result directly
            fal_result = await fal.queue.result("resemble-ai/chatterboxhd/text-to-speech", {
              requestId: job.fal_request_id
            })
            console.log('Fal result response:', JSON.stringify(fal_result, null, 2))
          } catch (result_error) {
            console.error('Failed to get fal result:', result_error)
          }
        }
  
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
          console.log('Fal COMPLETED - checking for audio URL in result')
          
          // First try to use the direct result if we got it
          if (fal_result) {
            console.log('Using direct fal_result:', JSON.stringify(fal_result, null, 2))
            
            // Check if fal_result is a string (direct URL)
            if (typeof fal_result === 'string') {
              audio_url = fal_result
            } else if (typeof fal_result === 'object' && fal_result !== null) {
              // Try various possible paths in the result object
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
              }
              
              if (!audio_url && result_obj.data && typeof result_obj.data === 'object') {
                const data = result_obj.data as Record<string, unknown>
                if (typeof data.audio_url === 'string') audio_url = data.audio_url
              }
              
              if (!audio_url && result_obj.outputs && typeof result_obj.outputs === 'object') {
                const outputs = result_obj.outputs as Record<string, unknown>
                if (typeof outputs.audio_url === 'string') audio_url = outputs.audio_url
              }
                     
              // Log what we found
              console.log('Extracted audio URL from fal_result:', audio_url)
              console.log('Available keys in fal_result:', Object.keys(result_obj))
            }
          } else if (typed_fal_status.result) {
            // Fallback to status result
            console.log('Using status result:', typed_fal_status.result)
            console.log('Result type:', typeof typed_fal_status.result)
            console.log('Result value:', typed_fal_status.result)
            
            if (typeof typed_fal_status.result === 'string') {
              audio_url = typed_fal_status.result
              console.log('Got audio URL from string result:', audio_url)
            } else if (typeof typed_fal_status.result === 'object') {
              // Log all details about the result object
              console.log('Result object full details:', JSON.stringify(typed_fal_status.result, null, 2))
              
              // Try various possible paths
              audio_url = typed_fal_status.result.url || 
                         typed_fal_status.result.audio_url || 
                         typed_fal_status.result.audio || 
                         typed_fal_status.result.output || 
                         null
              
              if (!audio_url && typed_fal_status.result) {
                // Check if result has a nested structure
                const result_obj = typed_fal_status.result as Record<string, unknown>
                if (result_obj.data && typeof result_obj.data === 'object') {
                  const data = result_obj.data as Record<string, unknown>
                  if (typeof data.audio_url === 'string') audio_url = data.audio_url
                } else if (result_obj.outputs && typeof result_obj.outputs === 'object') {
                  const outputs = result_obj.outputs as Record<string, unknown>
                  if (typeof outputs.audio_url === 'string') audio_url = outputs.audio_url
                } else if (result_obj.output && typeof result_obj.output === 'object') {
                  const output = result_obj.output as Record<string, unknown>
                  if (typeof output.audio_url === 'string') audio_url = output.audio_url
                }
              }
              
              console.log('Extracted audio URL from object:', audio_url)
            }
          } else {
            console.warn('No result in fal status response')
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