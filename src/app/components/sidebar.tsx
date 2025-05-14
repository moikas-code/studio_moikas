"use client";

import Link from "next/link";
import React from "react";

/**
 * Sidebar component for Studio App.
 * Uses DaisyUI menu for navigation and extends full height.
 * Only visible when user is signed in (handled in layout).
 */
export default function Sidebar() {
  return (
    <aside className="h-screen w-64 bg-base-200 border-r border-base-300 flex flex-col shadow-lg" aria-label="Sidebar navigation">
      <div className="p-6 border-b border-base-300">
        <p className="text-md font-bold tracking-tight text-primary">Create</p>
      </div>
      <nav className="flex-1 p-4" aria-label="Main tools">
        <ul className="menu menu-lg rounded-box w-full">
          <li>
            <Link href="/tools/image-generator" className="justify-start" aria-label="Image Generator tool">
              <span className="text-base font-medium">Image Generator</span>
            </Link>
          </li>
          {/* Add more tool links here as needed */}
        </ul>
      </nav>
    </aside>
  );
} 