import { NextRequest } from "next/server"
import { generate_flux_image, generate_sd_lora_image } from "@/lib/fal_client"
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
import { 
  moderate_prompt, 
  format_violations
} from "@/lib/utils/api/prompt_moderation"

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
    
    // 6. Moderate prompt content
    const moderation_result = await moderate_prompt(prompt, {
      skipForAdmin: subscription.plan === 'admin' // Optional: skip moderation for admins
    })
    
    // Get supabase client for both moderation logging and model lookup
    const supabase = get_service_role_client()
    
    // Log moderation decision to database
    await supabase.rpc('log_moderation_decision', {
      p_user_id: user.user_id,
      p_prompt: prompt,
      p_safe: moderation_result.safe,
      p_violations: moderation_result.violations,
      p_confidence: moderation_result.confidence
    })
    
    // Block unsafe content
    if (!moderation_result.safe) {
      const violation_text = format_violations(moderation_result.violations)
      return handle_api_error(
        new Error(`Content blocked: This prompt contains ${violation_text}. Adult content with consenting adults is allowed, but harmful or illegal content is not permitted.`),
        'CONTENT_MODERATION_VIOLATION'
      )
    }
    
    // 7. Get model from database and calculate cost
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
    let cost_per_image = subscription.plan === 'admin' 
      ? 0  // Admin users have 0 cost
      : calculate_final_cost(base_mp_cost, subscription.plan)
    
    // Calculate total cost for multiple images
    const num_images = validated.num_images || 1
    let total_cost = cost_per_image * num_images
    
    // Skip token check for admin users
    if (subscription.plan !== 'admin') {
      const total_tokens = subscription.renewable_tokens + subscription.permanent_tokens
      if (total_tokens < total_cost) {
        throw new InsufficientTokensError(total_cost, total_tokens)
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
    
    // 9. Store initial cost for potential dynamic pricing
    let initial_total_cost = total_cost
    let is_dynamic_pricing = false
    
    // Check if this model supports dynamic pricing based on inference time
    if ((model_config.metadata?.enable_dynamic_pricing || validated.model === 'fal-ai/lora') && model_config.metadata?.cost_per_inference_second) {
      is_dynamic_pricing = true
      console.log('[Dynamic Pricing] Model supports dynamic pricing')
      // For dynamic pricing models, we'll deduct a minimal amount first
      // and adjust after we know the actual inference time
      initial_total_cost = 1 * num_images // 1 MP per image as placeholder
    }
    
    // Deduct tokens with admin check
    // Check if user is admin and handle token deduction accordingly
    const token_result = await deduct_tokens_with_admin_check(
      supabase,
      user.user_id,
      initial_total_cost,
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
      total_cost,
      'image_generation',
      `Image generation: ${validated.model} (${num_images} image${num_images > 1 ? 's' : ''})`,
      {
        model: validated.model,
        width: validated.width,
        height: validated.height,
        plan: subscription.plan,
        num_images: num_images,
        cost_per_image: cost_per_image
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
        model_name?: string;
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
      
      // Handle custom model_name for LoRA models
      let effective_model_id = validated.model
      const is_lora_model = model_config.supports_loras || validated.model === 'fal-ai/lora'
      const is_any_lora = validated.model === 'fal-ai/lora'
      
      // For the "Any LoRA" model, we need to handle it differently
      if (is_any_lora) {
        // For Any LoRA, we always use the fal-ai/lora endpoint
        effective_model_id = 'fal-ai/lora'
        
        // The custom model name will be passed as a parameter to the API
        if (validated.model_name) {
          // Add model_name to generation options for the SD handler
          generation_options.model_name = validated.model_name
          console.log('[Any LoRA] Using fal-ai/lora endpoint with custom model:', validated.model_name)
        } else {
          // Use default model from metadata
          const default_model = model_config.metadata?.default_model_name as string || 'stabilityai/stable-diffusion-xl-base-1.0'
          generation_options.model_name = default_model
          console.log('[Any LoRA] Using fal-ai/lora endpoint with default model:', default_model)
        }
      } else if (is_lora_model && validated.model_name) {
        // For other LoRA-supporting models, use the custom model_name if provided
        effective_model_id = validated.model_name
        console.log('[LoRA] Using custom model:', effective_model_id)
      }
      
      // Use appropriate handler based on model type
      // Note: fal-ai/fast-sdxl uses the flux handler, not the SD handler
      // fal-ai/lora endpoint uses the SD handler
      const use_sd_handler = effective_model_id === 'fal-ai/lora' ||
                             (is_lora_model && effective_model_id !== 'fal-ai/fast-sdxl') || 
                             (validated.model.includes('stable-diffusion') && !validated.model.includes('fast-sdxl'))
      
      console.log('[Handler Selection]', {
        original_model: validated.model,
        effective_model_id,
        is_lora_model,
        is_any_lora,
        use_sd_handler,
        has_loras: !!generation_options.loras && generation_options.loras.length > 0,
        has_model_name: !!generation_options.model_name
      })
      
      const result = use_sd_handler
        ? await generate_sd_lora_image(
            prompt,
            validated.width || 1024,
            validated.height || 1024,
            effective_model_id,
            generation_options
          )
        : await generate_flux_image(
            prompt,
            validated.width || 1024,
            validated.height || 1024,
            effective_model_id,
            generation_options
          )
      
      console.log('Fal.ai result structure:', {
        hasData: 'data' in result,
        dataKeys: result.data ? Object.keys(result.data) : 'no data',
        topLevelKeys: Object.keys(result),
        timings: 'timings' in result && typeof result === 'object' ? (result as { timings?: unknown }).timings : 'no timings'
      })
      console.log('Full result:', JSON.stringify(result, null, 2))
      
      // Extract inference time for dynamic pricing
      let inference_time: number | undefined
      if (result && typeof result === 'object' && 'timings' in result && typeof result.timings === 'object') {
        const timings = result.timings as Record<string, unknown>
        if ('inference' in timings && typeof timings.inference === 'number') {
          inference_time = timings.inference
          console.log('[Dynamic Pricing] Inference time:', inference_time, 'seconds')
        }
      }
      
      // Handle dynamic pricing adjustment if inference time is available
      let actual_mp_cost: number | undefined
      let actual_total_cost: number | undefined
      let cost_per_second: number | undefined
      
      if (is_dynamic_pricing && inference_time !== undefined && model_config.metadata?.cost_per_inference_second) {
        cost_per_second = model_config.metadata.cost_per_inference_second as number
        actual_mp_cost = Math.ceil(inference_time * cost_per_second)
        actual_total_cost = actual_mp_cost * num_images
        
        console.log('[Dynamic Pricing] Calculating actual cost:', {
          inference_time,
          cost_per_second,
          actual_mp_cost,
          actual_total_cost,
          initial_total_cost
        })
        
        // Adjust tokens if actual cost is different from initial
        if (actual_total_cost > initial_total_cost && subscription.plan !== 'admin') {
          const additional_cost = actual_total_cost - initial_total_cost
          
          // Check if user has enough tokens for the additional cost
          const updated_subscription = await get_user_subscription(user.user_id)
          const total_available = updated_subscription.renewable_tokens + updated_subscription.permanent_tokens
          
          if (total_available < additional_cost) {
            // Refund initial deduction and fail
            await supabase
              .from('subscriptions')
              .update({
                renewable_tokens: subscription.renewable_tokens,
                permanent_tokens: subscription.permanent_tokens
              })
              .eq('user_id', user.user_id)
            
            throw new Error(`Insufficient tokens for actual generation cost. Need ${actual_total_cost} MP total, but only ${total_available + initial_total_cost} MP available`)
          }
          
          // Deduct additional tokens
          const additional_result = await deduct_tokens_with_admin_check(
            supabase,
            user.user_id,
            additional_cost,
            updated_subscription
          )
          
          if (!additional_result.success) {
            // Refund initial deduction
            await supabase
              .from('subscriptions')
              .update({
                renewable_tokens: subscription.renewable_tokens,
                permanent_tokens: subscription.permanent_tokens
              })
              .eq('user_id', user.user_id)
            
            throw new Error('Failed to deduct additional tokens for dynamic pricing')
          }
          
          // Update total cost for response
          if (actual_total_cost !== undefined && actual_mp_cost !== undefined) {
            total_cost = actual_total_cost
            cost_per_image = actual_mp_cost
          }
          
          // Log the additional deduction
          await log_usage_with_admin_tracking(
            supabase,
            user.user_id,
            additional_cost,
            'image_generation',
            `Dynamic pricing adjustment for ${validated.model} (${inference_time.toFixed(2)}s inference)`,
            {
              model: validated.model,
              inference_time,
              cost_per_second,
              additional_cost,
              total_cost: actual_total_cost
            },
            additional_result
          )
        } else if (actual_total_cost < initial_total_cost && subscription.plan !== 'admin') {
          // Refund the difference if actual cost is less
          const refund_amount = initial_total_cost - actual_total_cost
          
          // Calculate how much was deducted from each token type
          const renewable_deducted = Math.min(initial_total_cost, subscription.renewable_tokens)
          
          // Refund proportionally
          const renewable_refund = Math.min(refund_amount, renewable_deducted)
          const permanent_refund = refund_amount - renewable_refund
          
          await supabase
            .from('subscriptions')
            .update({
              renewable_tokens: subscription.renewable_tokens + renewable_refund,
              permanent_tokens: subscription.permanent_tokens + permanent_refund
            })
            .eq('user_id', user.user_id)
          
          // Update total cost for response
          if (actual_total_cost !== undefined && actual_mp_cost !== undefined) {
            total_cost = actual_total_cost
            cost_per_image = actual_mp_cost
          }
          
          // Log the refund
          await log_usage_with_admin_tracking(
            supabase,
            user.user_id,
            -refund_amount,
            'image_generation',
            `Dynamic pricing refund for ${validated.model} (${inference_time.toFixed(2)}s inference)`,
            {
              model: validated.model,
              inference_time,
              cost_per_second,
              refund_amount,
              total_cost: actual_total_cost
            },
            token_result
          )
        }
      }
      
      // 11. Extract all generated images
      // Check different possible result structures
      const final_images: string[] = []
      
      if (result && typeof result === 'object') {
        // Check for data wrapper (fal.ai client response)
        if ('data' in result && result.data && typeof result.data === 'object') {
          const data = result.data
          // Check for images array in data (standard fal.ai response)
          if ('images' in data && Array.isArray(data.images) && data.images.length > 0) {
            // Collect ALL images, not just the first one
            for (const image of data.images) {
              if (typeof image === 'string') {
                final_images.push(image)
              } else if (image && typeof image === 'object' && 'url' in image) {
                final_images.push(image.url)
              }
            }
          }
          // Check for single image in data
          else if ('image' in data && typeof data.image === 'string') {
            final_images.push(data.image)
          }
          // Check for URL in data
          else if ('url' in data && typeof data.url === 'string') {
            final_images.push(data.url)
          }
          else {
            console.error('Unknown data structure:', JSON.stringify(data, null, 2))
            throw new Error(`Unexpected data structure. Keys found in data: ${Object.keys(data).join(', ')}`)
          }
        }
        // Fallback: Check for images array at top level
        else if ('images' in result && Array.isArray(result.images) && result.images.length > 0) {
          for (const image of result.images) {
            if (typeof image === 'string') {
              final_images.push(image)
            } else if (image && typeof image === 'object' && 'url' in image) {
              final_images.push(image.url)
            }
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
      
      if (final_images.length === 0) {
        throw new Error('Failed to extract any image URLs from response')
      }
      
      // Process all images: convert to base64 and apply watermarks
      const processed_images: string[] = []
      
      for (const image_url of final_images) {
        let base64_image: string
        
        if (image_url.startsWith('data:image')) {
          // Already base64
          base64_image = image_url.split(',')[1]
        } else if (image_url.startsWith('http')) {
          // Fetch and convert to base64
          try {
            const image_response = await fetch(image_url)
            const buffer = await image_response.arrayBuffer()
            base64_image = Buffer.from(buffer).toString('base64')
          } catch (e) {
            console.error('Failed to fetch and convert image:', e)
            continue // Skip this image but process others
          }
        } else {
          // Assume it's already base64
          base64_image = image_url
        }
        
        // Apply watermark for free users (but not admins)
        if (is_free_user && !token_result.is_admin) {
          const watermarked = await add_overlay_to_image_node(`data:image/png;base64,${base64_image}`)
          base64_image = watermarked.split(',')[1]
        }
        
        processed_images.push(base64_image)
      }
      
      if (processed_images.length === 0) {
        throw new Error('Failed to process any generated images')
      }
      
      // 12. Cache result - return all images
      const cache_data = {
        images: processed_images,
        base64Image: processed_images[0], // Keep for backward compatibility
        model: validated.model,
        mpUsed: total_cost, // Total MP used for all images
        costPerImage: cost_per_image,
        totalCost: total_cost,
        imageCount: processed_images.length,
        timestamp: new Date().toISOString(),
        ...(inference_time !== undefined && { inferenceTime: inference_time }),
        ...(is_dynamic_pricing && { dynamicPricing: true })
      }
      
      if (redis) {
        // Cache for 5 minutes to prevent accidental duplicate requests
        await redis.setex(cache_key, 300, cache_data)
      }
      
      // 13. Track success
      track('image_generation_success', {
        user_id: user.user_id,
        model: validated.model,
        cost: total_cost,
        num_images: processed_images.length,
        cost_per_image: cost_per_image
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
        -total_cost, // negative for refund
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