import { NextRequest } from "next/server"
import { 
  get_service_role_client 
} from "@/lib/utils/database/supabase"
import { 
  require_auth 
} from "@/lib/utils/api/auth"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"

// Next.js route configuration
export const dynamic = 'force-dynamic' // Job status is always fresh
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth(req)
    
    // 2. Get job_id from query params
    const job_id = req.nextUrl.searchParams.get("job_id")
    if (!job_id) {
      return api_error("Missing job_id parameter", 400)
    }
    
    // 3. Look up job in database
    const supabase = get_service_role_client()
    const { data: job, error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('id', job_id)
      .eq('user_id', user.user_id) // Ensure user owns this job
      .single()
    
    if (error || !job) {
      return api_error("Job not found", 404)
    }
    
    // 4. Return job status
    return api_success({
      job_id: job.id,
      status: job.status,
      video_url: job.video_url,
      error: job.error,
      progress: job.progress || 0,
      created_at: job.created_at,
      completed_at: job.completed_at
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}