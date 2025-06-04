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
  get_model_cost
} from "@/lib/generate_helpers"
import { add_overlay_to_image_node } from "@/lib/generate_helpers_node"

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await require_auth()
    
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
      prompt,
      validated.width || 1024,
      validated.height || 1024
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
    
    // 9. Deduct tokens - prioritize renewable tokens first, then permanent
    const supabase = get_service_role_client()
    const renewable_to_deduct = Math.min(model_cost, subscription.renewable_tokens)
    const permanent_to_deduct = model_cost - renewable_to_deduct

    await execute_db_operation(async () => {
      const { error: deduct_error } = await supabase
        .from('subscriptions')
        .update({
          renewable_tokens: subscription.renewable_tokens - renewable_to_deduct,
          permanent_tokens: subscription.permanent_tokens - permanent_to_deduct
        })
        .eq('user_id', user.user_id)

      if (deduct_error) throw deduct_error

      // Log the usage
      await supabase
        .from('usage')
        .insert({
          user_id: user.user_id,
          tokens_used: model_cost,
          description: `Image generation: ${validated.model}`
        })
    })
    
    // 10. Generate image
    try {
      const generation_options: {
        num_inference_steps?: number;
        guidance_scale?: number;
        style_name?: string;
        seed?: number;
      } = {}
      
      // Add optional params
      if (validated.inference_steps) {
        generation_options.num_inference_steps = validated.inference_steps
      }
      if (validated.guidance_scale) {
        generation_options.guidance_scale = validated.guidance_scale
      }
      if (validated.style_preset) {
        generation_options.style_name = validated.style_preset
      }
      if (validated.seed !== undefined) {
        generation_options.seed = validated.seed
      }
      
      const result = await generate_flux_image(
        prompt,
        validated.width || 1024,
        validated.height || 1024,
        validated.model,
        generation_options
      )
      
      // 11. Apply watermark for free users
      interface GenerationResult {
        images: Array<{ url: string }>
      }
      let final_image = (result as unknown as GenerationResult).images[0].url
      if (is_free_user) {
        final_image = await add_overlay_to_image_node(final_image)
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
      
    } catch {
      // Refund tokens on failure - add back the same way we deducted
      await execute_db_operation(async () => {
        await supabase
          .from('subscriptions')
          .update({
            renewable_tokens: subscription.renewable_tokens, // restore original values
            permanent_tokens: subscription.permanent_tokens
          })
          .eq('user_id', user.user_id)

        // Log the refund
        await supabase
          .from('usage')
          .insert({
            user_id: user.user_id,
            tokens_used: -model_cost, // negative for refund
            description: `Image generation refund: generation failed`
          })
      })
      
      throw new Error('Image generation failed')
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}