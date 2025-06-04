import { NextRequest } from "next/server"
import { generate_flux_image } from "@/lib/fal_client"
import { track } from "@vercel/analytics/server"

// Next.js route configuration
export const dynamic = 'force-dynamic' // Always fresh data
export const runtime = 'nodejs' // Use Node.js runtime for full compatibility
import { 
  get_service_role_client, 
  execute_db_operation 
} from "@/lib/utils/database/supabase"
import { get_redis_client } from "@/lib/utils/database/redis"
import { 
  require_auth, 
  get_user_subscription
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
  RATE_LIMITS
} from "@/lib/utils/api/rate_limiter"
import { 
  InsufficientTokensError
} from "@/lib/utils/errors/handlers"
import { sanitize_text } from "@/lib/utils/security/sanitization"
import {
  generate_imggen_cache_key,
  get_model_cost,
  apply_watermark_to_image
} from "@/lib/generate_helpers"

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await require_auth(req)
    
    // 2. Parse and validate request
    const body = await req.json()
    const validated = validate_request(image_generation_schema, body)
    
    // 3. Sanitize inputs
    const prompt = sanitize_text(validated.prompt)
    
    // 4. Get user subscription
    const subscription = await get_user_subscription(user.user_id)
    const is_free_user = subscription.plan_name === 'free'
    
    // 5. Apply rate limiting
    await enforce_rate_limit(
      user.user_id,
      is_free_user 
        ? RATE_LIMITS.image_generation_free 
        : RATE_LIMITS.image_generation_standard
    )
    
    // 6. Calculate cost
    const model_cost = get_model_cost(validated.model)
    const total_tokens = subscription.renewable_tokens + subscription.permanent_tokens
    
    if (total_tokens < model_cost) {
      throw new InsufficientTokensError(model_cost, total_tokens)
    }
    
    // 7. Check cache
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
      
      return api_success(cached)
    }
    
    // 8. Apply queue delay for free users
    if (is_free_user) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 9. Deduct tokens
    const supabase = get_service_role_client()
    await execute_db_operation(() =>
      supabase.rpc('deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: model_cost
      })
    )
    
    // 10. Generate image
    try {
      const generation_params: any = {
        prompt,
        model: validated.model,
        image_size: {
          width: validated.width || 1024,
          height: validated.height || 1024
        }
      }
      
      // Add optional params
      if (validated.inference_steps) {
        generation_params.num_inference_steps = validated.inference_steps
      }
      if (validated.guidance_scale) {
        generation_params.guidance_scale = validated.guidance_scale
      }
      if (validated.style_preset) {
        generation_params.style_preset = validated.style_preset
      }
      if (validated.seed !== undefined) {
        generation_params.seed = validated.seed
      }
      
      const result = await generate_flux_image(generation_params)
      
      // 11. Apply watermark for free users
      let final_image = result.images[0].url
      if (is_free_user) {
        final_image = await apply_watermark_to_image(final_image)
      }
      
      // 12. Cache result
      const cache_data = {
        base64Image: final_image,
        model: validated.model,
        mpUsed: model_cost,
        timestamp: new Date().toISOString()
      }
      
      await redis.setex(cache_key, 3600, cache_data)
      
      // 13. Track success
      track('image_generation_success', {
        user_id: user.user_id,
        model: validated.model,
        cost: model_cost
      })
      
      return api_success(cache_data)
      
    } catch (generation_error) {
      // Refund tokens on failure
      await execute_db_operation(() =>
        supabase.rpc('refund_tokens', {
          p_user_id: user.user_id,
          p_amount: model_cost
        })
      )
      
      throw generation_error
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}