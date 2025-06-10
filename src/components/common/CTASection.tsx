"use client";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Rocket, ArrowRight, Wand2 } from "lucide-react";
import { track } from "@vercel/analytics";

export default function CTASection() {
  return (
    <section className="w-full py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-jade/20 via-jade/10 to-blackflame/20 dark:from-jade/10 dark:via-jade/5 dark:to-blackflame/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-jade/20 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blackflame/20 rounded-full filter blur-3xl"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full text-sm font-medium text-jade mb-6">
          <Rocket className="w-4 h-4" />
          Limited Time Offer
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Ready to Create Something Amazing?
        </h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of creators who are transforming their ideas into stunning visuals with Studio.Moikas
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedIn>
            <Link href="/tools">
              <button
                className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                onClick={() => track("Landing-CTA-Start_Creating_Now-Click")}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Start Creating Now
                  <Wand2 className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up">
              <button
                className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-medium dark:text-white bg-gradient-to-r from-jade to-jade-dark rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                onClick={() => track("Landing-CTA-Sign_Up_Free-Click")}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-jade-dark to-jade opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </SignedOut>
        </div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          No credit card required • 125 free Mana Points monthly
        </p>
      </div>
    </section>
  );
}