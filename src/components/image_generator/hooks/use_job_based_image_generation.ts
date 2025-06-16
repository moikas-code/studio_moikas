import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'
import type { GenerationParams } from './use_image_generation'

export interface ImageJob {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  image_url?: string
  images?: string[] // Array of image URLs
  error?: string
  progress: number
  cost: number
  created_at: string
  completed_at?: string
  prompt?: string
  model?: string
  metadata?: Record<string, unknown>
  num_images?: number
}

export interface JobGenerationResult {
  job_id: string
  status: string
  message: string
}

export function useJobBasedImageGeneration() {
  const [is_loading, set_is_loading] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  const [current_job, set_current_job] = useState<ImageJob | null>(null)
  const [job_history, set_job_history] = useState<ImageJob[]>([])
  const polling_interval = useRef<NodeJS.Timeout>()
  
  // Load job history on mount
  useEffect(() => {
    load_job_history()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (polling_interval.current) {
        clearInterval(polling_interval.current)
      }
    }
  }, [])
  
  const load_job_history = useCallback(async () => {
    try {
      const response = await fetch('/api/image/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        set_job_history(data.data?.jobs || [])
      }
    } catch (error) {
      console.error('Failed to load job history:', error)
    }
  }, [])
  
  const check_job_status = useCallback(async (job_id: string): Promise<ImageJob | null> => {
    try {
      const response = await fetch(`/api/image/status?job_id=${job_id}`)
      if (!response.ok) {
        throw new Error('Failed to check job status')
      }
      
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Failed to check job status:', error)
      return null
    }
  }, [])
  
  const start_polling = useCallback((job_id: string) => {
    // Clear any existing polling
    if (polling_interval.current) {
      clearInterval(polling_interval.current)
    }
    
    // Poll every 2 seconds
    polling_interval.current = setInterval(async () => {
      const job = await check_job_status(job_id)
      
      if (job) {
        set_current_job(job)
        
        // Stop polling if job is complete or failed
        if (job.status === 'completed' || job.status === 'failed') {
          if (polling_interval.current) {
            clearInterval(polling_interval.current)
          }
          
          // Reload history to include new job
          load_job_history()
          
          // Show notification
          if (job.status === 'completed') {
            toast.success('Image generated successfully!')
            track('image_job_completed', { job_id })
          } else {
            toast.error(job.error || 'Image generation failed')
            track('image_job_failed', { job_id, error: job.error })
          }
        }
      }
    }, 2000)
  }, [check_job_status, load_job_history])
  
  const submit_job = useCallback(async (
    params: GenerationParams
  ): Promise<JobGenerationResult | null> => {
    set_is_loading(true)
    set_error_message(null)
    set_current_job(null)
    
    try {
      // Clean up params before sending
      const cleaned_params = {
        ...params,
        // Filter out invalid loras
        loras: params.loras?.filter(l => l && l.path && typeof l.path === 'string') || undefined,
        // Filter out invalid embeddings
        embeddings: params.embeddings?.filter(e => e && e.path && typeof e.path === 'string') || undefined
      }
      
      // Remove undefined values
      Object.keys(cleaned_params).forEach(key => {
        if (cleaned_params[key as keyof typeof cleaned_params] === undefined) {
          delete cleaned_params[key as keyof typeof cleaned_params]
        }
      })
      
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned_params)
      })
      
      const response_data = await response.json()
      
      if (!response.ok) {
        throw new Error(response_data.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = response_data.data || response_data
      
      if (!data || !data.job_id) {
        throw new Error('Invalid response from server - missing job_id')
      }
      
      track('image_job_submitted', {
        model: params.model,
        width: params.width,
        height: params.height,
        job_id: data.job_id
      })
      
      toast.success('Image generation job submitted!')
      
      // Start polling for job status
      start_polling(data.job_id)
      
      // Set initial job state
      set_current_job({
        job_id: data.job_id,
        status: 'processing',
        progress: 0,
        cost: 0,
        created_at: new Date().toISOString()
      })
      
      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Job submission failed'
      set_error_message(message)
      toast.error(message)
      
      track('image_job_submission_error', {
        error: message,
        model: params.model
      })
      
      return null
    } finally {
      set_is_loading(false)
    }
  }, [start_polling])
  
  const restore_job = useCallback(async (job_id: string) => {
    // Always check job status to get the latest state
    // This helps catch cases where a job might have completed/failed but UI wasn't updated
    const job = await check_job_status(job_id)
    if (job) {
      set_current_job(job)
      
      // If job is still processing or pending, start polling
      // Also start polling for failed jobs in case it was a false error
      if (job.status === 'processing' || job.status === 'pending' || job.status === 'failed') {
        // For failed jobs, do one more status check to see if it actually completed
        if (job.status === 'failed') {
          const updated_job = await check_job_status(job_id)
          if (updated_job && updated_job.status !== 'failed') {
            set_current_job(updated_job)
            // If status changed from failed, reload history
            load_job_history()
          }
        } else {
          start_polling(job_id)
        }
      }
    }
  }, [check_job_status, start_polling, load_job_history])
  
  const clear_error = useCallback(() => {
    set_error_message(null)
  }, [])
  
  const clear_current_job = useCallback(() => {
    set_current_job(null)
    if (polling_interval.current) {
      clearInterval(polling_interval.current)
    }
  }, [])
  
  return {
    is_loading,
    error_message,
    current_job,
    job_history,
    submit_job,
    restore_job,
    clear_error,
    clear_current_job,
    load_job_history
  }
}