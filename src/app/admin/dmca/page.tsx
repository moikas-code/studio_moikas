"use client"
import React, { useState, useEffect } from "react"
import { Shield, FileText, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface DMCARequest {
  id: string
  complainant_name: string
  complainant_email: string
  copyrighted_work: string
  original_work_url?: string
  infringing_content_url: string
  infringing_content_description?: string
  status: string
  created_at: string
  reviewed_at?: string
  admin_notes?: string
  rejection_reason?: string
}

export default function AdminDMCAPage() {
  const [requests, set_requests] = useState<DMCARequest[]>([])
  const [selected_request, set_selected_request] = useState<DMCARequest | null>(null)
  const [is_loading, set_is_loading] = useState(true)
  const [error, set_error] = useState("")
  const [action_loading, set_action_loading] = useState(false)
  const [admin_notes, set_admin_notes] = useState("")
  const [rejection_reason, set_rejection_reason] = useState("")

  useEffect(() => {
    fetch_dmca_requests()
  }, [])

  const fetch_dmca_requests = async () => {
    try {
      const response = await fetch("/api/admin/dmca")
      if (!response.ok) throw new Error("Failed to fetch DMCA requests")
      
      const data = await response.json()
      set_requests(data.requests || [])
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Failed to load DMCA requests")
    } finally {
      set_is_loading(false)
    }
  }

  const handle_action = async (action: "accept" | "reject", request_id: string) => {
    set_action_loading(true)
    set_error("")

    try {
      const body: Record<string, unknown> = {
        action,
        admin_notes
      }
      
      if (action === "reject") {
        body.rejection_reason = rejection_reason
      }

      const response = await fetch(`/api/admin/dmca/${request_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error("Failed to process DMCA request")

      // Refresh the list
      await fetch_dmca_requests()
      set_selected_request(null)
      set_admin_notes("")
      set_rejection_reason("")
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Failed to process request")
    } finally {
      set_action_loading(false)
    }
  }

  const get_status_badge = (status: string) => {
    const badges = {
      pending: { color: "badge-warning", icon: Clock },
      reviewing: { color: "badge-info", icon: AlertCircle },
      accepted: { color: "badge-success", icon: CheckCircle },
      rejected: { color: "badge-error", icon: XCircle },
      counter_notice_received: { color: "badge-secondary", icon: FileText },
      resolved: { color: "badge-primary", icon: CheckCircle }
    }

    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <div className={`badge ${badge.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ")}
      </div>
    )
  }

  if (is_loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          DMCA Request Management
        </h1>
        <p className="text-base-content/70">
          Review and process DMCA takedown requests
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Date</th>
                <th>Complainant</th>
                <th>Copyrighted Work</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-base-content/60">
                    No DMCA requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{format(new Date(request.created_at), "MMM d, yyyy")}</td>
                    <td>
                      <div>
                        <div className="font-medium">{request.complainant_name}</div>
                        <div className="text-sm text-base-content/60">{request.complainant_email}</div>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-xs truncate">
                        {request.copyrighted_work}
                      </div>
                    </td>
                    <td>{get_status_badge(request.status)}</td>
                    <td>
                      <button
                        onClick={() => set_selected_request(request)}
                        className="btn btn-sm btn-primary"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selected_request && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Review DMCA Request</h3>
            
            <div className="space-y-4">
              {/* Complainant Info */}
              <div>
                <h4 className="font-semibold mb-2">Complainant Information</h4>
                <div className="bg-base-200 rounded-lg p-4 space-y-1">
                  <p><span className="font-medium">Name:</span> {selected_request.complainant_name}</p>
                  <p><span className="font-medium">Email:</span> {selected_request.complainant_email}</p>
                  <p><span className="font-medium">Submitted:</span> {format(new Date(selected_request.created_at), "PPpp")}</p>
                </div>
              </div>

              {/* Copyright Info */}
              <div>
                <h4 className="font-semibold mb-2">Copyright Information</h4>
                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                  <p><span className="font-medium">Copyrighted Work:</span></p>
                  <p className="text-sm">{selected_request.copyrighted_work}</p>
                  {selected_request.original_work_url && (
                    <p>
                      <span className="font-medium">Original URL:</span>{" "}
                      <a 
                        href={selected_request.original_work_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="link link-primary inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Infringing Content */}
              <div>
                <h4 className="font-semibold mb-2">Reported Content</h4>
                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="font-medium">URL:</span>{" "}
                    <a 
                      href={selected_request.infringing_content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link link-primary inline-flex items-center gap-1"
                    >
                      View Content <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  {selected_request.infringing_content_description && (
                    <>
                      <p className="font-medium">Description:</p>
                      <p className="text-sm">{selected_request.infringing_content_description}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {selected_request.status === "pending" && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Actions</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="label">
                        <span className="label-text">Admin Notes</span>
                      </label>
                      <textarea
                        value={admin_notes}
                        onChange={(e) => set_admin_notes(e.target.value)}
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        placeholder="Internal notes about this request..."
                      />
                    </div>

                    {/* Rejection Reason (shown when rejecting) */}
                    <div className="collapse collapse-arrow bg-base-200">
                      <input type="checkbox" />
                      <div className="collapse-title font-medium">
                        Rejection Options
                      </div>
                      <div className="collapse-content">
                        <label className="label">
                          <span className="label-text">Rejection Reason</span>
                        </label>
                        <textarea
                          value={rejection_reason}
                          onChange={(e) => set_rejection_reason(e.target.value)}
                          className="textarea textarea-bordered w-full"
                          rows={2}
                          placeholder="Reason for rejecting this DMCA request..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  set_selected_request(null)
                  set_admin_notes("")
                  set_rejection_reason("")
                }}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              
              {selected_request.status === "pending" && (
                <>
                  <button
                    onClick={() => handle_action("reject", selected_request.id)}
                    disabled={action_loading || !rejection_reason}
                    className="btn btn-error"
                  >
                    {action_loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handle_action("accept", selected_request.id)}
                    disabled={action_loading}
                    className="btn btn-success"
                  >
                    {action_loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Accept & Takedown
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}