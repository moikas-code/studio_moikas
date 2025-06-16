import { NextRequest } from "next/server"
import { fal } from "@fal-ai/client"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Type for fal.ai image generation result
interface FalImageResult {
  images?: Array<{ url: string }>
  image?: { url: string }
  url?: string
}

// Configure fal client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  })
}

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

// Helper to get base URL for webhooks
function get_base_url(): string | null {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  if (process.env.NODE_ENV === 'development') {
    // Try to get from tunnel URL if available
    if (process.env.TUNNEL_URL) {
      return process.env.TUNNEL_URL
    }
    return 'http://localhost:3000'
  }
  return null
}

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
    
    // 6. Submit to fal.ai based on job type
    try {
      const base_url = get_base_url()
      const webhook_url = base_url ? `${base_url}/api/webhooks/fal-ai` : null
      
      let fal_result: { request_id: string } | null = null
      
      if (job_type === 'image') {
        // Build input for image generation
        const fal_input: Record<string, unknown> = {
          prompt: job.prompt
        }
        
        // Parse image_size if it's stored as string (e.g., "1024x1024")
        if (job.image_size) {
          const [width, height] = job.image_size.split('x').map(Number)
          if (width && height) {
            fal_input.image_size = { width, height }
          }
        }
        
        // Add metadata parameters if they exist
        if (job.metadata) {
          if (job.metadata.negative_prompt) {
            fal_input.negative_prompt = job.metadata.negative_prompt
          }
          if (job.metadata.num_inference_steps) {
            fal_input.num_inference_steps = job.metadata.num_inference_steps
          }
          if (job.metadata.guidance_scale !== undefined) {
            fal_input.guidance_scale = job.metadata.guidance_scale
          }
          if (job.metadata.seed !== undefined) {
            fal_input.seed = job.metadata.seed
          }
          if (job.metadata.num_images !== undefined) {
            fal_input.num_images = job.metadata.num_images
          }
          if (job.metadata.style_name) {
            fal_input.style_name = job.metadata.style_name
          }
          if (job.metadata.enable_safety_checker !== undefined) {
            fal_input.enable_safety_checker = job.metadata.enable_safety_checker
          }
          if (job.metadata.expand_prompt !== undefined) {
            fal_input.expand_prompt = job.metadata.expand_prompt
          }
          if (job.metadata.format) {
            fal_input.format = job.metadata.format
          }
          if (job.metadata.embeddings) {
            fal_input.embeddings = job.metadata.embeddings
          }
          if (job.metadata.loras) {
            fal_input.loras = job.metadata.loras
          }
          if (job.metadata.model_name) {
            fal_input.model_name = job.metadata.model_name
          }
        }
        
        // Override num_images if it's in the job record
        if (job.num_images) {
          fal_input.num_images = job.num_images
        }
        
        // Submit to fal.ai
        if (webhook_url) {
          fal_result = await fal.queue.submit(job.model, {
            input: fal_input,
            webhookUrl: webhook_url
          })
        } else {
          // Use synchronous processing if no webhook URL
          const result = await fal.subscribe(job.model, {
            input: fal_input,
            logs: true
          }) as FalImageResult
          // For synchronous results, we need to update the job immediately
          // This is a simplified version - in production you'd want to handle the result properly
          const { error: update_error } = await supabase
            .from('image_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              image_url: result?.images?.[0]?.url || result?.image?.url || result?.url || null
            })
            .eq('id', new_job.id)
          
          if (update_error) {
            console.error('Failed to update job after sync completion:', update_error)
          }
        }
      } else if (job_type === 'video') {
        // Video generation logic would go here
        // For now, we'll skip as it requires different parameters
        console.log('Video retry not yet implemented')
      } else if (job_type === 'audio') {
        // Audio generation logic would go here
        // For now, we'll skip as it requires different parameters
        console.log('Audio retry not yet implemented')
      }
      
      // 7. Update job with fal_request_id if we got one
      if (fal_result && 'request_id' in fal_result) {
        const { error: update_error } = await supabase
          .from(`${job_type}_jobs`)
          .update({
            fal_request_id: fal_result.request_id,
            status: 'processing'
          })
          .eq('id', new_job.id)
        
        if (update_error) {
          console.error('Failed to update job with request ID:', update_error)
        }
      }
      
    } catch (fal_error) {
      console.error('Failed to submit job to fal.ai:', fal_error)
      // Update job status to failed
      await supabase
        .from(`${job_type}_jobs`)
        .update({
          status: 'failed',
          error: `Failed to submit to fal.ai: ${fal_error instanceof Error ? fal_error.message : 'Unknown error'}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', new_job.id)
      
      return api_error('Failed to submit job to processing service', 500)
    }
    
    return api_success({
      message: 'Job retry initiated',
      new_job_id: new_job.job_id,
      original_job_id: job.job_id
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}