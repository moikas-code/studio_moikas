import { NextRequest } from "next/server"
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
  api_error, 
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
    const user = await require_auth(req)
    
    // 2. Validate request
    const body = await req.json()
    const validated = validate_request(enhance_prompt_schema, body)
    
    // 3. Sanitize input
    const prompt = sanitize_text(validated.prompt)
    
    // 4. Check token balance
    if (!await has_sufficient_tokens(user.user_id, ENHANCE_COST)) {
      return api_error('Insufficient tokens for enhancement', 402)
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
    
    // 6. Deduct tokens
    const supabase = get_service_role_client()
    await execute_db_operation(() =>
      supabase.rpc('deduct_tokens', {
        p_user_id: user.user_id,
        p_amount: ENHANCE_COST
      })
    )
    
    try {
      // 7. Enhance prompt using AI
      const messages = [
        new SystemMessage(`You are a helpful assistant that enhances image generation prompts.
Your goal is to take a simple prompt and make it more detailed and descriptive 
while maintaining the original intent. Add artistic details, lighting, style, 
and composition suggestions.`),
        new HumanMessage(`Enhance this prompt for image generation: "${prompt}"`)
      ]
      
      const result = await invoke_xai_agent_with_tools(messages)
      const enhanced_prompt = result.output
      
      // 8. Return enhanced prompt
      return api_success({
        enhanced_prompt,
        original_prompt: prompt,
        tokens_used: ENHANCE_COST
      })
      
    } catch (ai_error) {
      // Refund on AI failure
      await execute_db_operation(() =>
        supabase.rpc('refund_tokens', {
          p_user_id: user.user_id,
          p_amount: ENHANCE_COST
        })
      )
      
      throw new Error('Enhancement failed. Tokens refunded.')
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}