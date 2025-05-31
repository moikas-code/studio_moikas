"use client";
import { Sparkles, Sliders, Zap, FlaskRound } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="w-full py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Powerful Features
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Everything you need to create stunning AI art
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1: AI Image Generation */}
          <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">AI Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Turn ideas into visuals instantly with advanced AI
            </p>
          </div>
          
          {/* Feature 2: Flexible Aspect Ratios */}
          <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Sliders className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Flexible Sizes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Multiple aspect ratios for any creative need
            </p>
          </div>
          
          {/* Feature 3: Multiple AI Models */}
          <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Multiple Models</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Various AI models for unique styles
            </p>
          </div>
          
          {/* Feature 4: Token-Based Usage */}
          <div className="group relative bg-white dark:bg-base-300 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer">
            <div className="w-12 h-12 bg-jade/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FlaskRound className="w-6 h-6 text-jade" />
            </div>
            <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">Mana Points</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Flexible credit system for all users
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}