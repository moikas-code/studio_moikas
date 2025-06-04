import { createClient } from "@supabase/supabase-js"
import type { DatabaseRecord } from "./workflow_agent_types"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Save conversation message to database
 */
export async function save_conversation_to_database(
  record: DatabaseRecord
): Promise<void> {
  const { error } = await supabase
    .from('memu_chat_messages')
    .insert({
      session_id: record.session_id,
      content: record.message,
      role: record.role,
      tokens_used: record.tokens_used || 0,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Failed to save message:', error)
  }
}

/**
 * Create workflow execution record
 */
export async function create_execution_record(
  workflow_id: string,
  user_id: string,
  status: string = 'started'
): Promise<string | null> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id,
      user_id,
      status,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Failed to create execution record:', error)
    return null
  }
  
  return data?.id || null
}