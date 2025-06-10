import { NextRequest, NextResponse } from "next/server"
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
import { generate_video } from "@/lib/fal_client"
import { calculate_final_cost } from "@/lib/pricing_config"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // Video processing can take more time

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
  console.log('Video effects API called');
  
  try {
    // 1. Authenticate user
    const user = await require_auth()
    console.log('User authenticated:', user.user_id)
    
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
    
    // Convert dollar cost to MP (1 MP = $0.001) with plan-based markup
    // For video, multiply by duration in seconds
    const base_cost_per_second = model_config.custom_cost / 0.001
    const base_total_cost = base_cost_per_second * validated.duration
    const cost = calculate_final_cost(base_total_cost, subscription.plan_name)
    
    // 7. Check token balance
    if (!await has_sufficient_tokens(user.user_id, cost)) {
      return api_error('Insufficient tokens for video generation', 402)
    }
    
    // 8. Create job record
    const supabase = get_service_role_client()
    
    // Generate a unique job_id for external tracking
    const job_id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
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
        image_url: validated.image_url || null,
        cost: cost // Add the cost field
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
        operation_type: 'video_generation',
        description: `Video generation: ${validated.model}`,
        metadata: {
          model: validated.model,
          duration: validated.duration,
          aspect_ratio: validated.aspect_ratio
        }
      })
    
    // 10. Trigger actual video generation
    try {
      // Construct webhook URL for this job
      // Try multiple environment variables for the base URL
      const base_url = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL 
          ? process.env.NEXT_PUBLIC_APP_URL
          : process.env.NEXTAUTH_URL
            ? process.env.NEXTAUTH_URL
            : process.env.URL
              ? process.env.URL
              : null
      
      const webhook_url = base_url ? `${base_url}/api/webhooks/fal-ai` : null
      
      console.log('Webhook URL configuration:', {
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        URL: process.env.URL,
        webhook_url,
        using_webhook: !!webhook_url
      })
      
      if (!webhook_url) {
        console.warn('No webhook URL configured. Video generation will use synchronous processing.')
        console.warn('Set one of these environment variables: VERCEL_URL, NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, or URL')
      }
      
      // Call fal.ai to generate video
      const fal_result = await generate_video(
        validated.model,
        {
          prompt,
          negative_prompt: validated.negative_prompt,
          duration: validated.duration,
          aspect_ratio: validated.aspect_ratio,
          image_url: validated.image_url
        },
        webhook_url ? { webhook_url } : undefined
      )
      
      // Update job with fal.ai request ID (check multiple possible ID field names)
      const is_queue_result = 'request_id' in fal_result || 'id' in fal_result || 'requestId' in fal_result
      const is_sync_result = 'video_url' in fal_result || 'url' in fal_result
      
      if (is_queue_result) {
        const queue_result = fal_result as Record<string, unknown>
        const fal_id = queue_result.request_id || queue_result.id || queue_result.requestId
        await supabase
          .from('video_jobs')
          .update({ 
            fal_request_id: String(fal_id),
            status: 'processing',
            progress: 5
          })
          .eq('id', job.id)
      } else if (is_sync_result) {
        // If synchronous response (no webhook), update immediately
        console.log('Received synchronous result from fal.ai')
        const sync_result = fal_result as Record<string, unknown>
        const video_url = sync_result.video_url || sync_result.url || sync_result.video
        
        if (!video_url) {
          console.error('No video URL in sync result:', sync_result)
          throw new Error('No video URL in synchronous result')
        }
        
        await supabase
          .from('video_jobs')
          .update({ 
            status: 'completed',
            video_url: String(video_url),
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)
      } else {
        // Unknown result format
        console.error('Unknown fal.ai result format:', fal_result)
        throw new Error('Unknown video generation result format')
      }
    } catch (generation_error) {
      console.error('Failed to start video generation:', generation_error)
      console.error('Full error details:', JSON.stringify(generation_error, null, 2))
      
      // Update job as failed
      await supabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          error: generation_error instanceof Error ? generation_error.message : 'Failed to start generation'
        })
        .eq('id', job.id)
      
      // Refund tokens on failure
      const { error: refund_error } = await supabase
        .from('subscriptions')
        .update({
          renewable_tokens: subscription.renewable_tokens + renewable_to_deduct,
          permanent_tokens: subscription.permanent_tokens + permanent_to_deduct
        })
        .eq('user_id', user.user_id)
      
      if (refund_error) {
        console.error('Failed to refund tokens:', refund_error)
      }
      
      throw generation_error
    }
    
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
    // If error is already a NextResponse (from require_auth), return it directly
    if (error instanceof Response || (error && typeof error === 'object' && 'headers' in error)) {
      return error as NextResponse
    }
    return handle_api_error(error)
  }
}