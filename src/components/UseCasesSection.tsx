"use client";
import Image from "next/image";
import { Palette, Rocket, Code } from "lucide-react";

export default function UseCasesSection() {
  return (
    <section className="w-full py-12 px-4 bg-white/80 dark:bg-base-200/80">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Built For Creative Professionals
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Join thousands of creators transforming their workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
            <div className="aspect-video relative overflow-hidden">
              <Image
                src="/digital-artist-ai.png"
                alt="Digital artist creating concept art"
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Digital Artists
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Generate concept art and illustrations in seconds. Explore new styles effortlessly.
              </p>
              {/* <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </div> */}
            </div>
          </div>

          <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
            <div className="aspect-video relative overflow-hidden">
              <Image
                src="/marketing-team-ai.png"
                alt="Marketing team creating content"
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Marketing Teams
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Create social media content and ads at scale without expensive resources.
              </p>
              {/* <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </div> */}
            </div>
          </div>

          <div className="group relative bg-white dark:bg-base-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer">
            <div className="aspect-video relative overflow-hidden">
              <Image
                src="/ai-game-dev.png"
                alt="Game developer creating assets"
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Code className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Game Developers
                  </h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Rapidly prototype game assets and environments to accelerate development.
              </p>
              {/* <div className="mt-3 flex items-center gap-1 text-jade font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
                <span>Learn more</span>
                <ArrowRight className="w-3 h-3" />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}