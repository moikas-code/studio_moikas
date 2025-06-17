"use client";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { track } from "@vercel/analytics";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out our tools",
    features: [
      "125 Mana Points per month",
      "Access to all basic tools",
      "Standard generation speed",
      "Community support",
      "Watermarked outputs",
    ],
    limitations: ["Limited to 10 requests/minute", "Queue priority: Standard"],
    cta: "Start Free",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Standard",
    price: "$20",
    period: "per month",
    description: "For creators and professionals",
    features: [
      "20,480 Mana Points per month",
      "Access to all pro tools",
      "Priority generation speed",
      "Email support",
      "No watermarks",
      "60 requests per minute",
      "MEMU workflows (Pro)",
    ],
    limitations: [],
    cta: "Upgrade to Standard",
    href: "/pricing",
    popular: true,
  },
  {
    name: "Pay as you go",
    price: "From $2",
    period: "one-time",
    description: "Buy tokens when you need them",
    features: [
      "Never expires",
      "Use across all tools",
      "Same features as Free plan",
      "No monthly commitment",
      "Bulk discounts available",
    ],
    limitations: ["Limited to 10 requests/minute", "Watermarked outputs"],
    cta: "Buy Tokens",
    href: "/buy-tokens",
    popular: false,
  },
];

export default function MacPricingTable() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees, no surprises.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-3xl ${
                plan.popular
                  ? "glass dark:glass-dark shadow-xl scale-105"
                  : "bg-gray-50 dark:bg-gray-900 shadow-macos"
              } hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300 animate-scale-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-jade to-jade-dark dark:text-white text-xs font-medium rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-jade flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <ul className="space-y-2 mb-8 pt-4 border-t border-gray-200 dark:border-gray-800">
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="text-gray-500 dark:text-gray-500 text-sm">
                      {limitation}
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA Button */}
              <Link href={plan.href} className="block">
                <button
                  className={`w-full py-3 px-6 rounded-2xl font-medium transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-jade to-jade-dark dark:text-white hover:shadow-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:shadow-macos hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => track(`Landing-Pricing-${plan.name}-Click`)}
                >
                  {plan.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Token Information */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="p-6 glass dark:glass-dark rounded-2xl shadow-macos">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What are Mana Points (MP)?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Mana Points are our universal currency across all tools. Different operations cost
              different amounts:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-jade">1-320*</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Image Gen</div>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-jade">750/sec*</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Video Effects</div>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-jade">25/250</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">TTS (MP/chars)</div>
              </div>
              <div className="text-center p-3 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                <div className="text-2xl font-bold text-jade">5-15</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Text AI</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              * Costs vary by model and plan. Video charges per second of output.
            </p>
          </div>
        </div>

        {/* Detailed Pricing Breakdown */}
        <div className="mt-8 max-w-3xl mx-auto">
          <div className="p-6 glass dark:glass-dark rounded-2xl shadow-macos">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How Image Generation Pricing Works
            </h4>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Pricing Models:
                </span>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>
                    • <strong>Flat Rate:</strong> Most models charge a fixed MP cost per image
                  </li>
                  <li>
                    • <strong>Time-Based:</strong> LoRA/SD models charge 1 MP per second of
                    generation
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Plan Multipliers:
                </span>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>
                    • <strong>Free users:</strong> 4x base cost
                  </li>
                  <li>
                    • <strong>Standard users:</strong> 1.5x base cost
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Example Base Costs:
                </span>
                <ul className="mt-1 ml-4 space-y-1">
                  <li>• SANA: 1 MP → 4 MP (Free) / 1.5 MP (Standard)</li>
                  <li>• FLUX Dev: 25 MP → 100 MP (Free) / 37.5 MP (Standard)</li>
                  <li>• LoRA Models: 1 MP/sec → 4 MP/sec (Free) / 1.5 MP/sec (Standard)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
