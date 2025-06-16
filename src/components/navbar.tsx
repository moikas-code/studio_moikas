"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import React, { useContext } from "react";
import { MpContext } from "../context/mp_context";
import { useAdminStatus } from "@/hooks/use_admin_status";

/**
 * Navbar component for Studio App.
 * Displays app title and authentication buttons.
 * Uses snake_case for all identifiers.
 */
export default function Navbar() {
  const { mp_tokens, is_loading_tokens, token_error } = useContext(MpContext);
  const { is_admin } = useAdminStatus();
  
  return (
    <nav
      className="navbar bg-base-100 shadow-md px-4 md:px-6"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex-1 flex items-center">
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
            {is_admin && (
              <Link
                href="/admin"
                className="btn btn-sm btn-outline btn-primary"
              >
                Admin
              </Link>
            )}
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
                  MP: {mp_tokens ?? 0}
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
