'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface VideoJob {
  id: string
  job_id: string
  created_at: string
  completed_at?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prompt: string
  model_id: string
  aspect: string
  duration: number
  video_url?: string
  error?: string
  fal_request_id?: string
  progress?: number
}

interface VideoJobHistoryProps {
  on_job_select?: (job: VideoJob) => void
}

export default function VideoJobHistory({ on_job_select }: VideoJobHistoryProps) {
  const [jobs, set_jobs] = useState<VideoJob[]>([])
  const [loading, set_loading] = useState(true)
  const [restoring_jobs, set_restoring_jobs] = useState<Set<string>>(new Set())
  const [show_history, set_show_history] = useState(false)

  // Fetch job history
  const fetch_history = async () => {
    try {
      const response = await fetch('/api/video-effects/history')
      if (!response.ok) throw new Error('Failed to fetch history')
      
      const data = await response.json()
      set_jobs(data.data.jobs)
    } catch (error) {
      console.error('Failed to fetch job history:', error)
      toast.error('Failed to load job history')
    } finally {
      set_loading(false)
    }
  }

  useEffect(() => {
    if (show_history) {
      fetch_history()
    }
  }, [show_history])

  // Restore a job
  const restore_job = async (job: VideoJob) => {
    if (restoring_jobs.has(job.job_id)) return
    
    set_restoring_jobs(prev => new Set(prev).add(job.job_id))
    
    try {
      const response = await fetch('/api/video-effects/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.job_id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore job')
      }
      
      toast.success(data.data.message || 'Job restored successfully')
      
      // Refresh the job list
      await fetch_history()
      
      // If job was restored with video URL, optionally select it
      if (data.data.video_url && on_job_select) {
        const updated_job = {
          ...job,
          status: data.data.status,
          video_url: data.data.video_url
        }
        on_job_select(updated_job)
      }
    } catch (error) {
      console.error('Failed to restore job:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to restore job')
    } finally {
      set_restoring_jobs(prev => {
        const next = new Set(prev)
        next.delete(job.job_id)
        return next
      })
    }
  }

  // Get status badge color
  const get_status_color = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-success'
      case 'failed': return 'badge-error'
      case 'processing': return 'badge-warning'
      default: return 'badge-ghost'
    }
  }

  // Format date
  const format_date = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, h:mm a')
    } catch {
      return date
    }
  }

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <button
        onClick={() => set_show_history(!show_history)}
        className="btn btn-sm btn-ghost gap-2 mb-4"
      >
        <svg 
          className={`w-4 h-4 transition-transform ${show_history ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Recent Video Jobs (Last 7 Days)
      </button>

      {/* Job History Panel */}
      {show_history && (
        <div className="bg-base-200 rounded-lg p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-base-content/60">
              No video jobs found in the last 7 days
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobs.map((job) => (
                <div 
                  key={job.job_id} 
                  className="bg-base-100 rounded-lg p-4 flex items-center gap-4"
                >
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`badge ${get_status_color(job.status)} badge-sm`}>
                      {job.status}
                    </span>
                  </div>

                  {/* Job Details */}
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">
                      {job.prompt}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {job.model_id} • {job.aspect} • {job.duration}s
                    </p>
                    <p className="text-xs text-base-content/60">
                      {format_date(job.created_at)}
                    </p>
                    {job.error && (
                      <p className="text-xs text-error mt-1">{job.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    {/* View Video Button */}
                    {job.video_url && (
                      <button
                        onClick={() => on_job_select?.(job)}
                        className="btn btn-sm btn-primary"
                        title="View video"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}

                    {/* Restore Button */}
                    {job.fal_request_id && !job.video_url && job.status !== 'completed' && (
                      <button
                        onClick={() => restore_job(job)}
                        disabled={restoring_jobs.has(job.job_id)}
                        className="btn btn-sm btn-ghost"
                        title="Restore job"
                      >
                        {restoring_jobs.has(job.job_id) ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Text */}
          <div className="mt-4 text-xs text-base-content/60">
            <p>• Jobs older than 7 days are automatically deleted</p>
            <p>• Use the restore button to check if incomplete jobs have finished</p>
          </div>
        </div>
      )}
    </div>
  )
}