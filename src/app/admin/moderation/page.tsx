'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface ModerationLog {
  id: string
  user_id: string
  prompt: string
  safe: boolean
  violations: string[]
  confidence: number
  false_positive_reported: boolean
  false_positive_reviewed: boolean
  false_positive_notes: string | null
  created_at: string
  user?: {
    email: string
    first_name: string
    last_name: string
  }
}

interface ModerationStats {
  total_checks: number
  total_blocked: number
  block_rate: number
  false_positive_reports: number
  false_positive_rate: number
  violations_breakdown: Record<string, number>
  daily_stats: Array<{
    date: string
    total: number
    blocked: number
  }>
}

export default function AdminModerationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [logs, setLogs] = useState<ModerationLog[]>([])
  const [filter, setFilter] = useState<'all' | 'blocked' | 'false_positives'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    check_admin_and_load_data()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function check_admin_and_load_data() {
    try {
      const response = await fetch('/api/auth/admin')
      if (!response.ok) {
        router.push('/')
        return
      }
      
      await Promise.all([
        load_stats(),
        load_logs()
      ])
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  async function load_stats() {
    try {
      const response = await fetch('/api/admin/moderation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading moderation stats:', error)
    }
  }

  async function load_logs() {
    try {
      const response = await fetch('/api/admin/moderation/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error loading moderation logs:', error)
    }
  }

  async function handle_review_false_positive(log_id: string) {
    try {
      const response = await fetch(`/api/admin/moderation/logs/${log_id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (response.ok) {
        await load_logs()
        setSelectedLog(null)
        setReviewNotes('')
      }
    } catch (error) {
      console.error('Error reviewing false positive:', error)
    }
  }

  const filtered_logs = logs.filter(log => {
    if (filter === 'blocked' && log.safe) return false
    if (filter === 'false_positives' && !log.false_positive_reported) return false
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        log.prompt.toLowerCase().includes(search) ||
        log.user?.email?.toLowerCase().includes(search) ||
        log.violations.some(v => v.toLowerCase().includes(search))
      )
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Content Moderation Dashboard</h1>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Total Checks</div>
            <div className="stat-value">{stats.total_checks.toLocaleString()}</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Blocked</div>
            <div className="stat-value text-error">{stats.total_blocked.toLocaleString()}</div>
            <div className="stat-desc">{stats.block_rate.toFixed(1)}% block rate</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">False Positives</div>
            <div className="stat-value text-warning">{stats.false_positive_reports}</div>
            <div className="stat-desc">{stats.false_positive_rate.toFixed(1)}% of blocked</div>
          </div>

          <div className="stat bg-base-200 rounded-lg col-span-2">
            <div className="stat-title">Top Violations</div>
            <div className="stat-desc">
              {Object.entries(stats.violations_breakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([violation, count]) => (
                  <div key={violation} className="flex justify-between">
                    <span>{violation}:</span>
                    <span>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="join">
          <button 
            className={`btn join-item ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            All Logs
          </button>
          <button 
            className={`btn join-item ${filter === 'blocked' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('blocked')}
          >
            Blocked Only
          </button>
          <button 
            className={`btn join-item ${filter === 'false_positives' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('false_positives')}
          >
            False Positives
          </button>
        </div>

        <input
          type="text"
          placeholder="Search prompts, users, or violations..."
          className="input input-bordered flex-1 max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Prompt</th>
              <th>Status</th>
              <th>Violations</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered_logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap">
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                </td>
                <td>
                  <div className="text-sm">
                    {log.user?.email || 'Unknown'}
                  </div>
                </td>
                <td>
                  <div className="max-w-xs truncate" title={log.prompt}>
                    {log.prompt}
                  </div>
                </td>
                <td>
                  {log.safe ? (
                    <span className="badge badge-success">Safe</span>
                  ) : (
                    <span className="badge badge-error">Blocked</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {log.violations.map((v, i) => (
                      <span key={i} className="badge badge-sm badge-warning">
                        {v}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    {(log.confidence * 100).toFixed(0)}%
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => setSelectedLog(log)}
                    >
                      View
                    </button>
                    {log.false_positive_reported && !log.false_positive_reviewed && (
                      <button
                        className="btn btn-xs btn-warning"
                        onClick={() => setSelectedLog(log)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Moderation Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Prompt:</label>
                <p className="mt-1 p-3 bg-base-200 rounded">{selectedLog.prompt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Status:</label>
                  <p className="mt-1">
                    {selectedLog.safe ? 
                      <span className="badge badge-success">Safe</span> : 
                      <span className="badge badge-error">Blocked</span>
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Confidence:</label>
                  <p className="mt-1">{(selectedLog.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {selectedLog.violations.length > 0 && (
                <div>
                  <label className="text-sm font-semibold">Violations:</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedLog.violations.map((v, i) => (
                      <span key={i} className="badge badge-warning">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.false_positive_reported && (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>User reported this as a false positive</span>
                </div>
              )}

              {selectedLog.false_positive_reviewed && selectedLog.false_positive_notes && (
                <div>
                  <label className="text-sm font-semibold">Review Notes:</label>
                  <p className="mt-1 p-3 bg-base-200 rounded">{selectedLog.false_positive_notes}</p>
                </div>
              )}

              {selectedLog.false_positive_reported && !selectedLog.false_positive_reviewed && (
                <div>
                  <label className="text-sm font-semibold">Add Review Notes:</label>
                  <textarea
                    className="textarea textarea-bordered w-full mt-1"
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this false positive review..."
                  />
                </div>
              )}
            </div>

            <div className="modal-action">
              {selectedLog.false_positive_reported && !selectedLog.false_positive_reviewed && (
                <button 
                  className="btn btn-warning"
                  onClick={() => handle_review_false_positive(selectedLog.id)}
                >
                  Mark as Reviewed
                </button>
              )}
              <button 
                className="btn"
                onClick={() => {
                  setSelectedLog(null)
                  setReviewNotes('')
                }}
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => {
              setSelectedLog(null)
              setReviewNotes('')
            }}>close</button>
          </form>
        </dialog>
      )}
    </div>
  )
}