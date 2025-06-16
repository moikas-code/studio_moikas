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
    
    const supabase = get_service_role_client()
    
    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('dmca_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: requests, error, count } = await query
    
    if (error) {
      throw error
    }
    
    // Get action history for each request
    const request_ids = requests?.map(r => r.id) || []
    const { data: actions } = await supabase
      .from('dmca_actions')
      .select('*')
      .in('dmca_request_id', request_ids)
      .order('created_at', { ascending: false })
    
    // Combine requests with their action history
    const requests_with_actions = requests?.map(request => ({
      ...request,
      actions: actions?.filter(a => a.dmca_request_id === request.id) || []
    })) || []
    
    return api_success({
      requests: requests_with_actions,
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    return handle_api_error(error)
  }
}