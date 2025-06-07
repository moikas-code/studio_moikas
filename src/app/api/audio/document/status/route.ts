import { NextRequest } from "next/server"
import { get_service_role_client } from "@/lib/utils/database/supabase"
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
    }> = []

    // Query chunk jobs using pattern matching with parent job ID
    const { data: chunks } = await supabase
      .from('audio_jobs')
      .select('job_id, status, audio_url, progress, metadata, fal_request_id')
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
      console.warn('Completed chunks missing audio URLs:', missing_audio.map(c => ({
        job_id: c.job_id,
        fal_request_id: c.fal_request_id
      })))
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
    
    // Process chunk statuses with fal.ai status checks
    const chunk_statuses = await Promise.all(
      chunks_data.map(async (chunk) => {
        let chunk_status = chunk.status
        let chunk_audio_url = chunk.audio_url
        
        // Check fal.ai status if we have a request ID and either:
        // 1. Job is not completed/failed OR
        // 2. Job is completed but has no audio URL (webhook might have failed)
        if (chunk.fal_request_id && (
          (chunk.status !== 'completed' && chunk.status !== 'failed') ||
          (chunk.status === 'completed' && !chunk.audio_url)
        )) {
          try {
            const fal_status = await fal.queue.status("resemble-ai/chatterboxhd/text-to-speech", { 
              requestId: chunk.fal_request_id 
            })
            
            // Define proper type for fal status response
            interface FalStatusResponse {
              status: string
              result?: string | { url?: string; audio_url?: string; audio?: string; output?: string }
            }
            
            const typed_fal_status = fal_status as FalStatusResponse
            
            console.log(`Fal status for chunk ${chunk.job_id}:`, {
              status: typed_fal_status.status,
              result: typed_fal_status.result,
              result_type: typeof typed_fal_status.result
            })
            
            if (fal_status.status === 'IN_PROGRESS') {
              chunk_status = 'processing'
            } else if (fal_status.status === 'IN_QUEUE') {
              chunk_status = 'pending'
            } else if (fal_status.status === 'COMPLETED') {
              chunk_status = 'completed'
              // Try different possible locations for audio URL
              const result = typed_fal_status.result
              console.log(`Fal result structure for ${chunk.job_id}:`, {
                has_result: !!result,
                result_type: typeof result,
                result_is_string: typeof result === 'string',
                result_keys: result && typeof result === 'object' ? Object.keys(result) : []
              })
              
              if (result) {
                // If result is a string, it might be the URL directly
                if (typeof result === 'string') {
                  chunk_audio_url = result
                } else if (typeof result === 'object') {
                  // Try various possible paths
                  chunk_audio_url = result.url || result.audio_url || result.audio || result.output
                }
                
                if (chunk_audio_url) {
                  console.log(`Got audio URL from fal result for chunk ${chunk.job_id}:`, chunk_audio_url)
                  
                  // Update the database if we found the URL but it wasn't saved
                  if (!chunk.audio_url) {
                    const update_result = await supabase
                      .from('audio_jobs')
                      .update({
                        audio_url: chunk_audio_url,
                        status: 'completed',
                        completed_at: new Date().toISOString()
                      })
                      .eq('job_id', chunk.job_id)
                      .eq('user_id', user.user_id)
                    
                    console.log(`Updated chunk ${chunk.job_id} with audio URL:`, update_result)
                  }
                } else {
                  console.warn(`No audio URL found in fal result for chunk ${chunk.job_id}`)
                }
              } else {
                console.warn(`No result in fal status for chunk ${chunk.job_id}`)
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
    }


    // 6. Return aggregated status
    const response_data = {
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
        total_text_length: parent_job.metadata?.total_text_length,
        total_cost: parent_job.cost || 0
      }
    }
    
    console.log('Returning status response:', {
      job_id: response_data.job_id,
      status: response_data.status,
      progress: response_data.progress,
      chunks_with_audio: chunk_statuses.filter(c => c.audio_url).length,
      total_chunks: chunk_statuses.length
    })
    
    return api_success(response_data)
  } catch (error) {
    return handle_api_error(error)
  }
}