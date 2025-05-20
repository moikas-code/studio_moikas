"use client";
import React from "react";
import { SignedIn, SignedOut, PricingTable } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Sliders,
  Zap,
  FlaskRound,
} from "lucide-react";
import { track } from "@vercel/analytics";

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-purple-100 to-white dark:from-[#35155D] dark:to-[#0a0a0a]">
      {/* Hero Section */}
      <section className="w-full min-h-[500px] flex flex-col items-center justify-center text-center pt-16 pb-10 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
          Studio.Moikas
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto mb-6">
          Create stunning images from your imagination with AI-powered tools.
          Flexible, fast, and fun.
        </p>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <SignedIn>
            <Link href="/tools/image-generator">
              <button
                className="btn btn-primary btn-lg text-lg px-8 py-3 shadow-lg animate-bounce focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => track("Landing-HERO-Start_Creating-Click")}
              >
                Start Creating
              </button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <button
                className="btn btn-primary btn-lg text-lg px-8 py-3 shadow-lg animate-bounce focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => track("Landing-HERO-Get_Started-Click")}
              >
                Get Started
              </button>
            </Link>
          </SignedOut>
        </div>
      </section>

      {/* Animated Demo Placeholder */}
      <section className="w-full min-h-[600px] md:min-h-[400px] flex flex-col items-center justify-center py-4  mt-4">
        <div className=" w-full max-w-xl h-full flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          {/* Simple animation: prompt to image */}
          <div className="-translate-y-1/2 flex flex-col items-center">
            <div className="bg-white dark:bg-base-200 border border-base-300 rounded-xl px-6 py-3 shadow-md text-lg font-mono animate-pulse">
              &quot;A cat astronaut on Mars&quot;
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 max-w-69 w-full h-1 bg-gradient-to-r from-purple-400 via-orange-400 to-pink-400 animate-gradient-x rounded-full" />
            <span className="mt-2 text-xs text-gray-400">Your prompt</span>
          </div>
          <div className="md:-translate-y-1/2 flex flex-col items-center">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl w-54 h-54 flex items-center justify-center shadow-lg animate-fade-in">
              <Image
                width={300}
                height={300}
                src="/A_cat_astronaut_on_Mars.png"
                alt="AI-generated image"
                className="w-50 h-50 text-white rounded shadow-md"
              />
            </div>
            <span className="mt-2 text-xs text-gray-400">
              AI-generated image
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12 px-4">
        {/* Feature 1: AI Image Generation */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Sparkles className="w-10 h-10 text-purple-500 mb-3 animate-spin-slow" />
          <h3 className="text-md font-bold mb-2">AI Image Generation</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Turn your ideas into visuals instantly using advanced AI models.
          </p>
        </div>
        {/* Feature 2: Flexible Aspect Ratios */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Sliders className="w-10 h-10 text-orange-500 mb-3 animate-wiggle" />
          <h3 className="text-md font-bold mb-2">Flexible Aspect Ratios</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Choose from a variety of aspect ratios to fit your creative needs.
          </p>
        </div>
        {/* Feature 3: Multiple AI Models */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <Zap className="w-10 h-10 text-pink-500 mb-3 animate-pulse" />
          <h3 className="text-md font-bold mb-2">Multiple AI Models</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Access different AI models for unique styles and results.
          </p>
        </div>
        {/* Feature 4: Token-Based Usage */}
        <div className="card bg-white dark:bg-base-200 shadow-lg border border-base-200 flex flex-col items-center p-6 hover:scale-105 transition-transform duration-200">
          <span title="Mana Points">
            <FlaskRound className="w-10 h-10 mb-3 animate-bounce" />
          </span>
          <h3 className="text-md font-bold mb-2">Mana Points System</h3>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Track your creative power and manage your usage with Mana Points.
          </p>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full flex flex-col items-center justify-center py-8 mt-4">
        <SignedIn>
          <Link href="/tools/image-generator">
            <button
              className="btn btn-secondary btn-lg text-lg px-8 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-secondary"
              onClick={() => track("Landing-CTA-Start_Creating_Now-Click")}
            >
              Start Creating Now
            </button>
          </Link>
        </SignedIn>
        <SignedOut>
          <Link href="/sign-up">
            <button
              className="btn btn-secondary btn-lg text-lg px-8 py-3 shadow-md focus:outline-none focus:ring-2 focus:ring-secondary"
              onClick={() => track("Landing-CTA-Sign_Up_Free-Click")}
            >
              Sign Up Free
            </button>
          </Link>
        </SignedOut>
      </section>

      {/* Pricing Table Section */}
      <section className="w-full min-h-[500px] flex flex-col items-center justify-center py-8 px-4 mb-4">
        <div className="w-full max-w-3xl h-full [&>div]:h-full">
          <PricingTable
            appearance={{
              elements: {
                pricingTable:
                  "w-full h-full flex flex-col md:flex-row gap-4 bg-white/80 dark:bg-base-200/80 rounded-xl shadow-lg p-6 border border-base-200",
                pricingTableCard: "w-full",
                pricingTablePlanCard:
                  "flex-1 min-w-0 w-100 p-4 md:p-6 rounded-lg shadow-md",
                pricingTablePlanCardTitle:
                  "text-lg md:text-2xl font-bold text-primary",
                pricingTablePlanCardPrice: "text-2xl md:text-3xl font-bold",
                formButtonPrimary:
                  "btn btn-primary btn-sm md:btn-md w-full mt-4",
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}
