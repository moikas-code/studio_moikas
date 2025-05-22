"use client";

import Link from "next/link";
import React from "react";

/**
 * Sidebar component for Studio App.
 * Uses DaisyUI menu for navigation and extends full height.
 * Only visible when user is signed in (handled in layout).
 */
export default function Sidebar({ open = false, on_close }: { open?: boolean; on_close?: () => void }) {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed h-screen inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={on_close}
        aria-hidden={!open}
      />
      <aside
        className={`h-screen w-64 max-w-full bg-base-200 border-r border-base-300 flex flex-col shadow-lg z-40 fixed md:static transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${open ? "md:flex" : "hidden md:flex"} overflow-y-auto`}
        aria-label="Sidebar navigation"
      >
        {/* Close button for mobile */}
        <div className="flex md:hidden justify-end p-2">
          <button className="btn btn-ghost btn-square" onClick={on_close} aria-label="Close sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
          <p className="text-sm font-bold tracking-tight text-primary">Create</p>
        </div>
        <nav className="flex-1 p-4" aria-label="Main tools">
          <ul className="menu menu-lg rounded-box w-full">
            <li>
              <Link
                href="/tools/image-generator"
                className="justify-start"
                aria-label="Image Generator tool"
              >
                <span className="text-base font-medium">Image Generator</span>
              </Link>
            </li>
            <li>
              <Link
                href="https://x.com/moikas_official"
                className="justify-start"
                aria-label="Help and News"
              >
                <span className="flex items-center gap-2">
                  {/* Question mark icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M12 14a4 4 0 10-4-4 4 4 0 004 4zm0 0v2" />
                  </svg>
                  Help/News
                </span>
              </Link>
            </li>
            {/* Add more tool links here as needed */}
          </ul>
        </nav>
      </aside>
    </>
  );
} 