import { NextRequest } from "next/server"
import { 
  get_service_role_client,
  execute_db_operation 
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
  status: z.enum(['completed', 'failed', 'processing']),
  output: z.any().optional(),
  error: z.string().optional(),
  logs: z.array(z.any()).optional(),
  metrics: z.object({
    inference_time: z.number().optional()
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate webhook data
    const body = await req.json()
    const validated = validate_request(fal_ai_webhook_schema, body)
    
    // 2. Get job from database
    const supabase = get_service_role_client()
    const { data: job, error: job_error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('fal_request_id', validated.request_id)
      .single()
    
    if (job_error || !job) {
      console.error('Job not found for request:', validated.request_id)
      return api_error('Job not found', 404)
    }
    
    // 3. Update job based on status
    if (validated.status === 'completed') {
      // Extract video URL from output
      const video_url = validated.output?.video_url || validated.output?.url
      
      if (!video_url) {
        console.error('No video URL in completed job:', validated)
        validated.status = 'failed'
        validated.error = 'No video URL in response'
      } else {
        // Update job with success
        await execute_db_operation(async () =>
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
        )
      }
    }
    
    if (validated.status === 'failed') {
      // Update job with failure and refund
      await execute_db_operation(async () => {
        // Update job status
        const result = await supabase
          .from('video_jobs')
          .update({
            status: 'failed',
            error: validated.error || 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
        
        // Refund tokens
        if (job.user_id && job.cost) {
          await supabase.rpc('refund_tokens', {
            p_user_id: job.user_id,
            p_amount: job.cost
          })
        }
        return result
      })
    }
    
    if (validated.status === 'processing') {
      // Update progress if available
      const progress = validated.logs?.find(log => log.type === 'progress')?.progress || 50
      
      await execute_db_operation(async () =>
        await supabase
          .from('video_jobs')
          .update({
            status: 'processing',
            progress
          })
          .eq('id', job.id)
      )
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