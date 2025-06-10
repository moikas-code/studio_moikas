import { useState, useEffect, useCallback, useRef } from 'react'

const POLLING_INTERVAL = 2000 // 15 seconds
const MAX_POLLING_DURATION = 5 * 60 * 1000 // 5 minutes

interface AudioJob {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  audio_url?: string
  error?: string
  created_at: string
  completed_at?: string
  metadata?: Record<string, unknown>
}

interface UseJobPollingOptions {
  onComplete?: (audio_url: string) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
}

export function useJobPolling(options: UseJobPollingOptions = {}) {
  const [current_job, set_current_job] = useState<AudioJob | null>(null)
  const [is_polling, set_is_polling] = useState(false)
  const polling_ref = useRef<NodeJS.Timeout | null>(null)
  const start_time_ref = useRef<number | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (polling_ref.current) {
        clearTimeout(polling_ref.current)
      }
    }
  }, [])

  const check_job_status = useCallback(async (job_id: string) => {
    try {
      const response = await fetch(`/api/audio/status?job_id=${job_id}`)
      
      if (!response.ok) {
        throw new Error('Failed to check job status')
      }

      const data = await response.json()
      const job = data.data as AudioJob
      
      set_current_job(job)

      // Handle progress updates
      if (job.progress !== undefined && options.onProgress) {
        options.onProgress(job.progress)
      }

      // Handle completion
      if (job.status === 'completed' && job.audio_url) {
        set_is_polling(false)
        if (polling_ref.current) {
          clearTimeout(polling_ref.current)
          polling_ref.current = null
        }
        if (options.onComplete) {
          options.onComplete(job.audio_url)
        }
        // Clear job from localStorage
        localStorage.removeItem('audio_job_id')
        return true
      }

      // Handle failure
      if (job.status === 'failed') {
        set_is_polling(false)
        if (polling_ref.current) {
          clearTimeout(polling_ref.current)
          polling_ref.current = null
        }
        if (options.onError) {
          options.onError(job.error || 'Audio generation failed')
        }
        // Clear job from localStorage
        localStorage.removeItem('audio_job_id')
        return true
      }

      // Check timeout
      if (start_time_ref.current) {
        const elapsed = Date.now() - start_time_ref.current
        if (elapsed > MAX_POLLING_DURATION) {
          set_is_polling(false)
          if (polling_ref.current) {
            clearTimeout(polling_ref.current)
            polling_ref.current = null
          }
          if (options.onError) {
            options.onError('Audio generation timed out')
          }
          // Clear job from localStorage
          localStorage.removeItem('audio_job_id')
          return true
        }
      }

      return false // Continue polling
    } catch (error) {
      console.error('Error checking job status:', error)
      // Continue polling on error
      return false
    }
  }, [options])

  const poll_job = useCallback((job_id: string) => {
    const poll = async () => {
      const is_done = await check_job_status(job_id)
      
      if (!is_done) {
        polling_ref.current = setTimeout(poll, POLLING_INTERVAL)
      }
    }

    // Initial check
    poll()
  }, [check_job_status])

  const start_polling = useCallback((job_id: string) => {
    // Clear any existing polling
    if (polling_ref.current) {
      clearTimeout(polling_ref.current)
    }

    // Store job ID in localStorage for recovery
    localStorage.setItem('audio_job_id', job_id)

    set_is_polling(true)
    start_time_ref.current = Date.now()
    poll_job(job_id)
  }, [poll_job])

  const stop_polling = useCallback(() => {
    set_is_polling(false)
    if (polling_ref.current) {
      clearTimeout(polling_ref.current)
      polling_ref.current = null
    }
    // Clear job from localStorage
    localStorage.removeItem('audio_job_id')
    set_current_job(null)
  }, [])

  // Check for existing job on mount
  useEffect(() => {
    const stored_job_id = localStorage.getItem('audio_job_id')
    if (stored_job_id) {
      start_polling(stored_job_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - start_polling is stable

  return {
    current_job,
    is_polling,
    start_polling,
    stop_polling
  }
}