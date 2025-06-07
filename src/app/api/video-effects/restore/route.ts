import { NextRequest } from "next/server"
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
import {
  validate_request
} from "@/lib/utils/api/validation"
import { z } from "zod"
import { fal } from "@fal-ai/client"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const restore_schema = z.object({
  job_id: z.string().min(1)
})

// Type definitions for fal.ai responses
interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
}

interface FalResultResponse {
  data: {
    video: {
      url?: string
    }
    requestId?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()

    // 2. Validate request
    const body = await req.json()
    const { job_id } = validate_request(restore_schema, body)

    // 3. Get job from database
    const supabase = get_service_role_client()
    const { data: job, error } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .single()

    if (error || !job) {
      return api_error('Job not found', 404)
    }

    // 4. Check if job needs restoration
    if (job.status === 'completed' && job.video_url) {
      return api_success({
        message: 'Job already completed',
        job_id: job.job_id,
        status: job.status,
        video_url: job.video_url
      })
    }

    // 5. Check if job has fal_request_id
    if (!job.fal_request_id) {
      return api_error('Cannot restore job without fal.ai request ID', 400)
    }

    // 6. Check fal.ai status
    try {
      console.log(`Restoring video job ${job_id} with fal request ID: ${job.fal_request_id}`)

      // Check status first
      const status_response = await fal.queue.status(job.model_id, {
        requestId: job.fal_request_id
      }) as FalStatusResponse

      console.log('Fal status response:', JSON.stringify(status_response, null, 2))

      let updated_status = job.status
      let video_url = job.video_url
      let error_message = job.error
      let progress = job.progress || 0

      if (status_response.status === 'COMPLETED') {
        // Try to get the result
        try {
          const { data: result_response } = await fal.queue.result(job.model_id, {
            requestId: job.fal_request_id
          }) as FalResultResponse

          console.log('Fal result response:', JSON.stringify(result_response, null, 2))

                    // Extract video URL
          video_url = result_response.video?.url || null

          if (video_url) {
            updated_status = 'completed'
            progress = 100
          } else {
            updated_status = 'failed'
            error_message = 'No video URL found in fal.ai result'
          }
        } catch (result_error) {
          console.error('Failed to get fal.ai result:', result_error)
          updated_status = 'failed'
          error_message = 'Failed to retrieve video from fal.ai'
        }
      } else if (status_response.status === 'FAILED') {
        updated_status = 'failed'
        error_message = 'Video generation failed in fal.ai'
      } else if (status_response.status === 'IN_PROGRESS') {
        updated_status = 'processing'
        progress = status_response.progress || 50
      } else if (status_response.status === 'IN_QUEUE') {
        updated_status = 'pending'
        progress = 0
      }

      // 7. Update database
      const update_data: Record<string, unknown> = {
        status: updated_status,
        progress: progress
      }

      if (video_url) {
        update_data.video_url = video_url
      }

      if (updated_status === 'completed' || updated_status === 'failed') {
        update_data.completed_at = new Date().toISOString()
      }

      if (error_message) {
        update_data.error = error_message
      }

      const { error: update_error } = await supabase
        .from('video_jobs')
        .update(update_data)
        .eq('id', job.id)

      if (update_error) {
        console.error('Failed to update job:', update_error)
        return api_error('Failed to update job status', 500)
      }

      return api_success({
        message: 'Job restored successfully',
        job_id: job.job_id,
        status: updated_status,
        video_url: video_url,
        progress: progress,
        error: error_message
      })

    } catch (fal_error) {
      console.error('Failed to check fal.ai status:', fal_error)
      return api_error('Failed to check job status with fal.ai', 500)
    }

  } catch (error) {
    return handle_api_error(error)
  }
}