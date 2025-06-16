import { NextRequest } from "next/server"
import { 
  handle_api_error,
  api_success
} from "@/lib/utils/api/response"
import {
  validate_request
} from "@/lib/utils/api/validation"
import {
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { get_redis_client } from "@/lib/utils/database/redis"
import { z } from 'zod'

const dmca_submission_schema = z.object({
  complainant_name: z.string().min(1).max(200),
  complainant_email: z.string().email(),
  complainant_address: z.string().optional(),
  complainant_phone: z.string().optional(),
  copyrighted_work: z.string().min(10).max(5000),
  original_work_url: z.string().url().optional().or(z.literal("")),
  infringing_content_url: z.string().url().refine(
    (url) => url.includes('studiomoikas.com') || url.includes('localhost'),
    "URL must be from Studio Moikas"
  ),
  infringing_content_description: z.string().optional(),
  good_faith_statement: z.literal(true),
  accuracy_statement: z.literal(true),
  signature: z.string().min(1).max(200)
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - max 5 DMCA requests per email per day
    const body = await req.json()
    const validated = validate_request(dmca_submission_schema, body)
    
    const redis = get_redis_client()
    const rate_limit_key = `dmca:${validated.complainant_email}:${new Date().toISOString().split('T')[0]}`
    
    const current_count = await redis.incr(rate_limit_key)
    if (current_count === 1) {
      await redis.expire(rate_limit_key, 86400) // 24 hours
    }
    
    if (current_count > 5) {
      return handle_api_error(
        new Error("Too many DMCA requests. Please try again tomorrow."),
        "RATE_LIMIT_EXCEEDED",
        429
      )
    }
    
    const supabase = get_service_role_client()
    
    // Extract potential user ID from the infringing content URL if possible
    // This is a simplified example - in production you'd parse the URL more carefully
    let reported_user_id = null
    const url_parts = validated.infringing_content_url.split('/')
    // You could extract user ID from URL pattern like /user/[id]/content/[content_id]
    
    // Insert DMCA request
    const { data, error } = await supabase
      .from('dmca_requests')
      .insert({
        complainant_name: validated.complainant_name,
        complainant_email: validated.complainant_email,
        complainant_address: validated.complainant_address || null,
        complainant_phone: validated.complainant_phone || null,
        copyrighted_work: validated.copyrighted_work,
        original_work_url: validated.original_work_url || null,
        infringing_content_url: validated.infringing_content_url,
        infringing_content_description: validated.infringing_content_description || null,
        reported_user_id,
        good_faith_statement: validated.good_faith_statement,
        accuracy_statement: validated.accuracy_statement,
        signature: validated.signature,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // Log the submission
    await supabase.rpc('log_dmca_action', {
      request_id: data.id,
      action_type: 'submitted',
      performed_by_user: validated.complainant_email,
      action_details: {
        infringing_url: validated.infringing_content_url
      }
    })
    
    // In production, you would:
    // 1. Send confirmation email to complainant
    // 2. Notify admins of new DMCA request
    // 3. Potentially auto-disable the reported content pending review
    
    return api_success({
      message: "DMCA takedown request submitted successfully",
      request_id: data.id,
      status: "pending_review",
      expected_review_time: "48 hours"
    })
  } catch (error) {
    return handle_api_error(error)
  }
}