import { NextRequest } from "next/server"
import { get_anon_client } from "@/lib/utils/database/supabase"
import { require_auth } from "@/lib/utils/api/auth"
import { 
  api_error, 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()

    // 2. Get job_id from query params
    const { searchParams } = new URL(req.url)
    const job_id = searchParams.get('job_id')
    
    if (!job_id) {
      return api_error('Missing job_id parameter', 400)
    }

    // 3. Get job from database
    const supabase = get_anon_client()

    // 4. Get job status (RLS ensures user can only see their own jobs)
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .single()

    if (error || !job) {
      return api_error('Job not found', 404)
    }

    // 5. Return job status
    return api_success({
      job_id: job.job_id,
      status: job.status,
      progress: job.progress || 0,
      audio_url: job.audio_url,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at,
      metadata: job.metadata
    })
  } catch (error) {
    return handle_api_error(error)
  }
}