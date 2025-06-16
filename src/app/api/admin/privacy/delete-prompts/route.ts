// import { NextRequest } from "next/server"
import { 
  require_admin_access
} from "@/lib/utils/api/admin"
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"

export async function POST() {
  try {
    // Require admin authentication
    const admin_response = await require_admin_access()
    if (admin_response) return admin_response
    
    const supabase = get_service_role_client()
    
    // Execute the prompt deletion function
    const { error } = await supabase
      .rpc('delete_old_prompts')
    
    if (error) {
      throw error
    }
    
    // Get the latest deletion log
    const { data: log_data } = await supabase
      .from('system_logs')
      .select('details, created_at')
      .eq('action', 'prompt_deletion')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return api_success({
      message: 'Prompt deletion completed successfully',
      details: log_data?.details || {},
      executed_at: new Date().toISOString()
    })
  } catch (error) {
    return handle_api_error(error)
  }
}