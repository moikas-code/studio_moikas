import { NextRequest } from "next/server"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  require_auth
} from "@/lib/utils/api/auth"
import { 
  api_success, 
  handle_api_error 
} from "@/lib/utils/api/response"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await require_auth()
    
    // 2. Get query params
    const search_params = req.nextUrl.searchParams
    const limit = parseInt(search_params.get('limit') || '50')
    const offset = parseInt(search_params.get('offset') || '0')
    const status = search_params.get('status') // optional filter
    
    // 3. Query image jobs
    const supabase = get_service_role_client()
    let query = supabase
      .from('image_jobs')
      .select('*')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: jobs, error: jobs_error, count } = await query
    
    if (jobs_error) {
      console.error('Failed to fetch image jobs:', jobs_error)
      throw new Error('Failed to fetch image history')
    }
    
    // 4. Format response
    const formatted_jobs = jobs?.map(job => ({
      job_id: job.job_id,
      status: job.status,
      prompt: job.prompt,
      model: job.model,
      image_size: job.image_size,
      num_images: job.num_images,
      image_url: job.image_url,
      error: job.error,
      progress: job.progress,
      cost: job.cost,
      created_at: job.created_at,
      completed_at: job.completed_at,
      metadata: job.metadata
    })) || []
    
    return api_success({
      jobs: formatted_jobs,
      total: count || 0,
      limit,
      offset
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}