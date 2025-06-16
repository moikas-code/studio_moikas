"use client"
import React, { useState } from "react"
import { Mail, Shield, Send, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacyContactPage() {
  const [form_data, set_form_data] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    request_type: "general"
  })
  
  const [is_loading, set_is_loading] = useState(false)
  const [success, set_success] = useState(false)
  const [error, set_error] = useState("")

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    set_error("")
    set_is_loading(true)

    try {
      const response = await fetch("/api/contact/privacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form_data)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      set_success(true)
    } catch (err) {
      set_error(err instanceof Error ? err.message : "An error occurred")
    } finally {
      set_is_loading(false)
    }
  }

  const handle_change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    set_form_data(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-xl p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Message Sent</h2>
          <p className="text-base-content/70 mb-6">
            Thank you for contacting us. We&apos;ll respond to your privacy inquiry within 24-48 hours.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Privacy Contact</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Inquiries</h1>
          <p className="text-lg text-base-content/70">
            Contact us about privacy concerns, data requests, or GDPR/CCPA rights
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handle_submit} className="bg-base-100 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Your Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={form_data.name}
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
                name="email"
                value={form_data.email}
                onChange={handle_change}
                required
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Request Type *</span>
            </label>
            <select
              name="request_type"
              value={form_data.request_type}
              onChange={handle_change}
              required
              className="select select-bordered w-full"
            >
              <option value="general">General Privacy Question</option>
              <option value="data_export">Data Export Request (GDPR/CCPA)</option>
              <option value="data_deletion">Data Deletion Request</option>
              <option value="opt_out">Opt-Out Request</option>
              <option value="data_correction">Data Correction Request</option>
              <option value="breach">Data Breach Inquiry</option>
              <option value="other">Other Privacy Concern</option>
            </select>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Subject *</span>
            </label>
            <input
              type="text"
              name="subject"
              value={form_data.subject}
              onChange={handle_change}
              required
              className="input input-bordered w-full"
              placeholder="Brief description of your inquiry"
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Message *</span>
            </label>
            <textarea
              name="message"
              value={form_data.message}
              onChange={handle_change}
              required
              rows={6}
              className="textarea textarea-bordered w-full"
              placeholder="Please provide details about your privacy inquiry..."
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <Mail className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-base-100 rounded-2xl p-6">
          <h3 className="font-semibold mb-2">Response Time</h3>
          <p className="text-sm text-base-content/70">
            We typically respond to privacy inquiries within 24-48 hours. For urgent matters, 
            please indicate this in your message.
          </p>
          <p className="text-sm text-base-content/70 mt-2">
            For general support, contact us on X at{" "}
            <a 
              href="https://x.com/moikas_official" 
              target="_blank" 
              rel="noopener noreferrer"
              className="link link-primary"
            >
              @moikas_official
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}