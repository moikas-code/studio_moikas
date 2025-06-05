import { NextRequest } from "next/server"
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { 
  validate_request 
} from "@/lib/utils/api/validation"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Additional validation for fal.ai webhook
import { z } from "zod"

const fal_ai_webhook_schema = z.object({
  request_id: z.string(),
  status: z.enum(['completed', 'failed', 'processing', 'SUCCESS', 'FAILED', 'IN_PROGRESS']),
  output: z.unknown().optional(),
  error: z.string().optional(),
  logs: z.array(z.unknown()).optional(),
  metrics: z.object({
    inference_time: z.number().optional()
  }).optional()
})

/**
 * Updates parent document job status based on chunk job statuses
 * This ensures document jobs don't get stuck in 'processing' state
 */
async function update_parent_document_status(
  supabase: ReturnType<typeof get_service_role_client>,
  parent_job_id: string,
  user_id: string
) {
  try {
    // Get parent job
    const { data: parent_job } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', parent_job_id)
      .eq('user_id', user_id)
      .eq('type', 'document')
      .single()

    if (!parent_job) {
      console.error('Parent job not found:', parent_job_id)
      return
    }

    // Get all chunk job IDs from parent metadata
    const chunk_job_ids = parent_job.metadata?.chunk_jobs?.map((c: { job_id: string }) => c.job_id) || []
    
    if (chunk_job_ids.length === 0) {
      console.error('No chunk jobs found for parent:', parent_job_id)
      return
    }

    // Get all chunk statuses
    const { data: chunks } = await supabase
      .from('audio_jobs')
      .select('status')
      .in('job_id', chunk_job_ids)
      .eq('user_id', user_id)

    if (!chunks || chunks.length === 0) {
      console.error('No chunks found for parent:', parent_job_id)
      return
    }

    // Determine parent status based on chunk statuses
    const chunk_statuses = chunks.map(c => c.status)
    const completed_count = chunk_statuses.filter(s => s === 'completed').length
    const failed_count = chunk_statuses.filter(s => s === 'failed').length
    const processing_count = chunk_statuses.filter(s => s === 'processing').length
    
    let new_parent_status = parent_job.status
    let completed_at = null

    // All chunks completed successfully
    if (completed_count === chunks.length) {
      new_parent_status = 'completed'
      completed_at = new Date().toISOString()
    }
    // Any chunk failed
    else if (failed_count > 0) {
      new_parent_status = 'failed'
      completed_at = new Date().toISOString()
    }
    // Still processing
    else if (processing_count > 0 || completed_count < chunks.length) {
      new_parent_status = 'processing'
    }

    // Update parent job if status changed
    if (new_parent_status !== parent_job.status) {
      const update_data: Record<string, unknown> = {
        status: new_parent_status,
        metadata: {
          ...parent_job.metadata,
          chunks_completed: completed_count,
          chunks_failed: failed_count,
          chunks_total: chunks.length
        }
      }
      
      if (completed_at) {
        update_data.completed_at = completed_at
      }

      await supabase
        .from('audio_jobs')
        .update(update_data)
        .eq('id', parent_job.id)

      console.log(`Updated parent job ${parent_job_id} status to ${new_parent_status}`)
    }
  } catch (error) {
    console.error('Error updating parent document status:', error)
  }
}

