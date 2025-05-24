"use client";

import { BadgeHelp } from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";

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
                href="/tools/image-generator"
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
            {/* Add more tool links here as needed */}
          </ul>
        </nav>
      </aside>
    </>
  );
} 