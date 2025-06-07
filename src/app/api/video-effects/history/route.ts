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
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface VideoJob {
  id: string
  job_id: string
  created_at: string
  completed_at?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prompt: string
  model_id: string
  aspect: string
  duration: number
  video_url?: string
  error?: string
  fal_request_id?: string
  progress?: number
}

export async function GET() {
  try {
    // 1. Authenticate user
    const user = await require_auth()
    
    // 2. Get user's video jobs from last 7 days
    const supabase = get_service_role_client()
    const seven_days_ago = new Date()
    seven_days_ago.setDate(seven_days_ago.getDate() - 7)
    
    const { data: jobs, error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('user_id', user.user_id)
      .gte('created_at', seven_days_ago.toISOString())
      .order('created_at', { ascending: false })
      .limit(50) // Reasonable limit
    
    if (error) {
      console.error('Failed to fetch video jobs:', error)
      return api_error('Failed to fetch video history', 500)
    }
    
    // 3. Format jobs for response
    const formatted_jobs: VideoJob[] = (jobs || []).map(job => ({
      id: job.id,
      job_id: job.job_id,
      created_at: job.created_at,
      completed_at: job.completed_at,
      status: job.status,
      prompt: job.prompt,
      model_id: job.model_id,
      aspect: job.aspect,
      duration: job.duration,
      video_url: job.video_url,
      error: job.error,
      fal_request_id: job.fal_request_id,
      progress: job.progress
    }))
    
    return api_success({
      jobs: formatted_jobs,
      count: formatted_jobs.length
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}