export async function POST(req: NextRequest) {
  console.log('fal.ai webhook called');
  
  try {
    // 1. Parse and validate webhook data
    const body = await req.json()
    console.log('fal.ai webhook body:', JSON.stringify(body, null, 2));
    
    // Try to validate, but if it fails, log the body and continue with raw body
    let validated;
    try {
      validated = validate_request(fal_ai_webhook_schema, body);
    } catch (validationError) {
      console.error('Webhook validation failed:', validationError);
      console.error('Raw webhook body:', JSON.stringify(body, null, 2));
      
      // Try to handle the raw body if it has the minimum required fields
      if (body.request_id && body.status) {
        validated = body;
      } else {
        throw validationError;
      }
    }
    
    // 2. Get job from database - check both video_jobs and audio_jobs
    const supabase = get_service_role_client()
    
    // First try video_jobs
    let job_type = 'video';
    let { data: job, error: job_error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('fal_request_id', validated.request_id)
      .single()
    
    // If not found in video_jobs, try audio_jobs
    if (job_error || !job) {
      job_type = 'audio';
      const audio_result = await supabase
        .from('audio_jobs')
        .select('*')
        .eq('fal_request_id', validated.request_id)
        .single()
      
      job = audio_result.data;
      job_error = audio_result.error;
    }
    
    if (job_error || !job) {
      console.error('Job not found for request:', validated.request_id)
      return api_error('Job not found', 404)
    }
    
    // 3. Update job based on status
    if (validated.status === 'completed' || validated.status === 'SUCCESS') {
      if (job_type === 'video') {
        // Extract video URL from output - handle different response structures
        let video_url: string | undefined
        
        // Check various possible locations for the video URL
        if (validated.output) {
          if (typeof validated.output === 'string') {
            video_url = validated.output
          } else {
            const output = validated.output as Record<string, unknown>
            if (typeof output.video_url === 'string') {
              video_url = output.video_url
            } else if (typeof output.url === 'string') {
              video_url = output.url
            } else if (typeof output.video === 'string') {
              video_url = output.video
            }
          }
        }
        
        if (!video_url) {
          console.error('No video URL in completed job:', validated)
          // Update as failed
          await supabase
            .from('video_jobs')
            .update({
              status: 'failed',
              error: 'No video URL in response',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)
        } else {
          // Update job with success
          await supabase
            .from('video_jobs')
            .update({
              status: 'completed',
              video_url,
              completed_at: new Date().toISOString(),
              metadata: {
                ...job.metadata,
                inference_time: validated.metrics?.inference_time
              }
            })
            .eq('id', job.id)
        }
      } else {
        // Handle audio job completion
        let audio_url: string | undefined
        
        // Check various possible locations for the audio URL
        if (validated.output) {
          if (typeof validated.output === 'string') {
            audio_url = validated.output
          } else {
            const output = validated.output as Record<string, unknown>
            if (typeof output.audio_url === 'string') {
              audio_url = output.audio_url
            } else if (typeof output.url === 'string') {
              audio_url = output.url
            } else if (typeof output.audio === 'string') {
              audio_url = output.audio
            }
          }
        }
        
        if (!audio_url) {
          console.error('No audio URL in completed job:', validated)
          // Update as failed
          await supabase
            .from('audio_jobs')
            .update({
              status: 'failed',
              error: 'No audio URL in response',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id)
        } else {
          // Update job with success
          await supabase
            .from('audio_jobs')
            .update({
              status: 'completed',
              audio_url,
              completed_at: new Date().toISOString(),
              metadata: {
                ...job.metadata,
                inference_time: validated.metrics?.inference_time
              }
            })
            .eq('id', job.id)
          
          // Check if this is a chunk job and update parent if needed
          if (job.metadata?.parent_job_id) {
            await update_parent_document_status(supabase, job.metadata.parent_job_id, job.user_id)
          }
        }
      }
    }
    
    if (validated.status === 'failed' || validated.status === 'FAILED') {
      // Update job with failure
      const table_name = job_type === 'video' ? 'video_jobs' : 'audio_jobs'
      await supabase
        .from(table_name)
        .update({
          status: 'failed',
          error: validated.error || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      // Check if this is a chunk job and update parent if needed
      if (job_type === 'audio' && job.metadata?.parent_job_id) {
        await update_parent_document_status(supabase, job.metadata.parent_job_id, job.user_id)
      }
      
      // Refund tokens
      if (job.user_id && job.cost) {
        // Use simple_deduct_tokens for refund
        await supabase.rpc('simple_deduct_tokens', {
          p_user_id: job.user_id,
          p_amount: -job.cost, // negative for refund
          p_description: `${job_type === 'video' ? 'Video' : 'Audio'} generation refund: ${validated.error || 'generation failed'}`
        })
      }
    }
    
    if (validated.status === 'processing' || validated.status === 'IN_PROGRESS') {
      // Update progress if available
      const progress_log = validated.logs?.find((log: unknown) => 
        typeof log === 'object' && log !== null && 'type' in log && log.type === 'progress'
      ) as { progress?: number } | undefined
      const progress = progress_log?.progress || 50
      
      const table_name = job_type === 'video' ? 'video_jobs' : 'audio_jobs'
      await supabase
        .from(table_name)
        .update({
          status: 'processing',
          progress
        })
        .eq('id', job.id)
    }
    
    // 4. Return success
    return api_success({ 
      received: true,
      job_id: job.id,
      status: validated.status
    })
    
  } catch (error) {
    console.error('fal.ai webhook error:', error)
    return handle_api_error(error)
  }
}