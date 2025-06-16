"use client";
import { SignedIn, SignedOut, PricingTable } from "@clerk/nextjs";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PricingSection() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
          Simple, Transparent Pricing
        </h2>
        <div className="w-full max-w-3xl mx-auto">
          <SignedOut>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-base-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-jade mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  $0<span className="text-lg text-gray-500">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">125 Mana Points monthly</span>
                  </li>
                  {/* <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Standard resolution images</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Basic AI models</span>
                  </li> */}
                </ul>
                <Link href="/sign-up">
                  <button className="btn btn-outline w-full">
                    Get Started
                  </button>
                </Link>
              </div>

              <div className="bg-white dark:bg-base-200 rounded-lg shadow-lg border border-jade p-6 relative">
                <div className="absolute top-0 right-0 bg-jade text-white px-3 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
                <h3 className="text-2xl font-bold text-jade mb-2">
                  Standard
                </h3>
                <p className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  $19<span className="text-lg text-gray-500">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">20480 Mana Points monthly</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Early access to new features</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-jade mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Reduced Generation Pricing</span>
                  </li>
                </ul>
                <Link href="/sign-up">
                  <button className="btn btn-primary w-full">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="w-full max-w-3xl mx-auto [&>div]:h-full">
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
                    pricingTablePlanCardPrice:
                      "text-2xl md:text-3xl font-bold",
                    formButtonPrimary:
                      "btn btn-primary btn-sm md:btn-md w-full mt-4",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}