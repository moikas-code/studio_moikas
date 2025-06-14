'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, RefreshCw, Search, Filter, Download, Eye, XCircle, CheckCircle, Clock } from 'lucide-react'

interface Job {
  id: string
  job_id: string
  user_id: string
  user_email?: string
  type: 'image' | 'video' | 'audio'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  model: string
  cost: number
  created_at: string
  completed_at?: string
  error?: string
  progress: number
  metadata?: Record<string, unknown>
  // Type-specific fields
  prompt?: string // image/video
  image_url?: string // image
  video_url?: string // video
  audio_url?: string // audio
  image_size?: string // image
  aspect_ratio?: string // video
}

export default function AdminJobsPage() {
  const router = useRouter()
  const [jobs, set_jobs] = useState<Job[]>([])
  const [loading, set_loading] = useState(true)
  const [filter_type, set_filter_type] = useState<'all' | 'image' | 'video' | 'audio'>('all')
  const [filter_status, set_filter_status] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all')
  const [search_query, set_search_query] = useState('')
  const [page, set_page] = useState(0)
  const [total_count, set_total_count] = useState(0)
  const [selected_job, set_selected_job] = useState<Job | null>(null)
  
  const page_size = 50
  
  const fetch_jobs = useCallback(async () => {
    try {
      set_loading(true)
      
      const params = new URLSearchParams({
        limit: page_size.toString(),
        offset: (page * page_size).toString()
      })
      
      if (filter_type !== 'all') {
        params.append('type', filter_type)
      }
      if (filter_status !== 'all') {
        params.append('status', filter_status)
      }
      if (search_query) {
        params.append('search', search_query)
      }
      
      const response = await fetch(`/api/admin/jobs?${params}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in')
          return
        }
        throw new Error('Failed to fetch jobs')
      }
      
      const data = await response.json()
      set_jobs(data.data?.jobs || [])
      set_total_count(data.data?.total || 0)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      set_loading(false)
    }
  }, [page, filter_type, filter_status, search_query, router])
  
  useEffect(() => {
    fetch_jobs()
  }, [fetch_jobs])
  
  const get_status_icon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }
  
  const get_status_color = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'processing':
      case 'pending':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  
  const format_date = (date_string: string) => {
    return new Date(date_string).toLocaleString()
  }
  
  const handle_export = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv'
      })
      
      if (filter_type !== 'all') {
        params.append('type', filter_type)
      }
      if (filter_status !== 'all') {
        params.append('status', filter_status)
      }
      if (search_query) {
        params.append('search', search_query)
      }
      
      const response = await fetch(`/api/admin/jobs/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to export jobs')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Jobs exported successfully')
    } catch (error) {
      console.error('Error exporting jobs:', error)
      toast.error('Failed to export jobs')
    }
  }
  
  const handle_retry_job = async (job: Job) => {
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/retry`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to retry job')
      }
      
      toast.success('Job retry initiated')
      fetch_jobs()
    } catch (error) {
      console.error('Error retrying job:', error)
      toast.error('Failed to retry job')
    }
  }
  
  const handle_cancel_job = async (job: Job) => {
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}/cancel`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel job')
      }
      
      toast.success('Job cancelled')
      fetch_jobs()
    } catch (error) {
      console.error('Error cancelling job:', error)
      toast.error('Failed to cancel job')
    }
  }
  
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-base-content/60">Monitor and manage all generation jobs</p>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <select
              value={filter_type}
              onChange={(e) => {
                set_filter_type(e.target.value as typeof filter_type)
                set_page(0)
              }}
              className="select select-bordered"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={filter_status}
              onChange={(e) => {
                set_filter_status(e.target.value as typeof filter_status)
                set_page(0)
              }}
              className="select select-bordered"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by job ID, user email, or prompt..."
                value={search_query}
                onChange={(e) => {
                  set_search_query(e.target.value)
                  set_page(0)
                }}
                className="input input-bordered w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={fetch_jobs}
                className="btn btn-ghost btn-sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handle_export}
                className="btn btn-ghost btn-sm"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Jobs Table */}
        <div className="bg-base-200 rounded-lg overflow-hidden">
          {loading && jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-base-content/60">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-base-content/60">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>User</th>
                    <th>Model</th>
                    <th>Cost</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover">
                      <td>
                        <div className="badge badge-ghost">
                          {job.type}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {get_status_icon(job.status)}
                          <span className={get_status_color(job.status)}>
                            {job.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{job.user_email || 'Unknown'}</div>
                          <div className="text-xs text-base-content/60">{job.user_id}</div>
                        </div>
                      </td>
                      <td className="text-sm">{job.model}</td>
                      <td className="text-sm">{job.cost} MP</td>
                      <td className="text-sm">{format_date(job.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => set_selected_job(job)}
                            className="btn btn-ghost btn-xs"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {job.status === 'failed' && (
                            <button
                              onClick={() => handle_retry_job(job)}
                              className="btn btn-ghost btn-xs"
                              title="Retry job"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {(job.status === 'pending' || job.status === 'processing') && (
                            <button
                              onClick={() => handle_cancel_job(job)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Cancel job"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {total_count > page_size && (
          <div className="flex justify-center mt-6">
            <div className="join">
              <button
                className="join-item btn"
                disabled={page === 0}
                onClick={() => set_page(p => p - 1)}
              >
                «
              </button>
              <button className="join-item btn">
                Page {page + 1} of {Math.ceil(total_count / page_size)}
              </button>
              <button
                className="join-item btn"
                disabled={page >= Math.ceil(total_count / page_size) - 1}
                onClick={() => set_page(p => p + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
        
        {/* Job Details Modal */}
        {selected_job && (
          <dialog className="modal modal-open">
            <div className="modal-box max-w-3xl">
              <h3 className="font-bold text-lg mb-4">Job Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">Job ID</p>
                    <p className="font-mono text-sm">{selected_job.job_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Type</p>
                    <p className="capitalize">{selected_job.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Status</p>
                    <div className="flex items-center gap-2">
                      {get_status_icon(selected_job.status)}
                      <span className={get_status_color(selected_job.status)}>
                        {selected_job.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/60">Progress</p>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={selected_job.progress} 
                      max="100"
                    />
                  </div>
                </div>
                
                {selected_job.prompt && (
                  <div>
                    <p className="text-sm text-base-content/60">Prompt</p>
                    <p className="text-sm bg-base-300 p-3 rounded">{selected_job.prompt}</p>
                  </div>
                )}
                
                {selected_job.error && (
                  <div>
                    <p className="text-sm text-base-content/60">Error</p>
                    <p className="text-sm text-error bg-error/10 p-3 rounded">{selected_job.error}</p>
                  </div>
                )}
                
                {selected_job.metadata && (
                  <div>
                    <p className="text-sm text-base-content/60">Metadata</p>
                    <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selected_job.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="modal-action">
                <button
                  onClick={() => set_selected_job(null)}
                  className="btn"
                >
                  Close
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => set_selected_job(null)}>close</button>
            </form>
          </dialog>
        )}
      </div>
    </div>
  )
}