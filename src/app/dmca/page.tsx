"use client"
import React, { useState } from "react"
import { Shield, AlertCircle, FileText, Send, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function DMCAPage() {
  const [form_data, set_form_data] = useState({
    complainant_name: "",
    complainant_email: "",
    complainant_address: "",
    complainant_phone: "",
    copyrighted_work: "",
    original_work_url: "",
    infringing_content_url: "",
    infringing_content_description: "",
    good_faith_statement: false,
    accuracy_statement: false,
    signature: ""
  })
  
  const [is_loading, set_is_loading] = useState(false)
  const [error, set_error] = useState("")
  const [success, set_success] = useState(false)

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    set_error("")
    set_is_loading(true)

    try {
      const response = await fetch("/api/dmca/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form_data)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit DMCA request")
      }

      set_success(true)
    } catch (err) {
      set_error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      set_is_loading(false)
    }
  }

  const handle_change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    set_form_data(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-base-100 rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">DMCA Request Submitted</h2>
            <p className="text-base-content/70 mb-6">
              Your DMCA takedown request has been received and will be reviewed within 48 hours.
              You will receive an email confirmation shortly.
            </p>
            <Link href="/" className="btn btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">DMCA Takedown Request</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Digital Millennium Copyright Act</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            If you believe that content on Studio Moikas infringes your copyright, please complete this form to submit a takedown request.
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Important Notice</h3>
              <p className="text-sm text-base-content/70">
                Knowingly making false claims of copyright infringement may result in legal liability.
                Please ensure all information provided is accurate and that you are the copyright owner or authorized to act on their behalf.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handle_submit} className="bg-base-100 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Complainant Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Your Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <input
                  type="text"
                  name="complainant_name"
                  value={form_data.complainant_name}
                  onChange={handle_change}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Email Address *</span>
                </label>
                <input
                  type="email"
                  name="complainant_email"
                  value={form_data.complainant_email}
                  onChange={handle_change}
                  required
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Mailing Address</span>
                </label>
                <input
                  type="text"
                  name="complainant_address"
                  value={form_data.complainant_address}
                  onChange={handle_change}
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="complainant_phone"
                  value={form_data.complainant_phone}
                  onChange={handle_change}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* Copyright Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Copyright Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Description of Copyrighted Work *</span>
                </label>
                <textarea
                  name="copyrighted_work"
                  value={form_data.copyrighted_work}
                  onChange={handle_change}
                  required
                  rows={3}
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe the copyrighted work that you believe has been infringed"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">URL of Original Work (if applicable)</span>
                </label>
                <input
                  type="url"
                  name="original_work_url"
                  value={form_data.original_work_url}
                  onChange={handle_change}
                  className="input input-bordered w-full"
                  placeholder="https://example.com/original-work"
                />
              </div>
            </div>
          </div>

          {/* Infringing Content */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Infringing Content</h2>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">URL of Infringing Content *</span>
                </label>
                <input
                  type="url"
                  name="infringing_content_url"
                  value={form_data.infringing_content_url}
                  onChange={handle_change}
                  required
                  className="input input-bordered w-full"
                  placeholder="https://studiomoikas.com/..."
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Description of Infringing Content</span>
                </label>
                <textarea
                  name="infringing_content_description"
                  value={form_data.infringing_content_description}
                  onChange={handle_change}
                  rows={3}
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe how the content infringes your copyright"
                />
              </div>
            </div>
          </div>

          {/* Legal Statements */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Legal Statements</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="good_faith_statement"
                  checked={form_data.good_faith_statement}
                  onChange={handle_change}
                  required
                  className="checkbox checkbox-primary mt-0.5"
                />
                <span className="text-sm">
                  I have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law. *
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="accuracy_statement"
                  checked={form_data.accuracy_statement}
                  onChange={handle_change}
                  required
                  className="checkbox checkbox-primary mt-0.5"
                />
                <span className="text-sm">
                  I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner, or am authorized to act on behalf of the owner, of an exclusive right that is allegedly infringed. *
                </span>
              </label>
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className="label">
              <span className="label-text">Electronic Signature *</span>
            </label>
            <input
              type="text"
              name="signature"
              value={form_data.signature}
              onChange={handle_change}
              required
              className="input input-bordered w-full"
              placeholder="Type your full name as your electronic signature"
            />
            <p className="text-sm text-base-content/60 mt-1">
              By typing your name above, you are providing an electronic signature
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/" className="btn btn-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={is_loading}
              className="btn btn-primary"
            >
              {is_loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit DMCA Request
                </>
              )}
            </button>
          </div>
        </form>

        {/* Counter Notice Info */}
        <div className="mt-8 bg-base-100 rounded-2xl p-6">
          <h3 className="font-semibold mb-2">Counter-Notification Process</h3>
          <p className="text-sm text-base-content/70">
            If you believe your content was wrongly removed due to a DMCA takedown, you have the right to submit a counter-notification.
            Please contact us at{" "}
            <Link href="/terms-of-service" className="link link-primary">
              the address listed in our Terms of Service
            </Link>{" "}
            for more information.
          </p>
        </div>
      </div>
    </div>
  )
}