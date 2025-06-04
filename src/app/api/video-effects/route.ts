import { NextRequest } from "next/server"
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  require_auth, 
  get_user_subscription,
  has_sufficient_tokens
} from "@/lib/utils/api/auth"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { 
  validate_request 
} from "@/lib/utils/api/validation"
import { 
  enforce_rate_limit, 
  RATE_LIMITS
} from "@/lib/utils/api/rate_limiter"
import { sanitize_text } from "@/lib/utils/security/sanitization"
import { z } from "zod"
import { track } from "@vercel/analytics/server"
import { get_video_model_config } from "@/lib/ai_models"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Video processing can take time

// Validation schema
const video_effects_schema = z.object({
  prompt: z.string().min(1).max(1000),
  negative_prompt: z.string().optional(),
  model: z.string(),
  aspect_ratio: z.enum(['16:9', '1:1', '9:16']),
  duration: z.number().int().min(1).max(10),
  image_url: z.string().url().optional(),
  image_file_base64: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()
    
    // 2. Validate request
    const body = await req.json()
    const validated = validate_request(video_effects_schema, body)
    
    // 3. Sanitize prompt
    const prompt = sanitize_text(validated.prompt)
    
    // 4. Get user subscription
    const subscription = await get_user_subscription(user.user_id)
    const is_free = subscription.plan_name === 'free'
    
    // 5. Apply rate limiting
    await enforce_rate_limit(
      user.user_id,
      is_free ? RATE_LIMITS.video_processing : {
        ...RATE_LIMITS.video_processing,
        requests: 10 // More for paid users
      }
    )
    
    // 6. Calculate cost based on model
    const model_config = get_video_model_config(validated.model)
    if (!model_config) {
      return api_error(`Invalid video model: ${validated.model}`, 400)
    }
    
    // Convert dollar cost to MP (1 MP = $0.001) with 1.6x markup
    // For video, multiply by duration in seconds
    const base_mp_cost = Math.ceil((model_config.custom_cost * 1.6) / 0.001)
    const cost = base_mp_cost * validated.duration
    
    // 7. Check token balance
    if (!await has_sufficient_tokens(user.user_id, cost)) {
      return api_error('Insufficient tokens for video generation', 402)
    }
    
    // 8. Create job record
    const supabase = get_service_role_client()
    
    // Generate a unique job_id for external tracking
    const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const { data: job, error: job_error } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.user_id,
        job_id: job_id,
        prompt,
        negative_prompt: validated.negative_prompt || null,
        model_id: validated.model, // Fix: table uses model_id not model
        aspect: validated.aspect_ratio, // Fix: table uses aspect not aspect_ratio
        duration: validated.duration,
        status: 'pending',
        image_url: validated.image_url || null
      })
      .select()
      .single()
    
    if (job_error || !job) {
      throw new Error('Failed to create job')
    }
    
    // 9. Deduct tokens - prioritize renewable tokens first, then permanent
    const renewable_to_deduct = Math.min(cost, subscription.renewable_tokens)
    const permanent_to_deduct = cost - renewable_to_deduct

    const { error: deduct_error } = await supabase
      .from('subscriptions')
      .update({
        renewable_tokens: subscription.renewable_tokens - renewable_to_deduct,
        permanent_tokens: subscription.permanent_tokens - permanent_to_deduct
      })
      .eq('user_id', user.user_id)

    if (deduct_error) {
      throw new Error(`Failed to deduct tokens: ${deduct_error.message}`)
    }

    // Log the usage
    await supabase
      .from('usage')
      .insert({
        user_id: user.user_id,
        tokens_used: cost,
        description: `Video generation: ${validated.model}`
      })
    
    // 10. Trigger actual video generation via webhook
    // For production, this would be handled by a webhook from fal.ai
    // For now, update job to simulate processing
    await supabase
      .from('video_jobs')
      .update({ 
        status: 'processing',
        progress: 10
      })
      .eq('id', job.id)
    
    // 11. Track event
    track('video_generation_started', {
      user_id: user.user_id,
      model: validated.model,
      duration: validated.duration,
      cost
    })
    
    // 12. Return job info
    return api_success({
      job_id: job.job_id, // Return the string job_id, not the UUID id
      status: 'processing',
      estimated_time: validated.duration * 10, // seconds
      cost
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}