import { NextRequest } from "next/server"
import { generate_flux_image } from "@/lib/fal_client"
import { track } from "@vercel/analytics/server"

// Next.js route configuration
export const dynamic = 'force-dynamic' // Always fresh data
export const runtime = 'nodejs' // Use Node.js runtime for full compatibility
import { 
  get_service_role_client
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
  generate_imggen_cache_key
} from "@/lib/generate_helpers"
import { get_image_model_config } from "@/lib/ai_models"
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
    const model_config = get_image_model_config(validated.model)
    if (!model_config) {
      throw new Error(`Invalid model: ${validated.model}`)
    }
    
    // Convert dollar cost to MP (1 MP = $0.001) with 1.6x markup
    const model_cost = Math.ceil((model_config.custom_cost * 1.6) / 0.001)
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
    let cached = null
    
    if (redis) {
      cached = await redis.get(cache_key)
    }
    
    if (cached) {
      track('image_generation_cache_hit', {
        user_id: user.user_id,
        model: validated.model
      })
      
      // Ensure cached data has correct structure
      if (typeof cached === 'string') {
        // Old cache format, skip it
        if (redis) {
          await redis.del(cache_key)
        }
      } else {
        return api_success(cached)
      }
    }
    
    // 8. Apply queue delay for free users
    if (is_free_user) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 9. Deduct tokens - prioritize renewable tokens first, then permanent
    const supabase = get_service_role_client()
    const renewable_to_deduct = Math.min(model_cost, subscription.renewable_tokens)
    const permanent_to_deduct = model_cost - renewable_to_deduct

    // Deduct tokens directly without execute_db_operation
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
        tokens_used: model_cost,
        description: `Image generation: ${validated.model}`
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
      
      console.log('Fal.ai result structure:', {
        hasData: 'data' in result,
        dataKeys: result.data ? Object.keys(result.data) : 'no data',
        topLevelKeys: Object.keys(result)
      })
      console.log('Full result:', JSON.stringify(result, null, 2))
      
      // 11. Apply watermark for free users
      // Check different possible result structures
      let final_image: string = ''
      
      if (result && typeof result === 'object') {
        // Check for data wrapper (fal.ai client response)
        if ('data' in result && result.data && typeof result.data === 'object') {
          const data = result.data
          // Check for images array in data (standard fal.ai response)
          if ('images' in data && Array.isArray(data.images) && data.images.length > 0) {
            const firstImage = data.images[0]
            if (typeof firstImage === 'string') {
              final_image = firstImage
            } else if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
              final_image = firstImage.url
              console.log('Extracted image URL:', final_image)
            } else {
              throw new Error('Invalid image format in data.images array')
            }
          }
          // Check for single image in data
          else if ('image' in data && typeof data.image === 'string') {
            final_image = data.image
          }
          // Check for URL in data
          else if ('url' in data && typeof data.url === 'string') {
            final_image = data.url
          }
          else {
            console.error('Unknown data structure:', JSON.stringify(data, null, 2))
            throw new Error(`Unexpected data structure. Keys found in data: ${Object.keys(data).join(', ')}`)
          }
        }
        // Fallback: Check for images array at top level
        else if ('images' in result && Array.isArray(result.images) && result.images.length > 0) {
          const firstImage = result.images[0]
          if (typeof firstImage === 'string') {
            final_image = firstImage
          } else if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
            final_image = firstImage.url
          } else {
            throw new Error('Invalid image format in images array')
          }
        }
        // Other fallback options...
        else {
          console.error('Unknown result structure:', JSON.stringify(result, null, 2))
          throw new Error(`Unexpected result structure from image generation. Keys found: ${Object.keys(result).join(', ')}`)
        }
      } else {
        throw new Error('Invalid result from image generation')
      }
      
      if (!final_image) {
        throw new Error('Failed to extract image URL from response')
      }
      
      // Convert URL to base64 if needed
      let base64_image: string
      if (final_image.startsWith('data:image')) {
        // Already base64
        base64_image = final_image.split(',')[1]
      } else if (final_image.startsWith('http')) {
        // Fetch and convert to base64
        try {
          const image_response = await fetch(final_image)
          const buffer = await image_response.arrayBuffer()
          base64_image = Buffer.from(buffer).toString('base64')
        } catch (e) {
          console.error('Failed to fetch and convert image:', e)
          throw new Error('Failed to process generated image')
        }
      } else {
        // Assume it's already base64
        base64_image = final_image
      }
      
      // Apply watermark for free users
      if (is_free_user) {
        const watermarked = await add_overlay_to_image_node(`data:image/png;base64,${base64_image}`)
        base64_image = watermarked.split(',')[1]
      }
      
      // 12. Cache result
      const cache_data = {
        base64Image: base64_image,
        model: validated.model,
        mpUsed: model_cost,
        timestamp: new Date().toISOString()
      }
      
      if (redis) {
        await redis.setex(cache_key, 3600, cache_data)
      }
      
      // 13. Track success
      track('image_generation_success', {
        user_id: user.user_id,
        model: validated.model,
        cost: model_cost
      })
      
      console.log('Returning cache_data:', {
        hasBase64: !!cache_data.base64Image,
        base64Length: cache_data.base64Image?.length || 0,
        model: cache_data.model,
        mpUsed: cache_data.mpUsed
      })
      
      return api_success(cache_data)
      
    } catch (generation_error) {
      // Refund tokens on failure - add back the same way we deducted
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
      
      console.error('Image generation failed:', generation_error)
      const error_message = generation_error instanceof Error ? generation_error.message : 'Unknown error'
      throw new Error(`Image generation failed: ${error_message}`)
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}