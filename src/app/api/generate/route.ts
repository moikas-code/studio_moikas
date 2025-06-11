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
  deduct_tokens_with_admin_check,
  log_usage_with_admin_tracking 
} from "@/lib/utils/token_management"
import {
  generate_imggen_cache_key
} from "@/lib/generate_helpers"
import { add_overlay_to_image_node } from "@/lib/generate_helpers_node"
import { calculate_final_cost } from "@/lib/pricing_config"

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
    const is_free_user = subscription.plan === 'free'
    
    // Debug logging for admin users
    console.log('[Image Generation] User subscription:', {
      user_id: user.user_id,
      plan: subscription.plan,
      is_free_user,
      is_admin: subscription.plan === 'admin',
      renewable_tokens: subscription.renewable_tokens,
      permanent_tokens: subscription.permanent_tokens
    })
    
    // 5. Apply rate limiting
    await enforce_rate_limit(
      user.user_id,
      is_free_user 
        ? RATE_LIMITS.image_generation_free 
        : RATE_LIMITS.image_generation_standard
    )
    
    // 6. Get model from database and calculate cost
    const supabase = get_service_role_client()
    const { data: model_config } = await supabase
      .from('models')
      .select('*')
      .eq('model_id', validated.model)
      .eq('is_active', true)
      .single()
    
    if (!model_config) {
      throw new Error(`Invalid or inactive model: ${validated.model}`)
    }
    
    // Convert dollar cost to MP (1 MP = $0.001) with plan-based markup
    const base_mp_cost = model_config.custom_cost / 0.001
    const model_cost = subscription.plan === 'admin' 
      ? 0  // Admin users have 0 cost
      : calculate_final_cost(base_mp_cost, subscription.plan)
    
    // Skip token check for admin users
    if (subscription.plan !== 'admin') {
      const total_tokens = subscription.renewable_tokens + subscription.permanent_tokens
      if (total_tokens < model_cost) {
        throw new InsufficientTokensError(model_cost, total_tokens)
      }
    }
    
    // 7. Check cache
    const cache_key = generate_imggen_cache_key(
      user.user_id,
      validated.model,
      prompt,
      validated.width || 1024,
      validated.height || 1024,
      validated.seed
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
    
    // 8. Apply queue delay for free users (but not admins)
    if (is_free_user && subscription.plan !== 'admin') {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 9. Deduct tokens with admin check
    // Check if user is admin and handle token deduction accordingly
    const token_result = await deduct_tokens_with_admin_check(
      supabase,
      user.user_id,
      model_cost,
      subscription
    )
    
    console.log('[Image Generation] Token deduction result:', {
      success: token_result.success,
      is_admin: token_result.is_admin,
      plan_type: token_result.plan_type,
      original_cost: token_result.original_cost,
      effective_cost: token_result.effective_cost,
      error: token_result.error
    })

    if (!token_result.success) {
      throw new Error(token_result.error || 'Failed to process tokens')
    }

    // Log usage with admin tracking for analytics
    await log_usage_with_admin_tracking(
      supabase,
      user.user_id,
      model_cost,
      'image_generation',
      `Image generation: ${validated.model}`,
      {
        model: validated.model,
        width: validated.width,
        height: validated.height,
        plan: subscription.plan
      },
      token_result
    )
    
    // 10. Generate image
    try {
      const generation_options: {
        negative_prompt?: string;
        num_inference_steps?: number;
        guidance_scale?: number;
        style_name?: string;
        seed?: number;
        embeddings?: Array<{ path: string; tokens?: string[] }>;
        loras?: Array<{ path: string; scale?: number }>;
        num_images?: number;
        enable_safety_checker?: boolean;
        expand_prompt?: boolean;
        format?: 'jpeg' | 'png';
      } = {}
      
      // Add optional params
      if (validated.negative_prompt) {
        generation_options.negative_prompt = validated.negative_prompt
      }
      if (validated.num_inference_steps) {
        generation_options.num_inference_steps = validated.num_inference_steps
      }
      if (validated.guidance_scale !== undefined) {
        generation_options.guidance_scale = validated.guidance_scale
      }
      if (validated.style_preset) {
        generation_options.style_name = validated.style_preset
      }
      if (validated.seed !== undefined) {
        generation_options.seed = validated.seed
      }
      // Fast-SDXL specific parameters
      if (validated.model === 'fal-ai/fast-sdxl') {
        console.log('[Fast-SDXL] Processing specific parameters')
        
        if (validated.num_images !== undefined) {
          generation_options.num_images = validated.num_images
        }
        if (validated.enable_safety_checker !== undefined) {
          generation_options.enable_safety_checker = validated.enable_safety_checker
        }
        if (validated.expand_prompt !== undefined) {
          generation_options.expand_prompt = validated.expand_prompt
        }
        if (validated.format !== undefined) {
          generation_options.format = validated.format
        }
        
        // Log the parameters for debugging
        console.log('[Fast-SDXL] Parameters:', {
          num_images: validated.num_images,
          enable_safety_checker: validated.enable_safety_checker,
          expand_prompt: validated.expand_prompt,
          format: validated.format
        })
      }
      // Add embeddings and LoRAs for SDXL models
      if (validated.model.includes('sdxl')) {
        if (validated.embeddings && validated.embeddings.length > 0) {
          // Filter out any invalid embeddings
          const valid_embeddings = validated.embeddings.filter(e => e && e.path)
          if (valid_embeddings.length > 0) {
            generation_options.embeddings = valid_embeddings
          }
        }
        if (validated.loras && validated.loras.length > 0) {
          // Debug log the loras
          console.log('[SDXL] Raw loras:', JSON.stringify(validated.loras, null, 2))
          
          // Filter out any invalid loras
          const valid_loras = validated.loras.filter(l => l && l.path)
          console.log('[SDXL] Valid loras after filter:', JSON.stringify(valid_loras, null, 2))
          
          if (valid_loras.length > 0) {
            generation_options.loras = valid_loras
          }
        }
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
      
      // Apply watermark for free users (but not admins)
      if (is_free_user && !token_result.is_admin) {
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
        // Cache for 5 minutes to prevent accidental duplicate requests
        await redis.setex(cache_key, 300, cache_data)
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
      // Refund tokens on failure - only if not admin
      if (!token_result.is_admin) {
        await supabase
          .from('subscriptions')
          .update({
            renewable_tokens: subscription.renewable_tokens, // restore original values
            permanent_tokens: subscription.permanent_tokens
          })
          .eq('user_id', user.user_id)
      }

      // Log the refund with admin tracking
      await log_usage_with_admin_tracking(
        supabase,
        user.user_id,
        -model_cost, // negative for refund
        'image_generation_refund',
        'Image generation refund: generation failed',
        {
          model: validated.model,
          plan: subscription.plan,
          refund_reason: 'generation_failed'
        },
        token_result
      )
      
      console.error('Image generation failed:', generation_error)
      const error_message = generation_error instanceof Error ? generation_error.message : 'Unknown error'
      throw new Error(`Image generation failed: ${error_message}`)
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}