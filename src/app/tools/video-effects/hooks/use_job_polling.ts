import { useState, useEffect, useCallback } from 'react'
import { POLLING_INTERVAL, MAX_POLL_RETRIES } from '../utils/video-constants'
import type { JobStatus } from '../types/video-effects'

export function useJobPolling() {
  const [job_id, set_job_id] = useState<string | null>(null)
  const [status, set_status] = useState<JobStatus | null>(null)
  const [error, set_error] = useState<string>('')
  
  // Load saved job state on mount
  useEffect(() => {
    const saved = localStorage.getItem("jobState")
    try {
      const parsed = saved ? JSON.parse(saved) : null
      if (parsed?.job_id) {
        set_job_id(parsed.job_id)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])
  
  // Persist job state
  useEffect(() => {
    if (job_id && !status?.video_url) {
      localStorage.setItem("jobState", JSON.stringify({ job_id }))
    } else {
      localStorage.removeItem("jobState")
    }
  }, [job_id, status])
  
  // Polling logic
  useEffect(() => {
    if (!job_id) return
    
    let retry_count = 0
    set_error('')
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-effects/status?job_id=${job_id}`)
        
        if (!res.ok) {
          if (res.status === 404) {
            set_error("Job not found. Please try generating a new video.")
            set_job_id(null)
            clearInterval(interval)
            return
          }
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data: JobStatus = await res.json()
        set_status(data)
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
          if (data.status === 'failed') {
            set_error(data.error || 'Video generation failed')
          }
        }
        
        retry_count = 0 // Reset on success
      } catch {
        retry_count++
        if (retry_count >= MAX_POLL_RETRIES) {
          set_error('Failed to check job status. Please try again.')
          clearInterval(interval)
        }
      }
    }, POLLING_INTERVAL)
    
    return () => clearInterval(interval)
  }, [job_id])
  
  const start_job = useCallback((new_job_id: string) => {
    set_job_id(new_job_id)
    set_status(null)
    set_error('')
  }, [])
  
  const clear_job = useCallback(() => {
    set_job_id(null)
    set_status(null)
    set_error('')
    localStorage.removeItem("jobState")
  }, [])
  
  return {
    job_id,
    status,
    error,
    job_in_progress: !!job_id && !status?.video_url,
    start_job,
    clear_job
  }
}