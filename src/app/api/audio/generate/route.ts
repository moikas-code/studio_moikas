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
  TTS_MIN_CHARGE_CHARACTERS,
  calculateTTSCost
} from "@/app/tools/audio/types"

// Schema validation
const audio_generation_schema = z.object({
  text: z.string().min(1).max(TTS_LIMITS.max_text_length),
  voice: z.string().optional(),
  source_audio_url: z.string().url().optional(),
  high_quality_audio: z.boolean().default(true),
  exaggeration: z.number().min(TTS_LIMITS.min_exaggeration).max(TTS_LIMITS.max_exaggeration).optional(),
  cfg: z.number().min(TTS_LIMITS.min_cfg).max(TTS_LIMITS.max_cfg).optional(),
  temperature: z.number().min(TTS_LIMITS.min_temperature).max(TTS_LIMITS.max_temperature).optional(),
  seed: z.number().min(0).max(TTS_LIMITS.max_seed).optional(),
  use_webhook: z.boolean().default(true)
})

// Rate limiters
const rate_limiter_standard = create_rate_limiter({
  interval: 60 * 1000, // 1 minute
  max_requests: 60
})

const rate_limiter_free = create_rate_limiter({
  interval: 60 * 1000, // 1 minute  
  max_requests: 10
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
    const rate_limiter = plan === 'standard' ? rate_limiter_standard : rate_limiter_free
    const rate_limit_result = await rate_limiter(clerk_id)
    if (!rate_limit_result.success) {
      return api_error('Too many requests', 429, {
        retry_after: rate_limit_result.reset
      })
    }

    // 4. Validate request
    const body = await req.json()
    const validated = validate_request(audio_generation_schema, body)

    // 5. Calculate cost
    const cost = calculateTTSCost(validated.text.length, plan)
    
    // 6. Check token balance
    if (total_tokens < cost) {
      return api_error('Insufficient tokens', 402, {
        required: cost,
        available: total_tokens
      })
    }

    // 7. Deduct tokens using stored function
    const service_supabase = get_service_role_client()
    const { error: deduct_error } = await service_supabase
      .rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: cost,
        p_description: `Text-to-speech: ${validated.text.substring(0, 50)}...`
      })

    if (deduct_error) {
      console.error('Token deduction error:', deduct_error)
      return api_error('Failed to deduct tokens', 500)
    }

    // 8. Create job record
    const job_id = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    const { data: job, error: job_error } = await service_supabase
      .from('audio_jobs')
      .insert({
        user_id,
        job_id,
        status: 'pending',
        type: 'text',
        text: validated.text,
        voice: validated.voice,
        source_audio_url: validated.source_audio_url,
        high_quality_audio: validated.high_quality_audio,
        exaggeration: validated.exaggeration,
        cfg: validated.cfg,
        temperature: validated.temperature,
        seed: validated.seed,
        cost,
        metadata: {
          plan,
          text_length: validated.text.length
        }
      })
      .select()
      .single()

    if (job_error || !job) {
      console.error('Job creation error:', job_error)
      // Refund tokens
      await service_supabase.rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: -cost,
        p_description: 'Refund: Failed to create audio job'
      })
      return api_error('Failed to create job', 500)
    }

    // 9. Prepare fal.ai request
    const fal_input: Record<string, any> = {
      text: validated.text
    }

    // Add optional parameters
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

    // 10. Determine if we should use webhook
    let webhook_url: string | undefined
    if (validated.use_webhook) {
      const base_url = process.env.VERCEL_URL 
        || process.env.NEXT_PUBLIC_APP_URL 
        || process.env.NEXTAUTH_URL 
        || process.env.URL

      if (base_url) {
        webhook_url = `https://${base_url.replace(/^https?:\/\//, '')}/api/webhooks/fal-ai`
      }
    }

    try {
      // 11. Call fal.ai
      if (webhook_url) {
        // Async with webhook
        const result = await fal.subscribe("fal-ai/stable-audio", {
          input: fal_input,
          webhookUrl: webhook_url,
          logs: true
        })

        // Update job with fal request ID
        await service_supabase
          .from('audio_jobs')
          .update({
            fal_request_id: result.request_id,
            status: 'processing'
          })
          .eq('id', job.id)

        return api_success({
          job_id: job.job_id,
          status: 'processing',
          message: 'Audio generation started. Check status for updates.'
        })
      } else {
        // Sync fallback
        const result = await fal.run("fal-ai/stable-audio", {
          input: fal_input
        })

        if (!result.audio_url) {
          throw new Error('No audio URL in response')
        }

        // Update job with result
        await service_supabase
          .from('audio_jobs')
          .update({
            status: 'completed',
            audio_url: result.audio_url,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        return api_success({
          job_id: job.job_id,
          status: 'completed',
          audio_url: result.audio_url
        })
      }
    } catch (fal_error) {
      console.error('fal.ai error:', fal_error)
      
      // Update job as failed
      await service_supabase
        .from('audio_jobs')
        .update({
          status: 'failed',
          error: fal_error instanceof Error ? fal_error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      // Refund tokens
      await service_supabase.rpc('simple_deduct_tokens', {
        p_user_id: user_id,
        p_amount: -cost,
        p_description: 'Refund: Audio generation failed'
      })

      throw fal_error
    }
  } catch (error) {
    return handle_api_error(error)
  }
}