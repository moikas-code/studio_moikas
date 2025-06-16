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
import { 
  validate_request
} from "@/lib/utils/api/validation"
import { z } from 'zod'

const review_schema = z.object({
  notes: z.string().min(1).max(1000)
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const resolvedParams = await params
    
    // Require admin authentication
    const admin_response = await require_admin_access()
    if (admin_response) return admin_response
    
    // Validate request body
    const body = await req.json()
    const validated = validate_request(review_schema, body)
    
    const supabase = get_service_role_client()
    
    // Update the moderation log entry
    const { error } = await supabase
      .from('moderation_logs')
      .update({
        false_positive_reviewed: true,
        false_positive_notes: validated.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('false_positive_reported', true)
    
    if (error) {
      throw error
    }
    
    return api_success({ message: 'False positive reviewed successfully' })
  } catch (error) {
    return handle_api_error(error)
  }
}