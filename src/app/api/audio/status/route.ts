import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { get_supabase_client } from "@/lib/utils/database/supabase"
import { 
  api_error, 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerk_id } = await auth()
    if (!clerk_id) {
      return api_error('Unauthorized', 401)
    }

    // 2. Get job_id from query params
    const { searchParams } = new URL(req.url)
    const job_id = searchParams.get('job_id')
    
    if (!job_id) {
      return api_error('Missing job_id parameter', 400)
    }

    // 3. Get user ID
    const supabase = get_supabase_client()
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerk_id)
      .single()

    if (!user) {
      return api_error('User not found', 404)
    }

    // 4. Get job status (RLS ensures user can only see their own jobs)
    const { data: job, error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.id)
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