import { NextRequest } from 'next/server'
import { 
  get_service_role_client 
} from '@/lib/utils/database/supabase'
import { 
  require_admin_access 
} from '@/lib/utils/api/admin'
import {
  api_success,
  api_error,
  handle_api_error
} from '@/lib/utils/api/response'
import { z } from 'zod'
import { validate_request } from '@/lib/utils/api/validation'

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const ban_user_schema = z.object({
  reason: z.string().min(1),
  job_id: z.string().optional()
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // 1. Require admin authentication
    await require_admin_access()
    
    const { user_id } = await params
    if (!user_id) {
      return api_error('User ID is required', 400)
    }
    
    // 2. Validate request body
    const body = await req.json()
    const validation = await validate_request(ban_user_schema, body)
    if (!validation.success) {
      return validation.error
    }
    const { reason, job_id } = validation.data
    
    // 3. Get database client
    const supabase = get_service_role_client()
    
    // 4. Check if user exists
    const { data: user, error: user_error } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('id', user_id)
      .single()
    
    if (user_error || !user) {
      return api_error('User not found', 404)
    }
    
    // 5. Update user metadata to mark as banned
    const { error: update_error } = await supabase
      .from('users')
      .update({
        metadata: {
          banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: reason,
          ban_job_id: job_id
        }
      })
      .eq('id', user_id)
    
    if (update_error) {
      console.error('Failed to update user metadata:', update_error)
      return api_error('Failed to ban user', 500)
    }
    
    // 6. Cancel all pending jobs for this user
    const job_tables = ['image_jobs', 'video_jobs', 'audio_jobs']
    
    for (const table of job_tables) {
      const { error: cancel_error } = await supabase
        .from(table)
        .update({
          status: 'failed',
          error: 'User banned for ToS violation',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .in('status', ['pending', 'processing'])
      
      if (cancel_error) {
        console.error(`Failed to cancel ${table} for user:`, cancel_error)
      }
    }
    
    // 7. Log the ban action
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: 'system', // You might want to get the actual admin ID from the auth
        action: 'user_banned',
        target_type: 'user',
        target_id: user_id,
        details: {
          reason,
          job_id,
          user_email: user.email,
          clerk_id: user.clerk_id
        }
      })
      .select()
      .single()
      .catch(err => console.error('Failed to log ban action:', err))
    
    return api_success({
      message: 'User banned successfully',
      user_id,
      jobs_cancelled: true
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}