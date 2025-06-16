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
import { currentUser } from "@clerk/nextjs/server"

const review_schema = z.object({
  action: z.enum(['accept', 'reject']),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().min(1).optional()
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin_response = await require_admin_access()
    if (admin_response) return admin_response
    
    const user = await currentUser()
    if (!user) {
      return handle_api_error(new Error("Unauthorized"), "UNAUTHORIZED", 401)
    }
    
    // Validate request body
    const body = await req.json()
    const validated = validate_request(review_schema, body)
    
    // Validate rejection reason is provided when rejecting
    if (validated.action === 'reject' && !validated.rejection_reason) {
      return handle_api_error(
        new Error("Rejection reason is required"),
        "VALIDATION_ERROR",
        400
      )
    }
    
    const supabase = get_service_role_client()
    
    // Get the DMCA request
    const { data: request, error: request_error } = await supabase
      .from('dmca_requests')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (request_error || !request) {
      return handle_api_error(
        new Error("DMCA request not found"),
        "NOT_FOUND",
        404
      )
    }
    
    // Check if already processed
    if (request.status !== 'pending' && request.status !== 'reviewing') {
      return handle_api_error(
        new Error("DMCA request has already been processed"),
        "ALREADY_PROCESSED",
        409
      )
    }
    
    // Update the request based on action
    const update_data: Record<string, unknown> = {
      status: validated.action === 'accept' ? 'accepted' : 'rejected',
      admin_notes: validated.admin_notes,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (validated.action === 'reject') {
      update_data.rejection_reason = validated.rejection_reason
    }
    
    const { error: update_error } = await supabase
      .from('dmca_requests')
      .update(update_data)
      .eq('id', params.id)
    
    if (update_error) {
      throw update_error
    }
    
    // Log the action
    await supabase.rpc('log_dmca_action', {
      request_id: params.id,
      action_type: validated.action === 'accept' ? 'takedown_processed' : 'request_rejected',
      performed_by_user: user.emailAddresses[0]?.emailAddress || user.id,
      action_details: {
        admin_notes: validated.admin_notes,
        rejection_reason: validated.rejection_reason
      }
    })
    
    // If accepted, handle the takedown
    if (validated.action === 'accept') {
      // In a real implementation, you would:
      // 1. Remove or disable the infringing content
      // 2. Notify the user whose content was removed
      // 3. Log the content removal
      console.log(`Processing takedown for: ${request.infringing_content_url}`)
    }
    
    return api_success({
      message: `DMCA request ${validated.action}ed successfully`,
      request_id: params.id,
      action: validated.action
    })
  } catch (error) {
    return handle_api_error(error)
  }
}