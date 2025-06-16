"use client";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function MacDemoShowcase() {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            See it in action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            From prompt to professional output in seconds
          </p>
        </div>

        {/* Demo Flow */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          {/* Input */}
          <div className="flex-1 text-center animate-fade-in">
            <div className="p-6 glass dark:glass-dark rounded-2xl shadow-macos hover:shadow-macos-hover transition-all duration-300">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-500 mb-2">
                Your prompt
              </div>
              <p className="text-lg font-mono text-gray-800 dark:text-gray-200">
                &quot;A cat astronaut on Mars&quot;
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:flex items-center animate-fade-in animation-delay-100">
            <div className="relative">
              <div className="w-20 h-0.5 bg-gradient-to-r from-jade/20 via-jade to-jade/20"></div>
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-jade" />
            </div>
          </div>
          <div className="lg:hidden animate-fade-in animation-delay-100">
            <ArrowRight className="w-6 h-6 text-jade rotate-90" />
          </div>

          {/* Output */}
          <div className="flex-1 animate-fade-in animation-delay-200">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-jade/20 to-jade/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/A_cat_astronaut_on_Mars.png"
                  alt="AI-generated cat astronaut on Mars"
                  width={400}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute bottom-4 right-4 px-3 py-1 glass dark:glass-dark rounded-full text-xs font-medium">
                  AI Generated • 3.2s
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Try It CTA */}
        <div className="text-center mt-12 animate-slide-up animation-delay-300">
          <a
            href="/tools/create"
            className="inline-flex items-center gap-2 px-6 py-3 glass dark:glass-dark rounded-full text-gray-700 dark:text-gray-300 font-medium hover:shadow-macos transition-all duration-300"
          >
            Try it yourself
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
