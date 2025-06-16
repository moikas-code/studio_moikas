import { NextRequest } from "next/server"
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

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const admin_response = await require_admin_access()
    if (admin_response) return admin_response
    
    // Get query parameters for date range
    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const supabase = get_service_role_client()
    
    // Call the database function to get moderation stats
    const { data, error } = await supabase.rpc('get_moderation_stats', {
      start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString()
    })
    
    if (error) {
      throw error
    }
    
    return api_success(data)
  } catch (error) {
    return handle_api_error(error)
  }
}