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
  api_error,
  handle_api_error 
} from "@/lib/utils/api/response"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    await require_admin_access()
    
    const { id: job_id } = await params
    if (!job_id) {
      return api_error('Job ID is required', 400)
    }
    
    // 2. Get the job from any of the job tables
    const supabase = get_service_role_client()
    
    // Try each job table
    let job = null
    let job_type = null
    
    // Check image_jobs
    const { data: image_job } = await supabase
      .from('image_jobs')
      .select('*')
      .eq('id', job_id)
      .single()
    
    if (image_job) {
      job = image_job
      job_type = 'image'
    } else {
      // Check video_jobs
      const { data: video_job } = await supabase
        .from('video_jobs')
        .select('*')
        .eq('id', job_id)
        .single()
      
      if (video_job) {
        job = video_job
        job_type = 'video'
      } else {
        // Check audio_jobs
        const { data: audio_job } = await supabase
          .from('audio_jobs')
          .select('*')
          .eq('id', job_id)
          .single()
        
        if (audio_job) {
          job = audio_job
          job_type = 'audio'
        }
      }
    }
    
    if (!job || !job_type) {
      return api_error('Job not found', 404)
    }
    
    // 3. Check if job can be retried (only failed jobs)
    if (job.status !== 'failed') {
      return api_error('Only failed jobs can be retried', 400)
    }
    
    // 4. Create a new job with the same parameters
    const new_job_data = {
      user_id: job.user_id,
      job_id: `${job.job_id}-retry-${Date.now()}`,
      status: 'pending',
      model: job.model,
      cost: job.cost,
      progress: 0,
      metadata: {
        ...(job.metadata || {}),
        retry_of: job.job_id,
        retried_at: new Date().toISOString()
      }
    }
    
    // Add type-specific fields
    if (job_type === 'image') {
      Object.assign(new_job_data, {
        prompt: job.prompt,
        image_size: job.image_size,
        num_images: job.num_images
      })
    } else if (job_type === 'video') {
      Object.assign(new_job_data, {
        prompt: job.prompt,
        aspect_ratio: job.aspect_ratio,
        duration: job.duration
      })
    } else if (job_type === 'audio') {
      Object.assign(new_job_data, {
        text: job.text,
        voice_id: job.voice_id,
        format: job.format
      })
    }
    
    // 5. Insert the new job
    const { data: new_job, error: insert_error } = await supabase
      .from(`${job_type}_jobs`)
      .insert(new_job_data)
      .select()
      .single()
    
    if (insert_error || !new_job) {
      console.error('Failed to create retry job:', insert_error)
      return api_error('Failed to create retry job', 500)
    }
    
    // 6. TODO: Submit to fal.ai (would need to implement based on job type)
    // For now, we just create the job record
    
    return api_success({
      message: 'Job retry initiated',
      new_job_id: new_job.job_id,
      original_job_id: job.job_id
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}