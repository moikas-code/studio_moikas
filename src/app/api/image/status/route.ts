import { NextRequest } from "next/server"
import { fal } from "@fal-ai/client"
import { add_overlay_to_image_node } from "@/lib/generate_helpers_node"

// Configure fal client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  })
}

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
  api_error,
  handle_api_error
} from "@/lib/utils/api/response"

// Type definitions for fal.ai responses
interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  progress?: number
  logs?: Array<{
    message: string
    timestamp?: string
  }>
}

interface FalImageResultResponse {
  data: {
    images?: Array<{
      url?: string
      data?: string
      base64?: string
      content_type?: string
      file_name?: string
      file_size?: number
      width?: number
      height?: number
    } | string>
    image?: string
    url?: string
    data?: string
    [key: string]: unknown
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await require_auth()

    // 2. Get job_id from query params
    const search_params = req.nextUrl.searchParams
    const job_id = search_params.get('job_id')

    if (!job_id) {
      return api_error('job_id is required', 400)
    }

    // 3. Get job from database
    const supabase = get_service_role_client()
    const { data: job, error: job_error } = await supabase
      .from('image_jobs')
      .select('*')
      .eq('job_id', job_id)
      .eq('user_id', user.user_id)
      .single()

    if (job_error || !job) {
      return api_error('Job not found', 404)
    }
    // console.log('job', job)
    // 4. If job is already completed or failed, return it
    if (job.status === 'completed' || job.status === 'failed') {
      // For completed jobs, process the image if needed
      if (job.status === 'completed' && (!job.image_url || job.image_url === null)) {
        // Job is completed but we don't have the image URL, fetch it from fal
        try {
          // For LoRA model, the result might be structured differently
          const result = await fal.queue.result(job.model, {
            requestId: job.fal_request_id
          })
          
          // Handle both wrapped and unwrapped responses
          const result_response: any = result.data ? result : { data: result }

          console.log('Fetching missing image for completed job:', JSON.stringify(result_response, null, 2))

          let extracted_images: string[] = []

          // Extract image URLs from various possible locations
          // Check if data property exists and has images
          const data = result_response.data || result_response
          
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            for (const img of data.images) {
              if (typeof img === 'string') {
                extracted_images.push(img)
              } else if (img && typeof img === 'object') {
                // Check for url field
                if ('url' in img && img.url && typeof img.url === 'string' && img.url.trim() !== '') {
                  extracted_images.push(img.url)
                }
                // Check if there's a data field with base64 image
                else if ('data' in img && img.data) {
                  extracted_images.push(img.data)
                }
                // Check if there's a base64 field
                else if ('base64' in img && img.base64) {
                  extracted_images.push(`data:${img.content_type || 'image/png'};base64,${img.base64}`)
                }
              }
            }
          } else if (data.image && typeof data.image === 'string') {
            extracted_images.push(data.image)
          } else if (data.url && typeof data.url === 'string') {
            extracted_images.push(data.url)
          } else if (typeof data === 'string') {
            // Sometimes the data itself might be the URL
            extracted_images.push(data)
          }

          // Store single image as string, multiple as JSON array
          const image_to_store = extracted_images.length === 1 ? extracted_images[0] : JSON.stringify(extracted_images)

          if (extracted_images.length > 0) {
            // Update the job with the image URL(s)
            await supabase
              .from('image_jobs')
              .update({
                image_url: image_to_store,
                metadata: {
                  ...job.metadata,
                  num_images_generated: extracted_images.length
                }
              })
              .eq('id', job.id)

            job.image_url = image_to_store
          }
        } catch (e: any) {
          console.error('Failed to fetch image for completed job:', e)
          
          // Log more details for validation errors
          if (e.status === 422) {
            console.error('Validation error details:', {
              model: job.model,
              request_id: job.fal_request_id,
              error_body: e.body,
              error_message: e.message
            })
          }
        }
      }

      // Apply watermark if needed (commented out for now)
      // const is_free_user = job.metadata?.is_free_user || false
      // const is_admin = job.metadata?.plan === 'admin'

      // let processed_image_url = job.image_url

      // // Apply watermark for free users (but not admins)
      // if (is_free_user && !is_admin && !job.metadata?.watermark_applied) {
      //   try {
      //     // Fetch and convert to base64
      //     let base64_image: string

      //     if (job.image_url.startsWith('data:image')) {
      //       base64_image = job.image_url
      //     } else {
      //       const image_response = await fetch(job.image_url)
      //       const buffer = await image_response.arrayBuffer()
      //       base64_image = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`
      //     }

      //     // Apply watermark
      //     const watermarked = await add_overlay_to_image_node(base64_image)
      //     processed_image_url = watermarked

      //     // Update job to mark watermark as applied
      //     await supabase
      //       .from('image_jobs')
      //       .update({
      //         metadata: {
      //           ...job.metadata,
      //           watermark_applied: true
      //         }
      //       })
      //       .eq('id', job.id)
      //   } catch (e) {
      //     console.error('Failed to apply watermark:', e)
      //     // Continue with original URL
      //   }
      // }

      // return api_success({
      //   job_id: job.job_id,
      //   status: job.status,
      //   image_url: processed_image_url,
      //   error: job.error,
      //   progress: job.progress,
      //   cost: job.cost,
      //   created_at: job.created_at,
      //   completed_at: job.completed_at,
      //   prompt: job.prompt,
      //   model: job.model,
      //   metadata: job.metadata
      // })

      // Parse image_url if it's a JSON array
      let images_to_return = job.image_url
      if (job.image_url && job.image_url.startsWith('[')) {
        try {
          images_to_return = JSON.parse(job.image_url)
        } catch (e) {
          // Keep as is if parsing fails
        }
      }

      return api_success({
        job_id: job.job_id,
        status: job.status,
        image_url: job.image_url, // Keep original for backward compatibility
        images: Array.isArray(images_to_return) ? images_to_return : [images_to_return], // Always return array
        error: job.error,
        progress: job.progress,
        cost: job.cost,
        created_at: job.created_at,
        completed_at: job.completed_at,
        prompt: job.prompt,
        model: job.model,
        metadata: job.metadata,
        num_images: job.metadata?.num_images_generated || job.num_images || 1
      })
    }

