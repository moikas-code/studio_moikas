"use client";
import React, { useState } from "react";
import { Shield, AlertCircle, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function DMCAClient() {
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
    signature: "",
  });

  const [submitting, set_submitting] = useState(false);
  const [submitted, set_submitted] = useState(false);
  const [error, set_error] = useState("");

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error("");
    set_submitting(true);

    try {
      const response = await fetch("/api/dmca/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form_data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit DMCA notice");
      }

      set_submitted(true);
    } catch {
      set_error("Failed to submit DMCA notice. Please try again.");
    } finally {
      set_submitting(false);
    }
  };

  const handle_change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    set_form_data((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="pt-20 pb-12 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              DMCA Notice Submitted
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Thank you for submitting your DMCA notice. We will review it and respond within 48
              hours.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-jade to-jade-darkdark:text-white font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-jade" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            DMCA Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Digital Millennium Copyright Act Compliance
          </p>
        </div>
      </div>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Overview */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Our Commitment to Copyright Protection
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Studio Moikas respects the intellectual property rights of others and expects our users
            to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will
            respond promptly to claims of copyright infringement on our platform.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            If you believe that your copyrighted work has been copied in a way that constitutes
            copyright infringement, please provide us with a written notice containing the
            information below.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Important Notice
              </h3>
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents
                that material or activity is infringing may be subject to liability for damages.
                Please ensure your claim is valid before submitting.
              </p>
            </div>
          </div>
        </div>

        {/* DMCA Notice Form */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Submit DMCA Notice
          </h2>

          <form onSubmit={handle_submit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="complainant_name"
                    value={form_data.complainant_name}
                    onChange={handle_change}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="complainant_email"
                    value={form_data.complainant_email}
                    onChange={handle_change}
                    required
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mailing Address *
                </label>
                <input
                  type="text"
                  name="complainant_address"
                  value={form_data.complainant_address}
                  onChange={handle_change}
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="complainant_phone"
                  value={form_data.complainant_phone}
                  onChange={handle_change}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                />
              </div>
            </div>

            {/* Copyright Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Copyright Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description of Copyrighted Work *
                </label>
                <textarea
                  name="copyrighted_work"
                  value={form_data.copyrighted_work}
                  onChange={handle_change}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent resize-none"
                  placeholder="Describe the copyrighted work that you claim has been infringed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL of Original Work (if available)
                </label>
                <input
                  type="url"
                  name="original_work_url"
                  value={form_data.original_work_url}
                  onChange={handle_change}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                  placeholder="https://"
                />
              </div>
            </div>

            {/* Infringing Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Allegedly Infringing Content
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL of Infringing Content *
                </label>
                <input
                  type="url"
                  name="infringing_content_url"
                  value={form_data.infringing_content_url}
                  onChange={handle_change}
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                  placeholder="https://studio.moikas.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description of Infringing Content *
                </label>
                <textarea
                  name="infringing_content_description"
                  value={form_data.infringing_content_description}
                  onChange={handle_change}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent resize-none"
                  placeholder="Describe how the content infringes your copyright"
                />
              </div>
            </div>

            {/* Statements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Required Statements
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="good_faith_statement"
                  checked={form_data.good_faith_statement}
                  onChange={handle_change}
                  required
                  className="mt-1"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I have a good faith belief that use of the copyrighted materials described above
                  is not authorized by the copyright owner, its agent, or the law.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="accuracy_statement"
                  checked={form_data.accuracy_statement}
                  onChange={handle_change}
                  required
                  className="mt-1"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I swear, under penalty of perjury, that the information in this notification is
                  accurate and that I am the copyright owner or authorized to act on behalf of the
                  owner of an exclusive right that is allegedly infringed.
                </span>
              </label>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Electronic Signature *
              </label>
              <input
                type="text"
                name="signature"
                value={form_data.signature}
                onChange={handle_change}
                required
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-jade focus:border-transparent"
                placeholder="Type your full name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Typing your full name acts as your electronic signature
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-jade to-jade-darkdark:text-white font-medium rounded-xl shadow-macos hover:shadow-macos-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit DMCA Notice
                </>
              )}
            </button>
          </form>
        </div>

        {/* Counter-Notice Information */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Counter-Notice Procedure
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you believe your content was removed by mistake or misidentification, you may submit
            a counter-notice. Please contact us at{" "}
            <Link href="mailto:dmca@moikas.com" className="text-jade hover:underline">
              dmca@moikas.com
            </Link>{" "}
            with the following information:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="pl-4 relative">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
              Your physical or electronic signature
            </li>
            <li className="pl-4 relative">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
              Identification of the material that has been removed
            </li>
            <li className="pl-4 relative">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />A
              statement under penalty of perjury that you have a good faith belief the material was
              removed by mistake
            </li>
            <li className="pl-4 relative">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
              Your contact information
            </li>
            <li className="pl-4 relative">
              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
              Consent to jurisdiction in your local court
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            DMCA Agent Contact
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Studio Moikas DMCA Agent
            <br />
            Email:{" "}
            <Link href="mailto:dmca@moikas.com" className="text-jade hover:underline">
              dmca@moikas.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
