import { NextRequest, NextResponse } from "next/server"
import { invoke_xai_agent_with_tools } from "@/lib/ai-agents"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

// Next.js route configuration
export const dynamic = 'force-dynamic' // AI responses are always unique
export const runtime = 'nodejs' // Required for AI operations
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
  handle_api_error 
} from "@/lib/utils/api/response"
import { 
  enhance_prompt_schema, 
  validate_request 
} from "@/lib/utils/api/validation"
import { 
  enforce_rate_limit, 
  RATE_LIMITS
} from "@/lib/utils/api/rate_limiter"
import { sanitize_text } from "@/lib/utils/security/sanitization"

const ENHANCE_COST = 1 // 1 MP per enhancement

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()
    
    // 2. Validate request
    const body = await req.json()
    const validated = validate_request(enhance_prompt_schema, body)
    
    // 3. Sanitize input
    const prompt = sanitize_text(validated.prompt)
    
    // 4. Check token balance
    if (!await has_sufficient_tokens(user.user_id, ENHANCE_COST)) {
      return NextResponse.json({ error: 'Insufficient tokens for enhancement' }, { status: 402 })
    }
    
    // 5. Apply rate limiting
    const subscription = await get_user_subscription(user.user_id)
    const is_free = subscription.plan_name === 'free'
    
    await enforce_rate_limit(
      user.user_id,
      is_free ? RATE_LIMITS.api_general : {
        ...RATE_LIMITS.api_general,
        requests: 200 // Higher limit for paid users
      }
    )
    
    // 6. Deduct tokens - prioritize renewable tokens first, then permanent
    const supabase = get_service_role_client()
    const renewable_to_deduct = Math.min(ENHANCE_COST, subscription.renewable_tokens)
    const permanent_to_deduct = ENHANCE_COST - renewable_to_deduct

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
          tokens_used: ENHANCE_COST,
          description: `Prompt enhancement`
        })

      return { data: null, error: null }
    })
    
    try {
      // 7. Enhance prompt using AI
      const system_message = new SystemMessage(`You are a helpful assistant that enhances image generation prompts.
Your goal is to take a simple prompt and make it more detailed and descriptive 
while maintaining the original intent. Add artistic details, lighting, style, 
and composition suggestions.`)
      
      const result = await invoke_xai_agent_with_tools({
        system_message,
        prompt: new HumanMessage(`Enhance this prompt for image generation: "${prompt}"`)
      })
      const enhanced_prompt = result
      
      // 8. Return enhanced prompt
      return api_success({
        enhanced_prompt,
        original_prompt: prompt,
        tokens_used: ENHANCE_COST
      })
      
    } catch {
      // Refund on AI failure - add back the same way we deducted
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
            tokens_used: -ENHANCE_COST, // negative for refund
            description: `Prompt enhancement refund: enhancement failed`
          })

        return { data: null, error: null }
      })
      
      throw new Error('Enhancement failed. Tokens refunded.')
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}