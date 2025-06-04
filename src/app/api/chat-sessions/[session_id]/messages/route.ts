import { NextRequest } from "next/server"
import { 
  get_service_role_client 
} from "@/lib/utils/database/supabase"
import { 
  require_auth 
} from "@/lib/utils/api/auth"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { z } from "zod"
import { validate_request } from "@/lib/utils/api/validation"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Type for dynamic params (Next.js 15 pattern)
type Params = {
  session_id: string
}

// GET messages for a session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    // 1. Get dynamic params (Next.js 15 requires await)
    const { session_id } = await params
    
    // 2. Authenticate user
    const user = await require_auth(req)
    
    // 3. Get pagination params
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50")
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0")
    
    // 4. Verify user owns session
    const supabase = get_service_role_client()
    const { data: session, error: session_error } = await supabase
      .from('memu_chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.user_id)
      .single()
    
    if (session_error || !session) {
      return api_error("Session not found", 404)
    }
    
    // 5. Get messages
    const { data: messages, error, count } = await supabase
      .from('memu_chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (error) {
      throw error
    }
    
    // 6. Return paginated response
    return api_success({
      messages: messages || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}

// POST new message to session
const message_schema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'assistant'])
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    // 1. Get dynamic params
    const { session_id } = await params
    
    // 2. Authenticate user
    const user = await require_auth(req)
    
    // 3. Validate request body
    const body = await req.json()
    const validated = validate_request(message_schema, body)
    
    // 4. Verify user owns session
    const supabase = get_service_role_client()
    const { data: session } = await supabase
      .from('memu_chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', user.user_id)
      .single()
    
    if (!session) {
      return api_error("Session not found", 404)
    }
    
    // 5. Create message
    const { data: message, error } = await supabase
      .from('memu_chat_messages')
      .insert({
        session_id,
        content: validated.content,
        role: validated.role,
        tokens_used: 0 // Would be calculated based on content
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // 6. Return created message
    return api_success(message, "Message created", 201)
    
  } catch (error) {
    return handle_api_error(error)
  }
}