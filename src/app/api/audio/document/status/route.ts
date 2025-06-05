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

    // 4. Get parent job
    const { data: parent_job, error: parent_error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.id)
      .eq('type', 'document')
      .single()

    if (parent_error || !parent_job) {
      return api_error('Document job not found', 404)
    }

    // 5. Get chunk jobs if they exist
    const chunk_job_ids = parent_job.metadata?.chunk_jobs?.map((c: any) => c.job_id) || []
    let chunks_data: any[] = []
    
    if (chunk_job_ids.length > 0) {
      const { data: chunks } = await supabase
        .from('audio_jobs')
        .select('job_id, status, audio_url, progress, metadata')
        .in('job_id', chunk_job_ids)
        .eq('user_id', user.id)
        .order('metadata->chunk_index')

      chunks_data = chunks || []
    }

    // 6. Calculate overall progress and status
    let overall_status = parent_job.status
    let overall_progress = 0
    const chunk_statuses = chunks_data.map(chunk => ({
      chunk_index: chunk.metadata?.chunk_index || 0,
      status: chunk.status,
      audio_url: chunk.audio_url,
      progress: chunk.progress || 0
    }))

    if (chunks_data.length > 0) {
      const completed_chunks = chunks_data.filter(c => c.status === 'completed').length
      const failed_chunks = chunks_data.filter(c => c.status === 'failed').length
      
      overall_progress = Math.round((completed_chunks / chunks_data.length) * 100)
      
      // Update overall status based on chunks
      if (failed_chunks > 0) {
        overall_status = 'failed'
      } else if (completed_chunks === chunks_data.length) {
        overall_status = 'completed'
      } else if (chunks_data.some(c => c.status === 'processing')) {
        overall_status = 'processing'
      }
    }

    // 7. Return aggregated status
    return api_success({
      job_id: parent_job.job_id,
      status: overall_status,
      progress: overall_progress,
      total_chunks: parent_job.metadata?.total_chunks || 0,
      chunks: chunk_statuses,
      error: parent_job.error,
      created_at: parent_job.created_at,
      completed_at: parent_job.completed_at,
      metadata: {
        plan: parent_job.metadata?.plan,
        total_text_length: parent_job.metadata?.total_text_length
      }
    })
  } catch (error) {
    return handle_api_error(error)
  }
}