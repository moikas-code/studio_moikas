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