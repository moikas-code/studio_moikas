import { NextRequest, NextResponse } from "next/server"

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
  handle_api_error 
} from "@/lib/utils/api/response"

export async function GET(req: NextRequest) {
  try {
    // 1. Require admin authentication
    await require_admin_access()
    
    // 2. Get query parameters
    const search_params = req.nextUrl.searchParams
    const type = search_params.get('type') // image, video, audio, or all
    const status = search_params.get('status') // pending, processing, completed, failed, or all
    const search = search_params.get('search') // search query
    const format = search_params.get('format') || 'csv' // Only CSV for now
    
    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 })
    }
    
    // 3. Build queries for each job type
    const supabase = get_service_role_client()
    
    // Helper function to build query with filters
    const build_query = (table: string, job_type: string) => {
      let query = supabase
        .from(table)
        .select('*, users!inner(email)')
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }
      
      if (search) {
        query = query.or(`job_id.ilike.%${search}%,users.email.ilike.%${search}%${job_type !== 'audio' ? `,prompt.ilike.%${search}%` : ''}`)
      }
      
      return query
    }
    
    // 4. Fetch all jobs based on type filter
    let all_jobs: any[] = []
    
    if (!type || type === 'all' || type === 'image') {
      const { data: image_jobs } = await build_query('image_jobs', 'image')
      if (image_jobs) {
        all_jobs.push(...image_jobs.map(job => ({
          ...job,
          type: 'image',
          user_email: job.users?.email
        })))
      }
    }
    
    if (!type || type === 'all' || type === 'video') {
      const { data: video_jobs } = await build_query('video_jobs', 'video')
      if (video_jobs) {
        all_jobs.push(...video_jobs.map(job => ({
          ...job,
          type: 'video',
          user_email: job.users?.email
        })))
      }
    }
    
    if (!type || type === 'all' || type === 'audio') {
      const { data: audio_jobs } = await build_query('audio_jobs', 'audio')
      if (audio_jobs) {
        all_jobs.push(...audio_jobs.map(job => ({
          ...job,
          type: 'audio',
          user_email: job.users?.email
        })))
      }
    }
    
    // 5. Sort all jobs by created_at descending
    all_jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    // 6. Generate CSV
    const csv_headers = [
      'Job ID',
      'Type',
      'Status',
      'User Email',
      'User ID',
      'Model',
      'Cost (MP)',
      'Created At',
      'Completed At',
      'Progress',
      'Error',
      'Prompt',
      'Result URL'
    ]
    
    const csv_rows = all_jobs.map(job => [
      job.job_id,
      job.type,
      job.status,
      job.user_email || '',
      job.user_id,
      job.model,
      job.cost.toString(),
      job.created_at,
      job.completed_at || '',
      job.progress.toString(),
      job.error || '',
      job.prompt || '',
      job.image_url || job.video_url || job.audio_url || ''
    ])
    
    // Build CSV content
    const csv_content = [
      csv_headers.map(h => `"${h}"`).join(','),
      ...csv_rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    // 7. Return CSV response
    return new NextResponse(csv_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="jobs-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}