import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fal } from "@/lib/fal_client"
import { 
  get_service_role_client, 
  get_supabase_client 
} from "@/lib/utils/database/supabase"
import { 
  api_error, 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { 
  create_rate_limiter 
} from "@/lib/utils/api/rate_limiter"
import { 
  validate_request 
} from "@/lib/utils/api/validation"
import { z } from "zod"
import { 
  TTS_LIMITS,
  calculateTTSCost
} from "@/app/tools/audio/types"

// Schema validation
const document_audio_schema = z.object({
  chunks: z.array(z.object({
    text: z.string().min(1).max(TTS_LIMITS.max_text_length),
    index: z.number()
  })).min(1),
  voice: z.string().optional(),
  source_audio_url: z.string().url().optional(),
  high_quality_audio: z.boolean().default(true),
  exaggeration: z.number().min(TTS_LIMITS.min_exaggeration).max(TTS_LIMITS.max_exaggeration).optional(),
  cfg: z.number().min(TTS_LIMITS.min_cfg).max(TTS_LIMITS.max_cfg).optional(),
  temperature: z.number().min(TTS_LIMITS.min_temperature).max(TTS_LIMITS.max_temperature).optional(),
  seed: z.number().min(0).max(TTS_LIMITS.max_seed).optional()
})

// Rate limiter for document processing (more restrictive)
const rate_limiter = create_rate_limiter({
  interval: 60 * 1000, // 1 minute
  max_requests: 5 // Limit document processing
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerk_id } = await auth()
    if (!clerk_id) {
      return api_error('Unauthorized', 401)
    }

    // 2. Get user data
    const supabase = get_supabase_client()
    const { data: user_data } = await supabase
      .from('users')
      .select(`
        id,
        subscriptions (
          plan,
          renewable_tokens,
          permanent_tokens
        )
      `)
      .eq('clerk_id', clerk_id)
      .single()

    if (!user_data?.subscriptions) {
      return api_error('User not found', 404)
    }

    const user_id = user_data.id
    const { plan, renewable_tokens, permanent_tokens } = user_data.subscriptions
    const total_tokens = renewable_tokens + permanent_tokens

    // 3. Apply rate limiting
    const rate_limit_result = await rate_limiter(clerk_id)
    if (!rate_limit_result.success) {
      return api_error('Too many requests', 429, {
        retry_after: rate_limit_result.reset
      })
    }

    // 4. Validate request
    const body = await req.json()
    const validated = validate_request(document_audio_schema, body)

    // 5. Calculate total cost for all chunks
    const total_text_length = validated.chunks.reduce((sum, chunk) => sum + chunk.text.length, 0)
    const total_cost = calculateTTSCost(total_text_length, plan)
    
    // 6. Check token balance
    if (total_tokens < total_cost) {
      return api_error('Insufficient tokens', 402, {
        required: total_cost,
        available: total_tokens
      })
    }

    // 7. Deduct tokens using stored function
    const service_supabase = get_service_role_client()
    const { error: deduct_error } = await service_supabase
      .rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: total_cost,
        p_description: `Document-to-audio: ${validated.chunks.length} chunks, ${total_text_length} characters`
      })

    if (deduct_error) {
      console.error('Token deduction error:', deduct_error)
      return api_error('Failed to deduct tokens', 500)
    }

    // 8. Create parent job record
    const parent_job_id = `audio_doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const { data: parent_job, error: parent_job_error } = await service_supabase
      .from('audio_jobs')
      .insert({
        user_id,
        job_id: parent_job_id,
        status: 'processing',
        type: 'document',
        text: `Document with ${validated.chunks.length} chunks`,
        voice: validated.voice,
        source_audio_url: validated.source_audio_url,
        high_quality_audio: validated.high_quality_audio,
        exaggeration: validated.exaggeration,
        cfg: validated.cfg,
        temperature: validated.temperature,
        seed: validated.seed,
        cost: total_cost,
        metadata: {
          plan,
          total_chunks: validated.chunks.length,
          total_text_length,
          chunk_jobs: []
        }
      })
      .select()
      .single()

    if (parent_job_error || !parent_job) {
      console.error('Job creation error:', parent_job_error)
      // Refund tokens
      await service_supabase.rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: -total_cost,
        p_description: 'Refund: Failed to create document audio job'
      })
      return api_error('Failed to create job', 500)
    }

    // 9. Get webhook URL
    const base_url = process.env.VERCEL_URL 
      || process.env.NEXT_PUBLIC_APP_URL 
      || process.env.NEXTAUTH_URL 
      || process.env.URL

    const webhook_url = base_url 
      ? `https://${base_url.replace(/^https?:\/\//, '')}/api/webhooks/fal-ai`
      : undefined

    // 10. Process chunks
    const chunk_jobs = []
    const chunk_results = []

    try {
      for (const chunk of validated.chunks) {
        // Create chunk job
        const chunk_job_id = `audio_chunk_${parent_job_id}_${chunk.index}`
        
        const { data: chunk_job } = await service_supabase
          .from('audio_jobs')
          .insert({
            user_id,
            job_id: chunk_job_id,
            status: 'pending',
            type: 'text',
            text: chunk.text,
            voice: validated.voice,
            source_audio_url: validated.source_audio_url,
            high_quality_audio: validated.high_quality_audio,
            exaggeration: validated.exaggeration,
            cfg: validated.cfg,
            temperature: validated.temperature,
            seed: validated.seed,
            cost: calculateTTSCost(chunk.text.length, plan),
            metadata: {
              parent_job_id,
              chunk_index: chunk.index
            }
          })
          .select()
          .single()

        if (chunk_job) {
          chunk_jobs.push(chunk_job)

          // Prepare fal.ai input
          const fal_input: Record<string, unknown> = {
            text: chunk.text
          }

          if (validated.voice && !validated.source_audio_url) {
            fal_input.voice = validated.voice
          }
          if (validated.source_audio_url) {
            fal_input.source_audio_url = validated.source_audio_url
          }
          if (validated.high_quality_audio !== undefined) {
            fal_input.high_quality_audio = validated.high_quality_audio
          }
          if (validated.exaggeration !== undefined) {
            fal_input.exaggeration = validated.exaggeration
          }
          if (validated.cfg !== undefined) {
            fal_input.cfg = validated.cfg
          }
          if (validated.temperature !== undefined) {
            fal_input.temperature = validated.temperature
          }
          if (validated.seed !== undefined) {
            fal_input.seed = validated.seed
          }

          // Call fal.ai with webhook
          if (webhook_url) {
            const result = await fal.subscribe("fal-ai/stable-audio", {
              input: fal_input,
              webhookUrl: webhook_url,
              logs: true
            })

            // Update chunk job with fal request ID
            await service_supabase
              .from('audio_jobs')
              .update({
                fal_request_id: result.request_id,
                status: 'processing'
              })
              .eq('id', chunk_job.id)

            chunk_results.push({
              chunk_index: chunk.index,
              job_id: chunk_job_id,
              request_id: result.request_id
            })
          } else {
            // Sync fallback (not recommended for documents)
            const result = await fal.run("fal-ai/stable-audio", {
              input: fal_input
            })

            await service_supabase
              .from('audio_jobs')
              .update({
                status: 'completed',
                audio_url: result.audio_url,
                completed_at: new Date().toISOString()
              })
              .eq('id', chunk_job.id)

            chunk_results.push({
              chunk_index: chunk.index,
              job_id: chunk_job_id,
              audio_url: result.audio_url
            })
          }
        }
      }

      // Update parent job with chunk job IDs
      await service_supabase
        .from('audio_jobs')
        .update({
          metadata: {
            ...parent_job.metadata,
            chunk_jobs: chunk_results
          }
        })
        .eq('id', parent_job.id)

      return api_success({
        job_id: parent_job_id,
        status: 'processing',
        total_chunks: validated.chunks.length,
        message: 'Document audio generation started. Check status for updates.'
      })

    } catch (error) {
      console.error('Chunk processing error:', error)
      
      // Update parent job as failed
      await service_supabase
        .from('audio_jobs')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', parent_job.id)

      // Refund tokens
      await service_supabase.rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: -total_cost,
        p_description: 'Refund: Document audio generation failed'
      })

      throw error
    }
  } catch (error) {
    return handle_api_error(error)
  }
}