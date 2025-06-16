import { NextRequest } from "next/server"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  require_admin_access
} from "@/lib/utils/api/admin"
import { 
  api_success, 
  api_error,
  handle_api_error 
} from "@/lib/utils/api/response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    await require_admin_access()
    
    const { id: job_id } = await params
    if (!job_id) {
      return api_error('Job ID is required', 400)
    }
    
    // 2. Get the job from any of the job tables
    const supabase = get_service_role_client()
    
    // Try each job table
    let job = null
    let job_type = null
    
    // Check image_jobs
    const { data: image_job } = await supabase
      .from('image_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (image_job) {
      job = image_job
      job_type = 'image'
    } else {
      // Check video_jobs
      const { data: video_job } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', job_id)
        .single()
      
      if (video_job) {
        job = video_job
        job_type = 'video'
      } else {
        // Check audio_jobs
        const { data: audio_job } = await supabase
          .from('audio_jobs')
          .select('*')
          .eq('id', job_id)
          .single()
        
        if (audio_job) {
          job = audio_job
          job_type = 'audio'
        }
      }
    }
    
    if (!job || !job_type) {
      return api_error('Job not found', 404)
    }
    
    // 3. Check if job can be cancelled (only pending or processing jobs)
    if (job.status !== 'pending' && job.status !== 'processing') {
      return api_error('Only pending or processing jobs can be cancelled', 400)
    }
    
    // 4. Update job status to failed with cancellation reason
    const { error: update_error } = await supabase
      .from(`${job_type}_jobs`)
      .update({
        status: 'failed',
        error: 'Cancelled by admin',
        completed_at: new Date().toISOString(),
        metadata: {
          ...(job.metadata || {}),
          cancelled_by: 'admin',
          cancelled_at: new Date().toISOString()
        }
      })
      .eq('id', job_id)
    
    if (update_error) {
      console.error('Failed to cancel job:', update_error)
      return api_error('Failed to cancel job', 500)
    }
    
    // 5. Refund tokens if job had a cost
    if (job.user_id && job.cost > 0) {
      await supabase.rpc('deduct_tokens', {
        p_user_id: job.user_id,
        p_amount: -job.cost, // negative for refund
        p_description: `${job_type.charAt(0).toUpperCase() + job_type.slice(1)} generation cancelled by admin`
      })
    }
    
    return api_success({
      message: 'Job cancelled successfully',
      job_id: job.job_id,
      refunded: job.cost > 0 ? job.cost : 0
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}