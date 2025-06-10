import { NextRequest } from "next/server"
import { workflow_xai_agent } from "@/lib/ai-agents"
import { HumanMessage, AIMessage } from "@langchain/core/messages"

// Next.js route configuration
export const dynamic = 'force-dynamic' // Workflow execution is always dynamic
export const runtime = 'nodejs' // Required for AI and database operations
export const maxDuration = 60 // Allow up to 60 seconds for complex workflows
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import type { SupabaseClient } from '@supabase/supabase-js'
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
  memu_workflow_schema, 
  validate_request 
} from "@/lib/utils/api/validation"
import { 
  enforce_rate_limit, 
  RATE_LIMITS
} from "@/lib/utils/api/rate_limiter"
import { sanitize_text } from "@/lib/utils/security/sanitization"
import { track } from "@vercel/analytics/server"

// Token cost calculation (per 3000 tokens)
const TOKENS_PER_MP = 3000
const MIN_COST = 1

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json()
    
    // 2. Handle dev mode bypass
    if (body.dev_mode === "test") {
      return handle_dev_mode(body.message)
    }
    
    // 3. Authenticate user
    const user = await require_auth()
    
    // 4. Validate request
    const validated = validate_request(memu_workflow_schema, body)
    
    // 5. Sanitize message content
    const sanitized_messages = validated.messages.map(msg => ({
      ...msg,
      content: sanitize_text(msg.content)
    }))
    
    // 6. Get user subscription
    const subscription = await get_user_subscription(user.user_id)
    const is_free = subscription.plan_name === 'free'
    
    // 7. Apply rate limiting
    await enforce_rate_limit(
      user.user_id,
      is_free ? RATE_LIMITS.api_general : {
        ...RATE_LIMITS.api_general,
        requests: 300 // Higher for paid users
      }
    )
    
    // 8. Get or create session
    const supabase = get_service_role_client()
    const session_data = await get_or_create_session(
      supabase,
      user.user_id,
      validated.session_id,
      validated.workflow_id
    )
    
    // 9. Get workflow and settings
    const workflow = await get_workflow(supabase, validated.workflow_id)
    const settings = await get_user_settings(supabase, user.user_id)
    
    // 10. Convert messages to LangChain format
    const langchain_messages = sanitized_messages.map(msg => 
      msg.role === 'user' 
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    )
    
    // 11. Execute workflow
    const agent = new workflow_xai_agent({
      temperature: settings.temperature || 0.7,
      maxTokens: settings.max_tokens || 2048,
    })
    
    const result = await agent.execute_workflow(
      langchain_messages,
      workflow.graph_data || "",
      session_data.id,
      user.user_id,
      []
    )
    
    // 12. Calculate token cost
    const estimated_tokens = estimate_tokens(result.response)
    const token_cost = Math.max(
      MIN_COST,
      Math.ceil(estimated_tokens / TOKENS_PER_MP)
    )
    
    // 13. Deduct tokens - prioritize renewable tokens first, then permanent
    const renewable_to_deduct = Math.min(token_cost, subscription.renewable_tokens)
    const permanent_to_deduct = token_cost - renewable_to_deduct

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
        tokens_used: token_cost,
        operation_type: 'memu_chat',
        description: `MEMU workflow execution`,
        metadata: {
          workflow_id: validated.workflow_id,
          session_id: session_data.id
        }
      })
    
    // 14. Save message to history
    await save_message(
      supabase,
      session_data.id,
      result.response,
      'assistant',
      token_cost
    )
    
    // 15. Track usage
    track('memu_workflow_executed', {
      user_id: user.user_id,
      workflow_id: validated.workflow_id,
      tokens_used: token_cost,
      is_premium: !is_free
    })
    
    // 16. Return response
    return api_success({
      output: result.response,
      session_id: session_data.id,
      tokens_used: token_cost,
      remaining_tokens: subscription.renewable_tokens + 
                       subscription.permanent_tokens - token_cost
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}

// Helper functions

async function handle_dev_mode(message: string) {
  try {
    const agent = new workflow_xai_agent({
      temperature: 0.7,
      maxTokens: 2048,
    })
    
    const result = await agent.execute_workflow(
      [new HumanMessage(message || "Hello, this is a test!")],
      "",
      "test-session",
      "test-user",
      []
    )
    
    return api_success({
      output: result.response,
      session_id: "test-session",
      tokens_used: 0,
      dev_mode: true
    })
  } catch {
    return api_error('Dev mode test failed', 500)
  }
}

async function get_or_create_session(
  supabase: SupabaseClient,
  user_id: string,
  session_id?: string,
  workflow_id?: string
) {
  if (session_id) {
    const { data } = await supabase
      .from('memu_chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user_id)
      .single()
    
    if (data) return data
  }
  
  // Create new session
  const { data } = await supabase
    .from('memu_chat_sessions')
    .insert({
      user_id,
      workflow_id: workflow_id || null,
      title: 'New Chat'
    })
    .select()
    .single()
  
  return data
}

async function get_workflow(supabase: SupabaseClient, workflow_id?: string) {
  if (!workflow_id) {
    return { graph_data: null }
  }
  
  const { data } = await supabase
    .from('memu_workflows')
    .select('*')
    .eq('id', workflow_id)
    .single()
  
  return data || { graph_data: null }
}

async function get_user_settings(supabase: SupabaseClient, user_id: string) {
  const { data } = await supabase
    .from('memu_user_chat_defaults')
    .select('*')
    .eq('user_id', user_id)
    .single()
  
  return data || {}
}

async function save_message(
  supabase: SupabaseClient,
  session_id: string,
  content: string,
  role: 'user' | 'assistant',
  tokens_used: number
) {
  await supabase
    .from('memu_chat_messages')
    .insert({
      session_id,
      content,
      role,
      tokens_used
    })
}

function estimate_tokens(text: string): number {
  // Simple estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}