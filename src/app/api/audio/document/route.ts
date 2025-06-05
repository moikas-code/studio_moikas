import { NextRequest } from "next/server"
import { fal } from "@/lib/fal_client"
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  api_error, 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { 
  apply_rate_limit
} from "@/lib/utils/api/rate_limiter"
import { 
  validate_request 
} from "@/lib/utils/api/validation"
import { 
  require_auth,
  get_user_subscription
} from "@/lib/utils/api/auth"
import { z } from "zod"
import { 
  TTS_LIMITS,
  calculateTTSCost
} from "@/app/tools/audio/types"

// Types for fal.ai responses
interface FalAudioInput {
  prompt: string
  voice?: string
  source_audio_url?: string
  high_quality_audio?: boolean
  exaggeration?: number
  cfg?: number
  temperature?: number
  seed?: number
}

interface FalAudioResult {
  data?: {
    url?: string
  }
  url?: string
}



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

// Rate limiter config for document processing (more restrictive)
const document_rate_limit = {
  requests: 5,
  window_seconds: 60,
  key_prefix: 'rl:audio:doc'
}

// Document size limits to prevent abuse
const DOCUMENT_LIMITS = {
  max_chunks: 50, // Maximum number of chunks per document
  max_total_characters: 100000, // Maximum total characters across all chunks
  max_chunk_size: TTS_LIMITS.max_text_length // Already defined in TTS_LIMITS
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()
    
    // 2. Get user subscription
    const subscription = await get_user_subscription(user.user_id)
    const { plan, renewable_tokens, permanent_tokens } = subscription
    const total_tokens = renewable_tokens + permanent_tokens

    // 3. Apply rate limiting
    const rate_limit_result = await apply_rate_limit(user.clerk_id, document_rate_limit)
    if (!rate_limit_result.allowed) {
      return api_error('Too many requests', 429)
    }

    // 4. Validate request
    const body = await req.json()
    const validated = validate_request(document_audio_schema, body)

    // 5. Validate document size limits
    if (validated.chunks.length > DOCUMENT_LIMITS.max_chunks) {
      return api_error(
        `Document too large: ${validated.chunks.length} chunks exceeds maximum of ${DOCUMENT_LIMITS.max_chunks}`,
        400
      )
    }

    const total_text_length = validated.chunks.reduce((sum, chunk) => sum + chunk.text.length, 0)
    
    if (total_text_length > DOCUMENT_LIMITS.max_total_characters) {
      return api_error(
        `Document too large: ${total_text_length} characters exceeds maximum of ${DOCUMENT_LIMITS.max_total_characters}`,
        400
      )
    }

    // 6. Calculate total cost for all chunks
    const total_cost = calculateTTSCost(total_text_length, plan)
    
    // 7. Check token balance
    if (total_tokens < total_cost) {
      return api_error('Insufficient tokens', 402)
    }

    // 8. Deduct tokens using stored function
    const service_supabase = get_service_role_client()
    const { error: deduct_error } = await service_supabase
      .rpc('simple_deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: total_cost,
        p_description: `Document-to-audio: ${validated.chunks.length} chunks, ${total_text_length} characters`
      })

    if (deduct_error) {
      console.error('Token deduction error:', deduct_error)
      return api_error('Failed to deduct tokens', 500)
    }

    // 9. Create parent job record
    const parent_job_id = `audio_doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const { data: parent_job, error: parent_job_error } = await service_supabase
      .from('audio_jobs')
      .insert({
        user_id: user.user_id,
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
        p_user_id: user.user_id,
        p_amount: -total_cost,
        p_description: 'Refund: Failed to create document audio job'
      })
      return api_error('Failed to create job', 500)
    }

    // 10. Get webhook URL
    const base_url = process.env.VERCEL_URL 
      || process.env.NEXT_PUBLIC_APP_URL 
      || process.env.NEXTAUTH_URL 
      || process.env.URL

    const webhook_url = base_url 
      ? `https://${base_url.replace(/^https?:\/\//, '')}/api/webhooks/fal-ai`
      : undefined

    // 11. Process chunks
    const chunk_jobs = []
    const chunk_results = []

    try {
      for (const chunk of validated.chunks) {
        // Create chunk job
        const chunk_job_id = `audio_chunk_${parent_job_id}_${chunk.index}`
        
        const { data: chunk_job } = await service_supabase
          .from('audio_jobs')
          .insert({
            user_id: user.user_id,
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
          const fal_input: FalAudioInput = {
            prompt: chunk.text
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
                fal_request_id: result.requestId,
                status: 'processing'
              })
              .eq('id', chunk_job.id)

            chunk_results.push({
              chunk_index: chunk.index,
              job_id: chunk_job_id,
              request_id: result.requestId
            })
          } else {
            // Sync fallback (not recommended for documents)
            const result = await fal.run("fal-ai/stable-audio", {
              input: fal_input
            })

            const audioResult = result as FalAudioResult
            const audioUrl = audioResult.url || audioResult.data?.url

            await service_supabase
              .from('audio_jobs')
              .update({
                status: 'completed',
                audio_url: audioUrl,
                completed_at: new Date().toISOString()
              })
              .eq('id', chunk_job.id)

            chunk_results.push({
              chunk_index: chunk.index,
              job_id: chunk_job_id,
              audio_url: audioUrl
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
        p_user_id: user.user_id,
        p_amount: -total_cost,
        p_description: 'Refund: Document audio generation failed'
      })

      throw error
    }
  } catch (error) {
    return handle_api_error(error)
  }
}