import { NextRequest } from "next/server"
import { get_service_role_client } from "@/lib/utils/database/supabase"
import {
  api_error,
  api_success,
  handle_api_error
} from "@/lib/utils/api/response"
import { require_auth } from "@/lib/utils/api/auth"
import { fal } from "@fal-ai/client"

// Type definitions for fal.ai responses
interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
  logs?: Array<{
    message: string
    timestamp?: string
  }>
}

interface FalResultResponse {
  data: {
    audio: {
      url?: string
      content_type?: string
      file_name?: string
      file_size?: number
      file_type?: string
      file_data?: string
    }
    requestId?: string
  }
}

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

    // 3. Get parent job - first check if this is a parent job ID
    const supabase = get_service_role_client()
    let parent_job = null
    let parent_error = null

    // First try to find as a parent document job
    const { data: doc_job, error: doc_error } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .eq('type', 'document')
      .single()

    if (doc_job) {
      parent_job = doc_job
    } else {
      // If not found, check if this is a chunk job ID and extract parent ID
      if (job_id.startsWith('audio_chunk_')) {
        // Extract parent job ID from chunk job ID pattern: audio_chunk_{parent_id}_{index}
        const parent_job_id = job_id.replace(/^audio_chunk_/, '').replace(/_\d+$/, '')

        const { data: parent_doc_job, error: parent_doc_error } = await supabase
          .from('audio_jobs')
          .select('*')
          .eq('job_id', parent_job_id)
          .eq('user_id', user.user_id)
          .eq('type', 'document')
          .single()

        parent_job = parent_doc_job
        parent_error = parent_doc_error
      } else {
        parent_error = doc_error
      }
    }

    if (parent_error || !parent_job) {
      console.error('Document job not found for job_id:', job_id, 'error:', parent_error)
      return api_error('Document job not found', 404)
    }

    // 4. Get chunk jobs if they exist
    // Chunk jobs have IDs like: audio_chunk_{parent_job_id}_{index}
    let chunks_data: Array<{
      job_id: string
      status: string
      audio_url?: string
      progress?: number
      metadata?: { chunk_index?: number }
      fal_request_id?: string
      completed_at?: string
    }> = []

    // Query chunk jobs using pattern matching with parent job ID
    const { data: chunks } = await supabase
      .from('audio_jobs')
      .select('job_id, status, audio_url, progress, metadata, fal_request_id, completed_at')
      .like('job_id', `audio_chunk_${parent_job.job_id}_%`)
      .eq('user_id', user.user_id)
      .order('metadata->chunk_index')

    chunks_data = chunks || []

    console.log('Found chunks:', chunks_data.length)
    console.log('Chunk details:', chunks_data.map(c => ({
      job_id: c.job_id,
      status: c.status,
      audio_url: c.audio_url,
      has_audio_url: !!c.audio_url,
      chunk_index: c.metadata?.chunk_index,
      fal_request_id: c.fal_request_id
    })))

    // If any chunks don't have audio URLs but have fal_request_ids, log warning
    const missing_audio = chunks_data.filter(c => c.status === 'completed' && !c.audio_url && c.fal_request_id)
    if (missing_audio.length > 0) {
      console.warn('Completed chunks missing audio URLs - will check fal.ai:', missing_audio.map(c => ({
        job_id: c.job_id,
        fal_request_id: c.fal_request_id
      })))
    }

    // 5. Calculate overall progress and status
    let overall_status = parent_job.status
    let overall_progress = 0

    // Process chunk statuses with fal.ai status checks
    const chunk_statuses = await Promise.all(
      chunks_data.map(async (chunk) => {
        let chunk_status = chunk.status
        let chunk_audio_url = chunk.audio_url

        // Check fal.ai status if we have a request ID and either:
        // 1. Job is not completed/failed OR
        // 2. Job is completed but has no audio URL (webhook might have failed)
        const should_check_fal = chunk.fal_request_id && (
          (chunk.status !== 'completed' && chunk.status !== 'failed') ||
          (chunk.status === 'completed' && !chunk.audio_url)
        )
        
        console.log(`Chunk ${chunk.job_id} check decision:`, {
          has_fal_request_id: !!chunk.fal_request_id,
          status: chunk.status,
          has_audio_url: !!chunk.audio_url,
          should_check_fal
        })
        
        if (should_check_fal) {
          try {
            // Always try to get the result for completed jobs without audio
            let fal_result = null
            
            // For completed jobs with no audio URL, go directly to result
            if (chunk.status === 'completed' && !chunk.audio_url) {
              console.log(`Chunk ${chunk.job_id} is marked completed but has no audio URL - fetching result directly`)
              try {
                const { data: result_response } = await fal.queue.result("resemble-ai/chatterboxhd/text-to-speech", {
                  requestId: chunk.fal_request_id!
                }) as FalResultResponse
                fal_result = result_response
                console.log(`Direct fal result for chunk ${chunk.job_id}:`, JSON.stringify(fal_result, null, 2))
              } catch (result_error) {
                console.error(`Failed to get direct fal result for chunk ${chunk.job_id}:`, result_error)
                // If direct result fails, try status check
                const status_response = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
                  requestId: chunk.fal_request_id!
                }) as FalStatusResponse
                console.log(`Fal status for chunk ${chunk.job_id}:`, JSON.stringify(status_response, null, 2))
              }
            } else {
              // For non-completed jobs, check status first
              const status_response = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", {
                requestId: chunk.fal_request_id!
              }) as FalStatusResponse
              console.log(`Fal status for chunk ${chunk.job_id}:`, JSON.stringify(status_response, null, 2))
              
              // Update status based on fal.ai response
              if (status_response.status === 'IN_PROGRESS') {
                chunk_status = 'processing'
              } else if (status_response.status === 'IN_QUEUE') {
                chunk_status = 'pending'
              } else if (status_response.status === 'COMPLETED') {
                chunk_status = 'completed'
                // Try to get the result
                try {
                  const { data: result_response } = await fal.queue.result("resemble-ai/chatterboxhd/text-to-speech", {
                    requestId: chunk.fal_request_id!
                  }) as FalResultResponse
                  fal_result = result_response
                  console.log(`Fal result for completed chunk ${chunk.job_id}:`, JSON.stringify(fal_result, null, 2))
                } catch (result_error) {
                  console.error(`Failed to get fal result for chunk ${chunk.job_id}:`, result_error)
                }
              } else if (status_response.status === 'FAILED') {
                chunk_status = 'failed'
                // Update the database if status changed
                if (chunk.status !== 'failed') {
                  await supabase
                    .from('audio_jobs')
                    .update({
                      status: 'failed',
                      error: 'Job failed in fal.ai',
                      completed_at: new Date().toISOString()
                    })
                    .eq('job_id', chunk.job_id)
                    .eq('user_id', user.user_id)
                }
              }
            }

            // Extract audio URL from result following the FalResultResponse interface
            if (fal_result) {
              console.log(`Processing fal_result for chunk ${chunk.job_id}`)
              
              // Extract audio URL following the FalResultResponse interface
              chunk_audio_url = fal_result.audio?.url
              console.log('Extracted audio URL:', chunk_audio_url)
              
              if (!chunk_audio_url) {
                console.error('No audio URL found in fal.ai result:', fal_result)
              }

              // Update the database if we found an audio URL
              if (chunk_audio_url && (!chunk.audio_url || chunk.audio_url !== chunk_audio_url)) {
                console.log(`Updating chunk ${chunk.job_id} with new audio URL in database`)
                const update_result = await supabase
                  .from('audio_jobs')
                  .update({
                    audio_url: chunk_audio_url,
                    status: 'completed',
                    completed_at: chunk.completed_at || new Date().toISOString()
                  })
                  .eq('job_id', chunk.job_id)
                  .eq('user_id', user.user_id)

                if (update_result.error) {
                  console.error(`Failed to update chunk ${chunk.job_id}:`, update_result.error)
                } else {
                  console.log(`Successfully updated chunk ${chunk.job_id} with audio URL`)
                }
              } else if (!chunk_audio_url) {
                console.warn(`No audio URL found in fal result for chunk ${chunk.job_id}`)
              }
            }
          } catch (error) {
            console.error(`Failed to check fal status for chunk ${chunk.job_id}:`, error)
          }
        }

        return {
          chunk_index: chunk.metadata?.chunk_index || 0,
          status: chunk_status,
          audio_url: chunk_audio_url,
          progress: chunk.progress || 0
        }
      })
    )

    if (chunk_statuses.length > 0) {
      const completed_chunks = chunk_statuses.filter(c => c.status === 'completed').length
      const failed_chunks = chunk_statuses.filter(c => c.status === 'failed').length

      overall_progress = Math.round((completed_chunks / chunk_statuses.length) * 100)

      // Update overall status based on chunks
      if (failed_chunks > 0 && failed_chunks === chunk_statuses.length) {
        overall_status = 'failed'
      } else if (completed_chunks === chunk_statuses.length) {
        overall_status = 'completed'
      } else if (chunk_statuses.some(c => c.status === 'processing')) {
        overall_status = 'processing'
      } else if (chunk_statuses.some(c => c.status === 'pending')) {
        overall_status = 'processing' // Show as processing if any chunks are pending
      }
      
      // Update parent job status in database if it changed
      if (overall_status !== parent_job.status) {
        const update_data: Record<string, unknown> = {
          status: overall_status,
          progress: overall_progress
        }
        
        if (overall_status === 'completed' && !parent_job.completed_at) {
          update_data.completed_at = new Date().toISOString()
        }
        
        const { error: update_error } = await supabase
          .from('audio_jobs')
          .update(update_data)
          .eq('job_id', parent_job.job_id)
          .eq('user_id', user.user_id)
          
        if (update_error) {
          console.error('Failed to update parent job status:', update_error)
        } else {
          console.log(`Updated parent job ${parent_job.job_id} status to ${overall_status}`)
        }
      }
    }


    // 6. Return aggregated status with all metadata
    const response_data = {
      job_id: parent_job.job_id,
      status: overall_status,
      progress: overall_progress,
      total_chunks: parent_job.metadata?.total_chunks || chunks_data.length,
      chunks: chunk_statuses,
      error: parent_job.error,
      created_at: parent_job.created_at,
      completed_at: parent_job.completed_at,
      metadata: {
        plan: parent_job.metadata?.plan,
        total_text_length: parent_job.metadata?.total_text_length || parent_job.text?.length || 0,
        total_cost: parent_job.cost || parent_job.metadata?.total_cost || 0,
        total_chunks: parent_job.metadata?.total_chunks || chunks_data.length
      }
    }

    console.log('Returning status response:', {
      job_id: response_data.job_id,
      status: response_data.status,
      progress: response_data.progress,
      chunks_with_audio: chunk_statuses.filter(c => c.audio_url).length,
      total_chunks: chunk_statuses.length,
      total_text_length: response_data.metadata.total_text_length,
      total_cost: response_data.metadata.total_cost
    })

    return api_success(response_data)
  } catch (error) {
    return handle_api_error(error)
  }
}