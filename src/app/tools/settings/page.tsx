"use client"
import React, { useState } from "react"
import { Shield, Download, Trash2, AlertCircle, User, Lock, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"

export default function UserSettingsPage() {
  const [active_tab, set_active_tab] = useState("privacy")
  const [is_loading, set_is_loading] = useState(false)
  const [message, set_message] = useState("")
  const [error, set_error] = useState("")
  const [delete_confirmation, set_delete_confirmation] = useState("")

  const handle_data_export = async () => {
    set_is_loading(true)
    set_error("")
    set_message("")

    try {
      const response = await fetch("/api/user/export", {
        method: "GET"
      })

      if (!response.ok) {
        throw new Error("Failed to export data")
      }

      // Get filename from headers or use default
      const content_disposition = response.headers.get("content-disposition")
      const filename_match = content_disposition?.match(/filename="(.+)"/)
      const filename = filename_match ? filename_match[1] : "studio-moikas-data-export.json"

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      set_message("Your data has been downloaded successfully")
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Export failed")
    } finally {
      set_is_loading(false)
    }
  }

  const handle_account_deletion = async () => {
    if (delete_confirmation !== "DELETE MY ACCOUNT") {
      set_error("Please type the confirmation text exactly")
      return
    }

    set_is_loading(true)
    set_error("")
    set_message("")

    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          confirmation: delete_confirmation,
          reason: "User requested deletion"
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account")
      }

      set_message("Account deletion scheduled. You will be logged out shortly.")
      
      // Log out after 3 seconds
      setTimeout(() => {
        window.location.href = "/sign-out"
      }, 3000)
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Deletion failed")
    } finally {
      set_is_loading(false)
    }
  }

  const handle_cancel_deletion = async () => {
    set_is_loading(true)
    set_error("")
    set_message("")

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE"
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel deletion")
      }

      set_message("Account deletion cancelled successfully")
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Cancellation failed")
    } finally {
      set_is_loading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            Account Settings
          </h1>
          <p className="text-base-content/70">
            Manage your account, privacy settings, and data
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-8">
          <a 
            className={`tab ${active_tab === "privacy" ? "tab-active" : ""}`}
            onClick={() => set_active_tab("privacy")}
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy & Data
          </a>
          <a 
            className={`tab ${active_tab === "security" ? "tab-active" : ""}`}
            onClick={() => set_active_tab("security")}
          >
            <Lock className="w-4 h-4 mr-2" />
            Security
          </a>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success mb-6">
            <CheckCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Privacy Tab */}
        {active_tab === "privacy" && (
          <div className="space-y-6">
            {/* Data Export */}
            <div className="bg-base-100 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Export Your Data
              </h2>
              <p className="text-base-content/70 mb-4">
                Download all your data including profile information, generated content metadata, and usage history.
                This is your right under GDPR and CCPA.
              </p>
              <button
                onClick={handle_data_export}
                disabled={is_loading}
                className="btn btn-primary"
              >
                {is_loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Preparing Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download My Data
                  </>
                )}
              </button>
            </div>

            {/* Account Deletion */}
            <div className="bg-base-100 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-error" />
                Delete Account
              </h2>
              <div className="alert alert-warning mb-4">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Warning: This action cannot be undone</p>
                  <p className="text-sm">Your account will be deleted after a 30-day grace period.</p>
                </div>
              </div>
              <p className="text-base-content/70 mb-4">
                Once you request deletion:
              </p>
              <ul className="list-disc list-inside text-base-content/70 mb-4 space-y-1">
                <li>You have 30 days to cancel the deletion request</li>
                <li>All your data will be permanently deleted after the grace period</li>
                <li>You will lose access to all generated content</li>
                <li>Any remaining tokens will be forfeited</li>
              </ul>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Type &quot;DELETE MY ACCOUNT&quot; to confirm</span>
                  </label>
                  <input
                    type="text"
                    value={delete_confirmation}
                    onChange={(e) => set_delete_confirmation(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handle_account_deletion}
                    disabled={is_loading || delete_confirmation !== "DELETE MY ACCOUNT"}
                    className="btn btn-error"
                  >
                    {is_loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                      </>
                    ) : (
                      "Delete My Account"
                    )}
                  </button>
                  
                  <button
                    onClick={handle_cancel_deletion}
                    disabled={is_loading}
                    className="btn btn-ghost"
                  >
                    Cancel Deletion Request
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Rights */}
            <div className="bg-base-100 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Your Privacy Rights</h2>
              <div className="space-y-3">
                <Link href="/contact/privacy" className="btn btn-outline btn-block justify-start">
                  <Shield className="w-4 h-4" />
                  Submit Privacy Request
                </Link>
                <Link href="/privacy-policy" className="btn btn-outline btn-block justify-start">
                  <FileText className="w-4 h-4" />
                  View Privacy Policy
                </Link>
                <Link href="/terms-of-service" className="btn btn-outline btn-block justify-start">
                  <FileText className="w-4 h-4" />
                  View Terms of Service
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {active_tab === "security" && (
          <div className="space-y-6">
            <div className="bg-base-100 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              <p className="text-base-content/70 mb-4">
                Your account security is managed through Clerk, our authentication provider.
              </p>
              <a
                href="https://accounts.studiomoikas.com/user"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Manage Security Settings
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}