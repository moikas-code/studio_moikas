"use client";

import { BadgeHelp, Star } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { useUser } from "@clerk/nextjs";

/**
 * Sidebar component for Studio App.
 * Uses DaisyUI menu for navigation and extends full height.
 * Only visible when user is signed in (handled in layout).
 */
export default function Sidebar({ open = false, on_close }: { open?: boolean; on_close?: () => void }) {
  const [feedback_open, set_feedback_open] = useState(false);

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
        className={`hidden md:flex min-h-screen w-45 lg:w-64 max-w-full bg-base-200 border-r border-base-300 flex-col z-40 transition-transform duration-200  overflow-y-auto`}
        aria-label="Sidebar navigation"
      >
        {/* Close button for mobile */}
        <div className="flex md:hidden justify-end p-2">
          <button
            className="btn btn-ghost btn-square"
            onClick={on_close}
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className=" border-base-300 p-4" aria-label="Main navigation">
          <ul className="menu menu-xs rounded-box w-full">
            <li>
              <Link
                href="/tools"
                className="justify-start font-bold"
                aria-label="Tools Home"
              >
                <span className="text-base font-medium">Home</span>
              </Link>
            </li>
            {/* Add more tool links here as needed */}
          </ul>
        </nav>
        <div className="p-6 border-b border-base-300">
          <p className="text-sm font-bold tracking-tight text-primary">
            Tools
          </p>
        </div>
        <nav className="flex flec-col p-4" aria-label="Main tools">
          <ul className="menu menu-lg rounded-box w-full">
            <li>
              <Link
                href="/tools/create"
                className="justify-start"
                aria-label="Image Generator tool"
              >
                <span className="text-base font-medium">Create</span>
              </Link>
            </li>
            {/* Add more tool links here as needed */}
          </ul>
        </nav>
        <div className="p-6 border-b border-base-300">
          <p className="text-sm font-bold tracking-tight text-primary">
            Support
          </p>
        </div>
        <nav className="flex flex-col p-4" aria-label="Main tools">
          <ul className="menu menu-lg rounded-box w-full">
            <li>
              <a
                href="https://discord.gg/DnbkrC8"
                className="justify-start"
                aria-label="Community Discord"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("Sidebar Community Clicked", { timestamp: new Date().toISOString() })}
              >
                <span className="flex items-center gap-2">
                  {/* Discord icon */}
                  <Image
                    src="/Discord.svg"
                    alt="Discord"
                    width={24}
                    height={24}
                  />
                  Community
                </span>
              </a>
            </li>
            <li>
              <Link
                href="https://x.com/moikas_official"
                className="justify-start"
                aria-label="Help and News"
                onClick={() => track("Sidebar Help/News Clicked", { timestamp: new Date().toISOString() })}
              >
                <span className="flex items-center gap-2">
                  {/* Question mark icon */}
                  <BadgeHelp />
                  Help/News
                </span>
              </Link>
            </li>
            <li>
              <button
                className="justify-start w-full text-left flex items-center gap-2 btn btn-ghost"
                aria-label="Send Feedback"
                onClick={() => set_feedback_open(true)}
              >
                <Star className="text-yellow-400" />
                Feedback
              </button>
            </li>
            {/* Add more tool links here as needed */}
          </ul>
        </nav>
      </aside>
      <FeedbackMenu open={feedback_open} on_close={() => set_feedback_open(false)} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-base-200 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 btn btn-ghost btn-square"
          onClick={on_close}
          aria-label="Close feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-bold mb-2">Feedback</h2>
        {submitted ? (
          <div className="text-success font-semibold text-center py-6">Thank you for your feedback!</div>
        ) : (
          <form onSubmit={handle_submit} className="flex flex-col gap-4">
            <div className="flex items-center gap-1 justify-center mb-2">
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
                    size={32}
                    className={
                      (hover_rating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-base-400"
                    }
                    fill={(hover_rating || rating) >= star ? "#facc15" : "none"}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-base-300 p-2 text-base resize-none focus:ring-2 focus:ring-primary"
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
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={submitting || !rating || !feedback.trim()}
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 