    // 5. If job has fal_request_id and is not completed, check fal.ai status
    let current_status = job.status
    let image_url = job.image_url
    let progress = job.progress || 0
    let error_message = job.error

    if (job.fal_request_id && job.status !== 'completed' && job.status !== 'failed') {
      try {
        console.log(`Checking fal.ai status for job ${job_id} with request ID: ${job.fal_request_id}`)

        // First, check the status
        const status_response = await fal.queue.status(job.model, {
          requestId: job.fal_request_id,
          logs: true
        }) as FalStatusResponse

        console.log('Fal status response:', JSON.stringify(status_response, null, 2))

        // Map fal.ai status to our status
        if (status_response.status === 'IN_PROGRESS') {
          current_status = 'processing'
          progress = status_response.progress || 50
        } else if (status_response.status === 'IN_QUEUE') {
          current_status = 'pending'
          progress = 0
        } else if (status_response.status === 'COMPLETED') {
          current_status = 'completed'
          progress = 100

          // Try to get the result
          try {
            // Get the raw result first
            const result = await fal.queue.result(job.model, {
              requestId: job.fal_request_id
            })
            
            // Handle different response structures
            const result_response: any = result.data ? result : { data: result }
            const data = result_response.data || result_response

            console.log('Fal result response:', JSON.stringify(result_response, null, 2))

            // Extract all image URLs from various possible locations
            let extracted_images: string[] = []

            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
              for (const img of data.images) {
                if (typeof img === 'string') {
                  extracted_images.push(img)
                } else if (img && typeof img === 'object') {
                  // Check for url field
                  if ('url' in img && img.url && typeof img.url === 'string' && img.url.trim() !== '') {
                    extracted_images.push(img.url)
                  }
                  // Check if there's a data field with base64 image
                  else if ('data' in img && img.data) {
                    extracted_images.push(img.data)
                  }
                  // Check if there's a base64 field
                  else if ('base64' in img && img.base64) {
                    extracted_images.push(`data:${img.content_type || 'image/png'};base64,${img.base64}`)
                  }
                  else {
                    // Log the full structure for debugging
                    console.error('Image object structure:', JSON.stringify(img, null, 2))
                    console.error('Full result_response:', JSON.stringify(result_response, null, 2))

                    // Check if we can construct a URL from file_name
                    if (img.file_name) {
                      console.log('Image has file_name but no URL:', img.file_name)
                    }
                  }
                }
              }
            } else if (data.image && typeof data.image === 'string') {
              extracted_images.push(data.image)
            } else if (data.url && typeof data.url === 'string') {
              extracted_images.push(data.url)
            } else if (typeof data === 'string') {
              // Sometimes the data itself might be the URL
              extracted_images.push(data)
            }

            // Store single image as string, multiple as JSON array
            if (extracted_images.length > 0) {
              image_url = extracted_images.length === 1 ? extracted_images[0] : JSON.stringify(extracted_images)
            }

            if (!image_url) {
              console.error('No image URL found in fal.ai result:', result_response)
              current_status = 'failed'
              error_message = 'No image URL in response'
            }
          } catch (result_error) {
            console.error('Failed to get fal.ai result:', result_error)
            // Even if we can't get the result, the job is complete
          }
        } else if (status_response.status === 'FAILED') {
          current_status = 'failed'
          error_message = 'Image generation failed in fal.ai'
          progress = 0
        }

        // Apply watermark if needed before updating database
        if (image_url && current_status === 'completed') {
          const is_free_user = job.metadata?.is_free_user || false
          const is_admin = job.metadata?.plan === 'admin'

          if (is_free_user && !is_admin && !job.metadata?.watermark_applied) {
            try {
              // Fetch and convert to base64
              let base64_image: string

              if (image_url.startsWith('data:image')) {
                base64_image = image_url
              } else {
                const image_response = await fetch(image_url)
                const buffer = await image_response.arrayBuffer()
                base64_image = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`
              }

              // Apply watermark
              const watermarked = await add_overlay_to_image_node(base64_image)
              image_url = watermarked
            } catch (e) {
              console.error('Failed to apply watermark:', e)
              // Continue with original URL
            }
          }
        }

        const update_data: Record<string, unknown> = {
          status: current_status,
          progress: progress
        }

        if (image_url && !job.image_url) {
          update_data.image_url = image_url
        }

        if (current_status === 'completed' || current_status === 'failed') {
          update_data.completed_at = new Date().toISOString()
        }

        if (error_message) {
          update_data.error = error_message
        }

        if (job.metadata) {
          update_data.metadata = {
            ...job.metadata,
            watermark_applied: image_url && job.metadata.is_free_user && job.metadata.plan !== 'admin',
            num_images_generated: image_url && image_url.startsWith('[') ? JSON.parse(image_url).length : 1
          }
        }

        const { error: update_error } = await supabase
          .from('image_jobs')
          .update(update_data)
          .eq('id', job.id)

        if (update_error) {
          console.error('Failed to update job in database:', update_error)
        } else {
          console.log(`Updated job ${job_id} in database with status: ${current_status}`)
        }
      } catch (fal_error) {
        console.error('Failed to check fal.ai status:', fal_error)
        // Continue with database values if fal.ai check fails
      }
    }
    // if failed, retry
    if (current_status === 'failed') {
      // retry job status to verify if the job failed and update the tatus if it was actually completed
      const status_response = await fal.queue.status(job.model, {
        requestId: job.fal_request_id,
        logs: true
      }) as FalStatusResponse

      if (status_response.status === 'COMPLETED') {
        // get the result
        const { data: result_response } = await fal.queue.result(job.model, {
          requestId: job.fal_request_id
        }) as FalImageResultResponse
        // Extract all image URLs using the same comprehensive logic
        let extracted_images: string[] = []

        if (result_response.images && Array.isArray(result_response.images) && result_response.images.length > 0) {
          for (const img of result_response.images) {
            console.log('Processing image:', img)
            if (typeof img === 'string') {
              extracted_images.push(img)
            } else if (img && typeof img === 'object') {
              // Check for url field
              if ('url' in img && img.url && typeof img.url === 'string' && img.url.trim() !== '') {
                extracted_images.push(img.url)
              }
              // Check if there's a data field with base64 image
              else if ('data' in img && img.data) {
                extracted_images.push(img.data)
              }
              // Check if there's a base64 field
              else if ('base64' in img && img.base64) {
                extracted_images.push(`data:${img.content_type || 'image/png'};base64,${img.base64}`)
              }
            }
          }
        } else if (result_response.image && typeof result_response.image === 'string') {
          extracted_images.push(result_response.image)
        } else if (result_response.url && typeof result_response.url === 'string') {
          extracted_images.push(result_response.url)
        } else if (result_response.data && typeof result_response.data === 'string') {
          extracted_images.push(result_response.data)
        }

        // Store single image as string, multiple as JSON array
        if (extracted_images.length > 0) {
          image_url = extracted_images.length === 1 ? extracted_images[0] : JSON.stringify(extracted_images)
        }
        // update the job status to completed
        current_status = 'completed'
        progress = 100
        // update the job in the database
        const { error: update_error } = await supabase
          .from('image_jobs')
          .update({
            status: 'completed',
            progress: 100,
            image_url: image_url,
            completed_at: new Date().toISOString(),
            error: null // Clear any previous error
          })
          .eq('id', job.id)

        if (update_error) {
          console.error('Failed to update job in database:', update_error)
        }
      }
    }

    // 6. Return job status
    // Parse image_url if it's a JSON array
    let images_to_return = image_url
    if (image_url && image_url.startsWith('[')) {
      try {
        images_to_return = JSON.parse(image_url)
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    return api_success({
      job_id: job.job_id,
      status: current_status,
      image_url: image_url, // Keep original for backward compatibility
      images: Array.isArray(images_to_return) ? images_to_return : (images_to_return ? [images_to_return] : []), // Always return array
      error: error_message,
      progress: progress,
      cost: job.cost,
      created_at: job.created_at,
      completed_at: job.completed_at || job.completed_at,
      prompt: job.prompt,
      model: job.model,
      metadata: job.metadata,
      num_images: job.metadata?.num_images_generated || job.num_images || 1
    })

  } catch (error) {
    return handle_api_error(error)
  }
}