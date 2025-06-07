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
    const user = await require_auth()
    
    // 2. Get job_id from query params
    const job_id = req.nextUrl.searchParams.get("job_id")
    if (!job_id) {
      return api_error("Missing job_id parameter", 400)
    }
    
    // 3. Look up job in database
    const supabase = get_service_role_client()
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id) // Use job_id field, not id
      .eq('user_id', user.user_id) // Ensure user owns this job
      .single()
    
    if (error || !job) {
      return api_error("Job not found", 404)
    }
    
    // 4. Return job status
    return api_success({
      job_id: job.job_id, // Return the string job_id
      status: job.status,
      audio_url: job.audio_url,
      error: job.error,
      progress: job.progress || 0,
      created_at: job.created_at,
      completed_at: job.completed_at,
      metadata: {
        ...job.metadata,
        total_text_length: job.text?.length || job.metadata?.total_text_length || 0,
        total_cost: job.cost || job.metadata?.total_cost || 0
      }
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}