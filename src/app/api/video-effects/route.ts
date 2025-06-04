import { NextRequest } from "next/server"
import { 
  get_service_role_client, 
  execute_db_operation 
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

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Video processing can take time

// Validation schema
const video_effects_schema = z.object({
  prompt: z.string().min(1).max(1000),
  model: z.string(),
  aspect_ratio: z.enum(['16:9', '1:1', '9:16']),
  duration: z.number().int().min(1).max(10),
  image_url: z.string().url().optional()
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
    
    // 6. Calculate cost (example: 10 MP per second)
    const cost = validated.duration * 10
    
    // 7. Check token balance
    if (!await has_sufficient_tokens(user.user_id, cost)) {
      return api_error('Insufficient tokens for video generation', 402)
    }
    
    // 8. Create job record
    const supabase = get_service_role_client()
    const { data: job, error: job_error } = await supabase
      .from('video_jobs')
      .insert({
        user_id: user.user_id,
        prompt,
        model: validated.model,
        aspect_ratio: validated.aspect_ratio,
        duration: validated.duration,
        status: 'pending',
        cost,
        image_url: validated.image_url
      })
      .select()
      .single()
    
    if (job_error || !job) {
      throw new Error('Failed to create job')
    }
    
    // 9. Deduct tokens
    await execute_db_operation(() =>
      supabase.rpc('deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: cost
      })
    )
    
    // 10. TODO: Trigger actual video generation
    // This would typically call your video generation service
    // For now, we'll just return the job ID
    
    // 11. Track event
    track('video_generation_started', {
      user_id: user.user_id,
      model: validated.model,
      duration: validated.duration,
      cost
    })
    
    // 12. Return job info
    return api_success({
      job_id: job.id,
      status: 'processing',
      estimated_time: validated.duration * 10, // seconds
      cost
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}