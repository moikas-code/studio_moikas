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
export default function Navbar() {
  const { mp_tokens, is_loading_tokens, token_error } = useContext(MpContext);
  return (
    <nav className="navbar bg-base-100 shadow-md px-4" role="navigation" aria-label="Main navigation">
      <div className="flex-1">
        <Link href="/" aria-label="Go to home page" className="text-xl font-bold hover:underline focus:underline outline-none">
          Studio.Moikas
        </Link>
      </div>
      <div className="flex-none gap-2">
        <SignedIn>
          <div className="flex items-center gap-3">
            {is_loading_tokens ? (
              <span className="loading loading-spinner loading-xs" aria-label="Loading MP" role="status"></span>
            ) : token_error ? (
              <span className="text-error text-xs" title={token_error} aria-live="polite">MP: --</span>
            ) : (
              <span className="font-mono text-xs md:text-sm" title="Your available Mana Points" aria-live="polite">MP: {mp_tokens}</span>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in">
            <button className="btn btn-primary" aria-label="Sign in to your account">Sign In</button>
          </Link>
        </SignedOut>
      </div>
    </nav>
  );
} 