import { NextRequest } from "next/server"
import { generate_flux_image } from "@/lib/fal_client"
import { track } from "@vercel/analytics/server"
import { 
  get_service_role_client, 
  execute_db_operation 
} from "@/lib/utils/database/supabase"
import { get_redis_client } from "@/lib/utils/database/redis"
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
  image_generation_schema, 
  validate_request 
} from "@/lib/utils/api/validation"
import { 
  enforce_rate_limit, 
  RATE_LIMITS,
  get_rate_limit_headers
} from "@/lib/utils/api/rate_limiter"
import { 
  InsufficientTokensError,
  ValidationError 
} from "@/lib/utils/errors/handlers"
import { sanitize_text } from "@/lib/utils/security/sanitization"
import {
  generate_imggen_cache_key,
  get_model_cost,
  get_tokens_for_size,
} from "@/lib/generate_helpers"

// Constants
const CACHE_TTL = 3600 // 1 hour
const FREE_USER_DELAY = 2000 // 2 seconds
const ASPECT_RATIOS = [
  { label: "9:16", ratio: 9 / 16 },
  { label: "3:4", ratio: 3 / 4 },
  { label: "5:6", ratio: 5 / 6 },
  { label: "1:1", ratio: 1 },
  { label: "6:5", ratio: 6 / 5 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
]

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth(req)
    
    // 2. Validate request body
    const body = await req.json()
    const validated = validate_request(image_generation_schema, body)
    
    // 3. Sanitize prompt
    const prompt = sanitize_text(validated.prompt)
    
    // 4. Get user subscription
    const subscription = await get_user_subscription(user.user_id)
    const is_free_user = subscription.plan_name === 'free'
    
    // 5. Apply rate limiting
    const rate_limit_config = is_free_user 
      ? RATE_LIMITS.image_generation_free 
      : RATE_LIMITS.image_generation_standard
    
    const rate_limit_result = await apply_rate_limit(
      user.user_id,
      rate_limit_config
    )
    
    if (!rate_limit_result.allowed) {
      return api_error('Rate limit exceeded', 429)
        .headers.set(get_rate_limit_headers(rate_limit_result))
    }
    
    // 6. Calculate token cost
    const token_cost = calculate_generation_cost(
      validated.model,
      validated.width || 1024,
      validated.height || 1024
    )
    
    // 7. Check token balance
    if (!await has_sufficient_tokens(user.user_id, token_cost)) {
      throw new InsufficientTokensError(
        token_cost,
        subscription.renewable_tokens + subscription.permanent_tokens
      )
    }
    
    // 8. Check cache
    const cache_key = generate_imggen_cache_key(
      user.user_id,
      validated.model,
      prompt
    )
    
    const redis = get_redis_client()
    const cached = await redis.get(cache_key)
    
    if (cached) {
      track('image_generation_cache_hit', {
        user_id: user.user_id,
        model: validated.model
      })
      
      return api_success({
        ...cached,
        from_cache: true
      })
    }
    
    // 9. Apply delay for free users
    if (is_free_user) {
      await new Promise(resolve => setTimeout(resolve, FREE_USER_DELAY))
    }
    
    // 10. Deduct tokens
    const supabase = get_service_role_client()
    await execute_db_operation(() =>
      supabase.rpc('deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: token_cost
      })
    )
    
    // 11. Generate image
    const result = await generate_flux_image({
      prompt,
      model: validated.model,
      width: validated.width,
      height: validated.height,
      inference_steps: validated.inference_steps,
      guidance_scale: validated.guidance_scale,
      style_preset: validated.style_preset,
      seed: validated.seed
    })
    
    // 12. Apply watermark for free users
    const final_image = is_free_user 
      ? await apply_watermark(result.image_base64)
      : result.image_base64
    
    // 13. Cache result
    await redis.setex(cache_key, CACHE_TTL, {
      image_base64: final_image,
      model: validated.model,
      tokens_used: token_cost,
      created_at: new Date().toISOString()
    })
    
    // 14. Track analytics
    track('image_generation_success', {
      user_id: user.user_id,
      model: validated.model,
      tokens_used: token_cost,
      is_premium: !is_free_user
    })
    
    // 15. Return success response
    return api_success({
      image_base64: final_image,
      model: validated.model,
      tokens_used: token_cost,
      remaining_tokens: subscription.renewable_tokens + 
                       subscription.permanent_tokens - token_cost
    })
    
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      return api_error(error.message, 400)
    }
    
    if (error instanceof InsufficientTokensError) {
      return api_error(error.message, 402)
    }
    
    // Generic error handling
    return handle_api_error(error)
  }
}

/**
 * Calculate token cost for image generation
 */
function calculate_generation_cost(
  model: string,
  width: number,
  height: number
): number {
  const base_cost = get_model_cost(model)
  const size_multiplier = get_tokens_for_size(width, height)
  return Math.ceil(base_cost * size_multiplier)
}

/**
 * Apply watermark to image (stub - implement actual logic)
 */
async function apply_watermark(image_base64: string): Promise<string> {
  // TODO: Implement actual watermark logic
  return image_base64
}