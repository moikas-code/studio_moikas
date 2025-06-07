import { NextRequest } from "next/server"
import { get_service_role_client } from "@/lib/utils/database/supabase"
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

    // 2. Get optional parameters from query
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const days = parseInt(searchParams.get('days') || '7')
    
    // 3. Calculate date range
    const end_date = new Date()
    const start_date = new Date()
    start_date.setDate(start_date.getDate() - days)

    // 4. Get jobs from database
    const supabase = get_service_role_client()
    
    const { data: jobs, error } = await supabase
      .from('audio_jobs')
      .select('job_id, type, status, text, created_at, completed_at, audio_url, metadata')
      .eq('user_id', user.user_id)
      .gte('created_at', start_date.toISOString())
      .lte('created_at', end_date.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent audio jobs:', error)
      return api_error('Failed to fetch recent jobs', 500)
    }

    // 5. Format the response
    const formatted_jobs = jobs.map(job => {
      // Determine if it's a document job
      const is_document = job.type === 'document' || job.job_id.startsWith('audio_doc_')
      
      // Get text preview - for document jobs, use metadata
      let text_preview = ''
      let character_count = 0
      let chunk_count = 1
      
      if (is_document && job.metadata) {
        character_count = job.metadata.total_text_length || 0
        chunk_count = job.metadata.total_chunks || 1
        text_preview = job.text || 'Document audio'
      } else {
        text_preview = job.text || ''
        character_count = text_preview.length
      }
      
      return {
        job_id: job.job_id,
        type: is_document ? 'document' : 'audio',
        status: job.status,
        text_preview: text_preview.substring(0, 200),
        character_count,
        chunk_count,
        created_at: job.created_at,
        completed_at: job.completed_at,
        has_audio: !!job.audio_url || job.status === 'completed'
      }
    })

    return api_success({
      jobs: formatted_jobs,
      count: formatted_jobs.length,
      days_included: days
    })
  } catch (error) {
    return handle_api_error(error)
  }
}