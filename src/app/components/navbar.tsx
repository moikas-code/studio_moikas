"use client";

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import React from "react";

/**
 * Navbar component for Studio App.
 * Displays app title and authentication buttons.
 * Uses snake_case for all identifiers.
 */
export default function Navbar() {
  return (
    <nav className="navbar bg-base-100 shadow-md px-4">
      <div className="flex-1">
        <Link href="/" aria-label="Go to home page" className="text-xl font-bold hover:underline focus:underline outline-none">
          Studio.Moikas
        </Link>
      </div>
      <div className="flex-none gap-2">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in">
            <button className="btn btn-primary">Sign In</button>
          </Link>
        </SignedOut>
      </div>
    </nav>
  );
} 