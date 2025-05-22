"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import React, { useContext } from "react";
import { MpContext } from "../context/mp_context";

/**
 * Navbar component for Studio App.
 * Displays app title and authentication buttons.
 * Uses snake_case for all identifiers.
 */
export default function Navbar({
  on_sidebar_toggle,
  sidebar_open,
}: {
  on_sidebar_toggle?: () => void;
  sidebar_open?: boolean;
}) {
  const { mp_tokens, is_loading_tokens, token_error } = useContext(MpContext);
  return (
    <nav
      className="navbar bg-base-100 shadow-md px-2 md:px-4"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex-1 flex items-center">
        {/* Sidebar toggle button (always visible) */}
        {on_sidebar_toggle && (
          <button
            className="btn btn-ghost btn-square mr-2"
            aria-label={sidebar_open ? "Close sidebar" : "Open sidebar"}
            onClick={on_sidebar_toggle}
          >
            {/* Hamburger icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {sidebar_open ? (
                // X icon
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                // Hamburger icon
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        )}
        <Link
          href="/"
          aria-label="Go to home page"
          className="text-xl font-bold hover:underline focus:underline outline-none"
        >
          Studio.Moikas
        </Link>
      </div>
      <div className="flex-none gap-2">
        <SignedIn>
          <div className="flex items-center gap-3">
            <Link
              href="/buy-tokens"
              className="ml-2 underline text-black-500 hover:text-blue-700 text-xs font-normal"
            >
              <p>Buy more</p>
            </Link>
            {is_loading_tokens ? (
              <span
                className="loading loading-spinner loading-xs"
                aria-label="Loading MP"
                role="status"
              ></span>
            ) : token_error ? (
              <span
                className="text-error text-xs"
                title={token_error}
                aria-live="polite"
              >
                MP: --
              </span>
            ) : (
              <div className="flex flex-row items-center gap-2">
                <span
                  className="font-mono text-xs md:text-sm"
                  title="Your available Mana Points"
                  aria-live="polite"
                >
                  MP: {mp_tokens}
                </span>
              </div>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in">
            <button
              className="btn btn-primary"
              aria-label="Sign in to your account"
            >
              Sign In
            </button>
          </Link>
        </SignedOut>
      </div>
    </nav>
  );
}
