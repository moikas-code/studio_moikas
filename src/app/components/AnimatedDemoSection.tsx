"use client";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function AnimatedDemoSection() {
  return (
    <section className="w-full md:h-150 flex flex-row items-center justify-center py-8 px-4 relative overflow-hidden bg-gradient-to-b from-transparent via-jade/5 to-transparent dark:via-jade/10">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          See The Magic In Action
        </h2>
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
          {/* Prompt Input */}
          <div className="flex flex-col items-center relative group">
            <div className="bg-white dark:bg-base-200 border border-jade/20 rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <p className="text-base font-mono text-gray-800 dark:text-gray-200">
                &quot;A cat astronaut on Mars&quot;
              </p>
            </div>
            <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Your prompt</span>
          </div>
          
          {/* Animated Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-20">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-jade via-jade-dark to-jade animate-pulse"></div>
              </div>
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-jade animate-pulse" />
            </div>
          </div>
          <div className="lg:hidden">
            <ArrowRight className="w-6 h-6 text-jade rotate-90 animate-bounce" />
          </div>
          
          {/* Generated Image */}
          <div className="flex flex-col items-center relative group">
            <div className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 w-50 h-50">
              <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-blackflame/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Image
                width={150}
                height={150}
                src="/A_cat_astronaut_on_Mars.png"
                alt="AI-generated cat astronaut on Mars"
                className="w-full h-full object-cover"
                priority
              />
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm rounded px-2 py-0.5 z-20">
                <span className="text-xs font-medium text-white">AI Generated</span>
              </div>
            </div>
            <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Your result</span>
          </div>
        </div>
      </div>
    </section>
  );
}