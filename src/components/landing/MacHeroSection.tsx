"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { track } from "@vercel/analytics";

export default function MacHeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-black dark:to-gray-950" />

      {/* Subtle animated orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-jade/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-jade/5 rounded-full blur-3xl animate-pulse animation-delay-400" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 glass dark:glass-dark rounded-full text-sm font-medium mb-8 animate-scale-in">
          <Sparkles className="w-4 h-4 text-jade" />
          <span className="text-gray-700 dark:text-gray-300">Early Access • Community Project</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-fade-in">
          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
            Studio Moikas
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in animation-delay-100">
          Professional AI tools with a simple interface.
          <span className="block mt-2">
            Generate images, create videos, clone voices, and build AI workflows.
          </span>
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12 animate-slide-up animation-delay-200">
          {[
            "FLUX Pro Models",
            "Voice Cloning",
            "Video Effects",
            "AI Workflows",
            "No commitment required",
          ].map((feature, index) => (
            <div
              key={feature}
              className="px-4 py-2 glass dark:glass-dark rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-macos"
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-300">
          <SignedOut>
            <Link href="/sign-up">
              <button
                className="group relative px-8 py-4 bg-gradient-to-r from-jade to-jade-dark dark:text-white font-medium rounded-2xl shadow-macos hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300"
                onClick={() => track("Landing-MacHero-GetStarted-Click")}
              >
                <span className="flex items-center gap-2">
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 glass dark:glass-dark text-gray-700 dark:text-gray-300 font-medium rounded-2xl shadow-macos hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300">
                View Pricing
              </button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/tools">
              <button
                className="group relative px-8 py-4 bg-gradient-to-r from-jade to-jade-dark dark:text-white font-medium rounded-2xl shadow-macos hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300"
                onClick={() => track("Landing-MacHero-OpenStudio-Click")}
              >
                <span className="flex items-center gap-2">
                  Open Studio
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </SignedIn>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in animation-delay-400">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">6</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI Tools</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">125</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Free MP/Month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">Fast</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generation</div>
          </div>
        </div>
      </div>
    </section>
  );
}
