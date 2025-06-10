"use client";
import { Brain, Code, Palette } from "lucide-react";

export default function TechnologySection() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
          Powered by Advanced Technology
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-jade" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">State-of-the-Art AI</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our platform leverages the latest advancements in generative AI
              and deep learning to deliver exceptional results.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-jade" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Optimized Infrastructure
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built on a scalable, high-performance backend that ensures fast
              generation times and reliable service.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-jade/20 dark:bg-jade/10 flex items-center justify-center mb-4">
              <Palette className="w-8 h-8 text-jade" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Creative Algorithms</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Specialized models trained on diverse artistic styles and
              techniques to provide versatile creative outputs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}