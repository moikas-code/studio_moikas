import { NextRequest } from "next/server"
import { get_anon_client } from "@/lib/utils/database/supabase"
import {
  api_error,
  api_success,
  handle_api_error
} from "@/lib/utils/api/response"
import { require_auth } from "@/lib/utils/api/auth"
import { fal } from "@fal-ai/client"

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await require_auth()

    // 2. Get job_id from query params
    const { searchParams } = new URL(req.url)
    const job_id = searchParams.get('job_id')

    if (!job_id) {
      return api_error('Missing job_id parameter', 400)
    }

    // 3. Get parent job
    const supabase = get_anon_client()
    const { data: parent_job, error: parent_error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .eq('type', 'document')
      .single()

    if (parent_error || !parent_job) {
      return api_error('Document job not found', 404)
    }

    // 4. Get chunk jobs if they exist
    const chunk_job_ids = parent_job.metadata?.chunk_jobs?.map((c: { job_id: string }) => c.job_id) || []
    let chunks_data: Array<{
      job_id: string
      status: string
      audio_url?: string
      progress?: number
      metadata?: { chunk_index?: number }
      fal_request_id?: string
    }> = []

    if (chunk_job_ids.length > 0) {
      const { data: chunks } = await supabase
        .from('audio_jobs')
        .select('job_id, status, audio_url, progress, metadata, fal_request_id')
        .in('job_id', chunk_job_ids)
        .eq('user_id', user.user_id)
        .order('metadata->chunk_index')

      chunks_data = chunks || []
    }
    // Check fal status
    // console.log(fal_status)
    // // TODO: Update parent job status based on fal status
    // if (fal_status.status === 'IN_PROGRESS') {
    //   parent_job.status = 'processing'
    // } else if (fal_status.status === 'IN_QUEUE') {
    //   parent_job.status = 'pending'
    // }
    //  //IF FAL IS COMPLETED, UPDATE PARENT JOB STATUS TO COMPLETED
    //  if (fal_status.status === 'COMPLETED') {
    //   parent_job.status = 'completed'
    //  }

    // 5. Calculate overall progress and status
    let overall_status = parent_job.status
    let overall_progress = 0
    const chunk_statuses = chunks_data.map(async (chunk) => {
      if (!chunk.fal_request_id) return {
        chunk_index: chunk.metadata?.chunk_index || 0,
        status: chunk.status,
        audio_url: chunk.audio_url,
        progress: chunk.progress || 0
      }
      
      const fal_status = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", { requestId: chunk.fal_request_id })
      console.log(fal_status)
      if (fal_status.status === 'IN_PROGRESS') {
        chunk.status = 'processing'
      } else if (fal_status.status === 'IN_QUEUE') {
        chunk.status = 'pending'
      } else if (fal_status.status === 'COMPLETED') {
        chunk.status = 'completed'
        return {
          chunk_index: chunk.metadata?.chunk_index || 0,
          status: chunk.status,
          audio_url: chunk.audio_url,
          progress: chunk.progress || 0
        }
      }
    })

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


    // 6. Return aggregated status
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