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
    
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const filter = searchParams.get('filter') // 'all', 'blocked', 'false_positives'
    
    const supabase = get_service_role_client()
    
    let query = supabase
      .from('moderation_logs')
      .select(`
        *,
        user:users(
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (filter === 'blocked') {
      query = query.eq('safe', false)
    } else if (filter === 'false_positives') {
      query = query.eq('false_positive_reported', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return api_success(data)
  } catch (error) {
    return handle_api_error(error)
  }
}