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
  handle_api_error 
} from "@/lib/utils/api/response"

interface JobRecord {
  id: string
  job_id: string
  user_id: string
  status: string
  model: string
  cost: number
  created_at: string
  completed_at?: string
  error?: string
  progress: number
  metadata?: Record<string, unknown>
  prompt?: string
  image_url?: string
  video_url?: string
  audio_url?: string
  image_size?: string
  aspect_ratio?: string
  type?: string
}

export async function GET(req: NextRequest) {
  try {
    // 1. Require admin authentication
    await require_admin_access()
    
    // 2. Get query parameters
    const search_params = req.nextUrl.searchParams
    const limit = parseInt(search_params.get('limit') || '50')
    const offset = parseInt(search_params.get('offset') || '0')
    const type = search_params.get('type') // image, video, audio, or all
    const status = search_params.get('status') // pending, processing, completed, failed, or all
    const search = search_params.get('search') // search query
    
    // 3. Build queries for each job type
    const supabase = get_service_role_client()
    
    // Helper function to build query with filters
    const build_query = (table: string, job_type: string) => {
      let query = supabase
        .from(table)
        .select('*, users!inner(email, metadata)', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      
      if (search) {
        // Search in job_id, user email, or prompt (if applicable)
        query = query.or(`job_id.ilike.%${search}%,users.email.ilike.%${search}%${job_type !== 'audio' ? `,prompt.ilike.%${search}%` : ''}`)
      }
      
      return query
    }
    
    // 4. Fetch jobs based on type filter
    const all_jobs: JobRecord[] = []
    let total_count = 0
    
    if (!type || type === 'all' || type === 'image') {
      const image_query = build_query('image_jobs', 'image')
      const { data: image_jobs, count: image_count } = await image_query
      
      if (image_jobs) {
        all_jobs.push(...image_jobs.map((job) => ({
          ...job,
          type: 'image' as const,
          user_email: job.users?.email,
          user_banned: job.users?.metadata?.banned || false
        })))
        total_count += image_count || 0
      }
    }
    
    if (!type || type === 'all' || type === 'video') {
      const video_query = build_query('video_jobs', 'video')
      const { data: video_jobs, count: video_count } = await video_query
      
      if (video_jobs) {
        all_jobs.push(...video_jobs.map((job) => ({
          ...job,
          type: 'video',
          user_email: job.users?.email,
          user_banned: job.users?.metadata?.banned || false
        })))
        total_count += video_count || 0
      }
    }
    
    if (!type || type === 'all' || type === 'audio') {
      const audio_query = build_query('audio_jobs', 'audio')
      const { data: audio_jobs, count: audio_count } = await audio_query
      
      if (audio_jobs) {
        all_jobs.push(...audio_jobs.map((job) => ({
          ...job,
          type: 'audio',
          user_email: job.users?.email,
          user_banned: job.users?.metadata?.banned || false
        })))
        total_count += audio_count || 0
      }
    }
    
    // 5. Sort all jobs by created_at descending
    all_jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    // 6. Apply pagination
    const paginated_jobs = all_jobs.slice(offset, offset + limit)
    
    // 7. Return results
    return api_success({
      jobs: paginated_jobs,
      total: total_count,
      limit,
      offset
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}