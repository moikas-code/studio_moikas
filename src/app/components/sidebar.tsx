"use client";

import { Bell, Star, ChevronLeft, ChevronRight, Home, Image as ImageIcon, Edit, FileText, Video, MessageSquare, Bug } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";

/**
 * Sidebar component for Studio App.
 * Uses DaisyUI menu for navigation and extends full height.
 * Only visible when user is signed in (handled in layout).
 */
export default function Sidebar({ open = false, on_close }: { open?: boolean; on_close?: () => void }) {
  const [feedback_open, set_feedback_open] = useState(false);
  const [report_bug_open, set_report_bug_open] = useState(false);
  const [is_minimized, set_is_minimized] = useState(false);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed h-screen inset-0 bg-black bg-opacity-40 z-30 hidden transition-opacity duration-200 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={on_close}
        aria-hidden={!open}
      />
      <aside
        className={`hidden md:flex flex-col justify-between min-h-screen ${is_minimized ? 'w-16' : 'w-64'} max-w-full bg-base-200 border-r border-base-300 flex-col z-40 transition-all duration-200 overflow-y-auto`}
        aria-label="Sidebar navigation"
      >
        <div className="p-3 border-b border-base-300">
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-medium text-center p-4 font-mono ${is_minimized ? 'hidden' : 'block'}`}>
              Studio Moikas
            </h2>
            <button
              onClick={() => set_is_minimized(!is_minimized)}
              className="btn btn-ghost btn-sm"
              aria-label={is_minimized ? "Expand sidebar" : "Minimize sidebar"}
            >
              {is_minimized ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
          <nav className={`border-base-300 ${is_minimized ? 'py-2' : 'p-4'}`} aria-label="Main navigation">
            <ul className={`menu menu-xs rounded-box w-full ${is_minimized ? '[&_a]:!px-2' : ''}`}>
              <li>
                <Link
                  href="/tools"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} font-bold flex items-center gap-2`}
                  aria-label="Tools Home"
                  title={is_minimized ? "Home" : undefined}
                >
                  <Home className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium whitespace-nowrap">Home</span>}
                </Link>
              </li>
              {/* Add more tool links here as needed */}
            </ul>
          </nav>
          <div className={`${is_minimized ? 'py-2' : 'p-6'} border-b border-base-300`}>
            {!is_minimized && (
              <p className="text-sm font-bold tracking-tight text-primary">
                Tools
              </p>
            )}
          </div>
          <nav className={`flex flex-col ${is_minimized ? 'py-2' : 'p-4'}`} aria-label="Main tools">
            <ul className={`menu ${is_minimized ? 'menu-sm' : 'menu-lg'} rounded-box w-full ${is_minimized ? '[&_a]:!px-2' : ''}`}>
              <li>
                <Link
                  href="/tools/chat"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center gap-2`}
                  aria-label="Chat tool"
                  title={is_minimized ? "Chat" : undefined}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium text-md whitespace-nowrap">MEMU</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/create"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center gap-2`}
                  aria-label="Image Generator tool"
                  title={is_minimized ? "Create" : undefined}
                >
                  <ImageIcon className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium text-md whitespace-nowrap">Create</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/image-editor"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center gap-2`}
                  aria-label="Image Editor tool"
                  title={is_minimized ? "Image Editor" : undefined}
                >
                  <Edit className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium text-md whitespace-nowrap">Image Editor</span>}
                </Link>
              </li>
              {/* Add more tool links here as needed */}
              <li>
                <Link
                  href="/tools/text-analyzer"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center gap-2`}
                  aria-label="Text Analyzer tool"
                  title={is_minimized ? "Text Analyzer" : undefined}
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium text-md whitespace-nowrap">Text Analyzer</span>}
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/video-effects"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center gap-2`}
                  aria-label="Video Generator tool"
                  title={is_minimized ? "Video Generator" : undefined}
                >
                  <Video className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="text-base font-medium text-md whitespace-nowrap">Video Generator</span>}
                </Link>
              </li>
            </ul>
          </nav>
          <div className={`${is_minimized ? 'p-2' : 'p-6'} border-b border-base-300`}>
            {!is_minimized && (
              <p className="text-sm font-bold tracking-tight text-primary">
                Support
              </p>
            )}
          </div>
          <nav className={`flex flex-col ${is_minimized ? 'hidden' : 'p-4'}`} aria-label="Support tools">
           < ul className={`menu ${is_minimized ? 'menu-sm' : 'menu-lg'} rounded-box w-full ${is_minimized ? '[&_a]:!px-2' : ''}`}>
              <li>
                <a
                  href="https://discord.gg/DnbkrC8"
                  className={`${is_minimized ? 'justify-center mb-4' : 'justify-start'} flex items-center`}
                  aria-label="Community Discord"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("Sidebar Community Clicked", {
                      timestamp: new Date().toISOString(),
                    })
                  }
                >
                  <span className="flex items-center gap-2 text-md" title={is_minimized ? "Community" : undefined}>
                    {/* Discord icon */}
                    <Image
                      src="/Discord.svg"
                      alt="Discord"
                      width={!is_minimized?24:18}
                      height={!is_minimized?24:18}
                    />
                    {!is_minimized && "Community"}
                  </span>
                </a>
              </li>
              <li>
                <Link
                  href="https://x.com/moikas_official"
                  className={`${is_minimized ? 'justify-center' : 'justify-start'} flex items-center`}
                  aria-label="Help and News"
                  onClick={() =>
                    track("Sidebar Help/News Clicked", {
                      timestamp: new Date().toISOString(),
                    })
                  }
                >
                  <span className="flex items-center gap-2 text-md" title={is_minimized ? "News" : undefined}>
                    <Bell className="w-5 h-5 flex-shrink-0" />
                    {!is_minimized && <span className="whitespace-nowrap">News</span>}
                  </span>
                </Link>
              </li>
              <li>
                <button
                  className={`w-full text-left rounded text-md px-4 py-2 font-medium bg-base hover:bg-base-100 transition-colors duration-150 flex items-center gap-2 ${is_minimized ? 'justify-center' : ''}`}
                  aria-label="Send Feedback"
                  onClick={() => set_feedback_open(true)}
                  title={is_minimized ? "Feedback" : undefined}
                >
                  <Star className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="whitespace-nowrap">Feedback</span>}
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left rounded text-md px-4 py-2 font-medium bg-base hover:bg-base-100 transition-colors duration-150 flex items-center gap-2 ${is_minimized ? 'justify-center' : ''}`}
                  aria-label="Report Bug"
                  onClick={() => set_report_bug_open(true)}
                  title={is_minimized ? "Report Bug" : undefined}
                >
                  <Bug className="w-5 h-5 flex-shrink-0" />
                  {!is_minimized && <span className="whitespace-nowrap">Report Bug</span>}
                </button>
              </li>
              {/* Add more tool links here as needed */}
            </ul>
          </nav>
        </div>
        <div className={`${is_minimized ? 'p-2' : 'p-6'} flex justify-center border-b border-base-300`}>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </aside>
      <FeedbackMenu
        open={feedback_open}
        on_close={() => set_feedback_open(false)}
      />
      <ReportBugMenu
        open={report_bug_open}
        on_close={() => set_report_bug_open(false)}
      />
    </>
  );
}

// FeedbackMenu component
function FeedbackMenu({ open, on_close }: { open: boolean; on_close: () => void }) {
  const { user } = useUser();
  const [rating, set_rating] = useState(0);
  const [hover_rating, set_hover_rating] = useState(0);
  const [feedback, set_feedback] = useState("");
  const [submitting, set_submitting] = useState(false);
  const [submitted, set_submitted] = useState(false);
  const [error, set_error] = useState("");
  const max_length = 500;
  const username = user?.username || user?.firstName || user?.lastName || user?.emailAddresses?.[0]?.emailAddress || "User";

  // Reset form state when modal is closed
  React.useEffect(() => {
    if (!open) {
      set_rating(0);
      set_hover_rating(0);
      set_feedback("");
      set_submitting(false);
      set_submitted(false);
      set_error("");
    }
  }, [open]);

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_submitting(true);
    set_error("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback, username }),
      });
      if (!res.ok) {
        const data = await res.json();
        set_error(data.error || "Failed to submit feedback");
      } else {
        set_submitted(true);
      }
    } catch {
      set_error("Network error");
    } finally {
      set_submitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/30">
      <div className="z-55 bg-base-100 rounded-lg shadow-xl p-0 w-full max-w-[600px] relative border border-base-300">
        <button
          className="absolute top-3 right-3 text-base-400 hover:text-base-600 focus:outline-none transition-colors duration-150 cursor-pointer"
          onClick={on_close}
          aria-label="Close feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-xl font-semibold mb-1">Leave Feedback</h2>
          <p className="text-base text-base-500 mb-4">We&apos;d love to hear what went well or how we can improve the product experience.</p>
          {submitted ? (
            <div className="text-success font-semibold text-center py-6">Thank you for your feedback!</div>
          ) : (
            <form onSubmit={handle_submit} className="flex flex-col gap-4">
              <textarea
                className="w-full min-h-[80px] rounded border border-base-300 p-2 text-base resize-none focus:ring-2 focus:ring-primary bg-base-50"
                maxLength={max_length}
                value={feedback}
                onChange={e => set_feedback(e.target.value)}
                placeholder="Your feedback (max 500 characters)"
                required
                aria-label="Feedback text"
                disabled={submitting}
              />
              <div className="flex justify-between text-xs text-base-400">
                <span>{username}</span>
                <span>{feedback.length}/{max_length}</span>
              </div>
              {error && <div className="text-error text-sm">{error}</div>}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => set_rating(star)}
                      onMouseEnter={() => set_hover_rating(star)}
                      onMouseLeave={() => set_hover_rating(0)}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      className="focus:outline-none"
                    >
                      <Star
                        size={28}
                        className={
                          (hover_rating || rating) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-base-300"
                        }
                        fill={(hover_rating || rating) >= star ? "#facc15" : "#fff"}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost border border-base-300 px-4 py-2 rounded font-medium"
                    onClick={on_close}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded font-medium"
                    disabled={submitting || !rating || !feedback.trim()}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ReportBugMenu component
function ReportBugMenu({ open, on_close }: { open: boolean; on_close: () => void }) {
  const { user } = useUser();
  const [category, set_category] = useState("");
  const [description, set_description] = useState("");
  const [submitting, set_submitting] = useState(false);
  const [submitted, set_submitted] = useState(false);
  const [error, set_error] = useState("");
  const max_length = 500;
  const username = user?.username || user?.firstName || user?.lastName || user?.emailAddresses?.[0]?.emailAddress || "User";
  const categories = [
    "UI Issue",
    "Performance",
    "Crash",
    "Data Loss",
    "Other"
  ];

  // Reset form state when modal is closed
  React.useEffect(() => {
    if (!open) {
      set_category("");
      set_description("");
      set_submitting(false);
      set_submitted(false);
      set_error("");
    }
  }, [open]);

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_submitting(true);
    set_error("");
    try {
      const res = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description, username }),
      });
      if (!res.ok) {
        const data = await res.json();
        set_error(data.error || "Failed to submit bug report");
      } else {
        set_submitted(true);
      }
    } catch {
      set_error("Network error");
    } finally {
      set_submitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/30">
      <div className="z-55 bg-base-100 rounded-lg shadow-xl p-0 w-full max-w-[600px] relative border border-base-300">
        <button
          className="absolute top-3 right-3 text-base-400 hover:text-base-600 focus:outline-none transition-colors duration-150 cursor-pointer"
          onClick={on_close}
          aria-label="Close bug report"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-8 pt-8 pb-6">
          <h2 className="text-xl font-semibold mb-1">Report a Bug</h2>
          <p className="text-base text-base-500 mb-4">Help us improve by reporting any issues you encounter. Please select a category and describe the problem.</p>
          {submitted ? (
            <div className="text-success font-semibold text-center py-6">Thank you for your bug report!</div>
          ) : (
            <form onSubmit={handle_submit} className="flex flex-col gap-4">
              <select
                className="w-full rounded border border-base-300 p-2 text-base bg-base-50 focus:ring-2 focus:ring-primary"
                value={category}
                onChange={e => set_category(e.target.value)}
                required
                aria-label="Bug category"
                disabled={submitting}
              >
                <option value="" disabled>Select a category</option>
                {categories.map(opt => (
                  <option key={opt} value={opt} className="dark:text-base-100">{opt}</option>
                ))}
              </select>
              <textarea
                className="w-full min-h-[80px] rounded border border-base-300 p-2 text-base resize-none focus:ring-2 focus:ring-primary bg-base-50"
                maxLength={max_length}
                value={description}
                onChange={e => set_description(e.target.value)}
                placeholder="Describe the bug (max 500 characters)"
                required
                aria-label="Bug description"
                disabled={submitting}
              />
              <div className="flex justify-between text-xs text-base-400">
                <span>{username}</span>
                <span>{description.length}/{max_length}</span>
              </div>
              {error && <div className="text-error text-sm">{error}</div>}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost border border-base-300 px-4 py-2 rounded font-medium"
                  onClick={on_close}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2 rounded font-medium"
                  disabled={submitting || !category || !description.trim()}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 