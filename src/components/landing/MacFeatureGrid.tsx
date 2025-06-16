"use client";
import { FaImage, FaVideo, FaMicrophone, FaRobot, FaEdit, FaFileAlt } from "react-icons/fa";
import Link from "next/link";
import { track } from "@vercel/analytics";

const features = [
  {
    title: "Image Generator",
    description: "Create stunning AI art with FLUX Pro, SANA, and Stable Diffusion models",
    icon: FaImage,
    href: "/tools/create",
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
    tokens: "1-320 MP*",
  },
  {
    title: "Video Effects",
    description: "Generate and enhance videos with AI-powered effects and restoration",
    icon: FaVideo,
    href: "/tools/video-effects",
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
    tokens: "750 MP/sec*",
  },
  {
    title: "Audio Studio",
    description: "Text-to-speech, voice cloning, and document narration",
    icon: FaMicrophone,
    href: "/tools/audio",
    color: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-pink-500",
    tokens: "25 MP/250 chars",
  },
  {
    title: "MEMU Workflows",
    description: "Build and run AI agent workflows with a visual editor",
    icon: FaRobot,
    href: "/tools/memu",
    color: "from-indigo-500/10 to-purple-500/10",
    iconColor: "text-indigo-500",
    tokens: "5-15 MP",
    badge: "Pro",
  },
  {
    title: "Image Editor",
    description: "Edit images with layers, text overlays, and AI enhancements",
    icon: FaEdit,
    href: "/tools/image-editor",
    color: "from-orange-500/10 to-red-500/10",
    iconColor: "text-orange-500",
    tokens: "Free",
  },
  {
    title: "Text Analyzer",
    description: "Generate scripts, summaries, tweets, and content analysis",
    icon: FaFileAlt,
    href: "/tools/text-analyzer",
    color: "from-green-500/10 to-teal-500/10",
    iconColor: "text-green-500",
    tokens: "5-10 MP",
  },
];

export default function MacFeatureGrid() {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Professional AI Tools
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to create stunning content. Pay only for what you use with our
            transparent token system.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                onClick={() => track(`Landing-Feature-${feature.title.replace(/\s+/g, "")}-Click`)}
                className={`group relative p-8 glass dark:glass-dark rounded-3xl shadow-macos hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300 animate-scale-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-3xl opacity-50 group-hover:opacity-70 transition-opacity`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-macos flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`text-2xl ${feature.iconColor}`} />
                  </div>

                  {/* Title with Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    {feature.badge && (
                      <span className="px-2 py-1 bg-jade/10 text-jade text-xs font-medium rounded-full">
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Token Cost */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                      {feature.tokens}
                    </span>
                    <span className="text-jade text-sm font-medium group-hover:translate-x-1 transition-transform">
                      Try now →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center space-y-4">
          <div className="inline-flex items-center gap-4 px-6 py-3 glass dark:glass-dark rounded-full">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No hidden fees • Cancel anytime • Instant access
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            * Costs vary by model and plan. Some models charge per second of generation. See pricing
            for details.
          </p>
        </div>
      </div>
    </section>
  );
}
