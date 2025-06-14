import { NextRequest } from "next/server"
import { v4 as uuidv4 } from "uuid"
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
import { calculate_final_cost } from "@/lib/pricing_config"
import { generate_imggen_cache_key } from "@/lib/generate_helpers"
import { add_overlay_to_image_node } from "@/lib/generate_helpers_node"
import { fal } from "@fal-ai/client"

// Configure fal client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  })
}

// Get base URL for webhooks
const get_base_url = () => {
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL 
    || process.env.NEXTAUTH_URL 
    || process.env.URL
    || 'http://localhost:3000'
}

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
    const { data: model_config, error: model_error } = await supabase
      .from('models')
      .select('*')
      .eq('model_id', validated.model)
      .eq('is_active', true)
      .single()
    
    if (model_error || !model_config) {
      throw new Error(`Invalid or inactive model: ${validated.model}`)
    }
    
    // Convert dollar cost to MP (1 MP = $0.001) with plan-based markup
    const base_mp_cost = model_config.custom_cost / 0.001
    const cost_per_image = subscription.plan === 'admin' 
      ? 0  // Admin users have 0 cost
      : calculate_final_cost(base_mp_cost, subscription.plan)
    
    // Calculate total cost for multiple images
    const num_images = validated.num_images || 1
    const total_cost = cost_per_image * num_images
    
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
    
    if (cached && typeof cached === 'object' && 'job_id' in cached) {
      track('image_generation_cache_hit', {
        user_id: user.user_id,
        model: validated.model
      })
      
      return api_success(cached)
    }
    
    // 8. Apply queue delay for free users (but not admins)
    if (is_free_user && subscription.plan !== 'admin') {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 9. Create job in database
    const job_id = uuidv4()
    
    console.log('Creating image job with data:', {
      job_id,
      user_id: user.user_id,
      model: validated.model,
      prompt: prompt.substring(0, 50) + '...',
      cost: total_cost
    })
    
    const { data: job, error: job_error } = await supabase
      .from('image_jobs')
      .insert({
        job_id,
        user_id: user.user_id,
        prompt,
        model: validated.model,
        image_size: `${validated.width || 1024}x${validated.height || 1024}`,
        num_images,
        cost: total_cost,
        status: 'pending',
        metadata: {
          plan: subscription.plan,
          is_free_user,
          negative_prompt: validated.negative_prompt,
          num_inference_steps: validated.num_inference_steps,
          guidance_scale: validated.guidance_scale,
          style_preset: validated.style_preset,
          seed: validated.seed,
          embeddings: validated.embeddings,
          loras: validated.loras,
          model_name: validated.model_name,
          enable_safety_checker: validated.enable_safety_checker,
          expand_prompt: validated.expand_prompt,
          format: validated.format
        }
      })
      .select()
      .single()
    
    if (job_error || !job) {
      console.error('Failed to create job:', job_error)
      console.error('Job data:', job)
      throw new Error(`Failed to create image generation job: ${job_error?.message || 'Unknown error'}`)
    }
    
    console.log('Successfully created image job:', job.id)
    
    // 10. Deduct tokens (skip for admin users)
    if (subscription.plan !== 'admin') {
      const { error: deduct_error } = await supabase.rpc('deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: total_cost,
        p_description: `Image generation: ${validated.model} (${num_images} image${num_images > 1 ? 's' : ''})`
      })
      
      if (deduct_error) {
        // Delete the job if token deduction fails
        await supabase
          .from('image_jobs')
          .delete()
          .eq('id', job.id)
        
        throw new Error('Failed to deduct tokens')
      }
    }
    
    // 11. Submit to fal.ai with webhook
    try {
      const base_url = get_base_url()
      const webhook_url = base_url ? `${base_url}/api/webhooks/fal-ai` : null
      
      if (!webhook_url) {
        console.warn('No webhook URL configured, job status updates will not be received')
      }
      
      // Build input for fal.ai
      const fal_input: Record<string, unknown> = {
        prompt,
        image_size: {
          width: validated.width || 1024,
          height: validated.height || 1024
        }
      }
      
      // Add optional parameters
      if (validated.negative_prompt) {
        fal_input.negative_prompt = validated.negative_prompt
      }
      if (validated.num_inference_steps) {
        fal_input.num_inference_steps = validated.num_inference_steps
      }
      if (validated.guidance_scale !== undefined) {
        fal_input.guidance_scale = validated.guidance_scale
      }
      if (validated.seed !== undefined) {
        fal_input.seed = validated.seed
      }
      if (validated.num_images !== undefined) {
        fal_input.num_images = validated.num_images
      }
      
      // Model-specific parameters
      if (validated.model === 'fal-ai/flux-pro') {
        if (validated.style_preset) {
          fal_input.style_name = validated.style_preset
        }
      } else if (validated.model === 'fal-ai/fast-sdxl') {
        if (validated.enable_safety_checker !== undefined) {
          fal_input.enable_safety_checker = validated.enable_safety_checker
        }
        if (validated.expand_prompt !== undefined) {
          fal_input.expand_prompt = validated.expand_prompt
        }
        if (validated.format !== undefined) {
          fal_input.format = validated.format
        }
      } else if (validated.model.includes('sdxl') || validated.model === 'fal-ai/lora') {
        if (validated.embeddings && validated.embeddings.length > 0) {
          fal_input.embeddings = validated.embeddings
        }
        if (validated.loras && validated.loras.length > 0) {
          fal_input.loras = validated.loras
        }
        if (validated.model === 'fal-ai/lora' && validated.model_name) {
          fal_input.model_name = validated.model_name
        }
      }
      
      // Submit to fal.ai
      let fal_result: any
      
      if (webhook_url) {
        // Use queue API for async processing
        fal_result = await fal.queue.submit(validated.model, {
          input: fal_input,
          webhookUrl: webhook_url
        })
        
        console.log('Image generation queued:', JSON.stringify(fal_result, null, 2))
      } else {
        // Use synchronous processing
        fal_result = await fal.subscribe(validated.model, {
          input: fal_input,
          logs: true,
          pollInterval: 5000,
          onQueueUpdate: (update) => {
            console.log(`Image generation ${update.status}:`, update.progress || 0, '%')
          }
        })
        
        console.log('Image generation result:', JSON.stringify(fal_result, null, 2))
      }
      
      // Check if we got a sync result with image
      const is_sync_result = !webhook_url && (
        (fal_result?.images && Array.isArray(fal_result.images)) ||
        fal_result?.image ||
        fal_result?.url
      )
      
      if (is_sync_result) {
        // Extract image URL
        let image_url: string | undefined
        
        if (fal_result.images && Array.isArray(fal_result.images) && fal_result.images.length > 0) {
          const first_image = fal_result.images[0]
          if (typeof first_image === 'string') {
            image_url = first_image
          } else if (first_image && typeof first_image === 'object') {
            // Check for url field
            if ('url' in first_image && first_image.url && typeof first_image.url === 'string' && first_image.url.trim() !== '') {
              image_url = first_image.url
            }
            // Check if there's a data field with base64 image
            else if ('data' in first_image && first_image.data && typeof first_image.data === 'string') {
              image_url = first_image.data
            }
            // Check if there's a base64 field
            else if ('base64' in first_image && first_image.base64 && typeof first_image.base64 === 'string') {
              const content_type = ('content_type' in first_image && first_image.content_type) || 'image/png'
              image_url = `data:${content_type};base64,${first_image.base64}`
            }
            else {
              // Log the structure for debugging
              console.error('Sync result - Image object has empty or missing URL:', first_image)
              console.error('Full fal_result:', JSON.stringify(fal_result, null, 2))
            }
          }
        } else if (fal_result.image && typeof fal_result.image === 'string') {
          image_url = fal_result.image
        } else if (fal_result.url && typeof fal_result.url === 'string') {
          image_url = fal_result.url
        } else if (fal_result.data && typeof fal_result.data === 'string') {
          // Check if the response has a data field at the top level
          image_url = fal_result.data
        }
        
        if (!image_url) {
          throw new Error('No image URL in result')
        }
        
        // Apply watermark for free users
        const is_free_user = job.metadata?.is_free_user || false
        const is_admin = job.metadata?.plan === 'admin'
        
        if (is_free_user && !is_admin) {
          try {
            const watermarked = await add_overlay_to_image_node(image_url)
            image_url = watermarked
          } catch (e) {
            console.error('Failed to apply watermark:', e)
          }
        }
        
        // Update job as completed
        await supabase
          .from('image_jobs')
          .update({
            status: 'completed',
            image_url,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
        
        // Return success
        return api_success({
          job_id: job.job_id,
          status: 'completed',
          message: 'Image generated successfully'
        })
      }
      
      // Handle async result - just need request_id
      if (!fal_result.request_id) {
        throw new Error('No request_id in async result')
      }
      
      // Update job with request ID
      await supabase
        .from('image_jobs')
        .update({
          fal_request_id: fal_result.request_id,
          status: 'processing'
        })
        .eq('id', job.id)
      
      // 12. Cache the job reference
      const cache_data = {
        job_id: job.job_id,
        status: 'processing',
        model: validated.model,
        mpUsed: total_cost,
        costPerImage: cost_per_image,
        totalCost: total_cost,
        imageCount: num_images,
        timestamp: new Date().toISOString()
      }
      
      if (redis) {
        // Cache for 1 hour
        await redis.setex(cache_key, 3600, cache_data)
      }
      
      // 13. Track submission
      track('image_generation_submitted', {
        user_id: user.user_id,
        model: validated.model,
        cost: total_cost,
        num_images,
        job_id: job.job_id
      })
      
      return api_success({
        job_id: job.job_id,
        status: 'processing',
        message: 'Image generation job submitted successfully'
      })
      
    } catch (fal_error) {
      // Update job as failed
      await supabase
        .from('image_jobs')
        .update({
          status: 'failed',
          error: fal_error instanceof Error ? fal_error.message : 'Failed to submit to fal.ai',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
      
      // Refund tokens (skip for admin users)
      if (subscription.plan !== 'admin') {
        await supabase.rpc('deduct_tokens', {
          p_user_id: user.user_id,
          p_amount: -total_cost, // negative for refund
          p_description: `Image generation refund: submission failed`
        })
      }
      
      console.error('Failed to submit to fal.ai:', fal_error)
      throw new Error('Failed to submit image generation job')
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}