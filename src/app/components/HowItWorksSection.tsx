"use client";
import { Lightbulb, Brain, Rocket } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="w-full py-8 px-4 bg-white/80 dark:bg-base-200/80">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
              <Lightbulb className="w-7 h-7 text-jade" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
              1. Describe
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enter a text prompt describing what you want to create
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
              <Brain className="w-7 h-7 text-jade animate-pulse" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">2. Generate</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI models process your prompt and create visuals in seconds
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-3">
              <Rocket className="w-7 h-7 text-jade" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">3. Download</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get high-quality images ready for your projects
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}