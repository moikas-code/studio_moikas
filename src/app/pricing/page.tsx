"use client";

import { SignedIn, SignedOut, PricingTable, useAuth } from '@clerk/nextjs';
import Link from "next/link";
import { CheckCircle2, Sparkles, Zap, Shield, ArrowRight, ChevronDown, Plus, HelpCircle } from "lucide-react";
import { useState, useContext } from "react";
import { MpContext } from "@/context/mp_context";

/**
 * Pricing page for Studio.Moikas
 * Enhanced UI/UX with better visual hierarchy and information architecture
 */
export default function Pricing_page() {
  const { isSignedIn } = useAuth();
  const { mp_tokens, plan } = useContext(MpContext);
  const [show_faq, set_show_faq] = useState(false);
  const [expanded_faq, set_expanded_faq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What are Mana Points (MP)?",
      answer: "Mana Points are the currency used to generate content in Studio Moikas. Each creation consumes MP based on the complexity and model used."
    },
    {
      question: "Do unused Mana Points roll over?",
      answer: "Monthly Mana Points expire at the end of your billing cycle. However, purchased Mana Points never expire and are used after your monthly allowance."
    },
    {
      question: "Can I upgrade or downgrade anytime?",
      answer: "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle."
    },
    {
      question: "What happens when I run out of Mana Points?",
      answer: "You can purchase additional Mana Points anytime, or wait for your monthly allowance to refresh on your billing date."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Simple, transparent pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Creative Plan
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include access to our powerful AI tools.
          </p>
        </div>
      </div>

      {/* Current Plan Status (for signed-in users) */}
      {isSignedIn && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-base-100 rounded-lg shadow-sm border border-base-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Current Plan</h3>
                <p className="text-base-content/70">
                  {plan === "free" ? "Free Plan" : "Standard Plan"} • {mp_tokens} MP remaining
                </p>
              </div>
              <Link href="/buy-tokens" className="btn btn-primary btn-sm gap-2">
                <Plus className="w-4 h-4" />
                Buy More MP
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <SignedOut>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-base-100 rounded-2xl shadow-lg border border-base-300 p-8 hover:shadow-xl transition-shadow">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-base-content/60">/month</span>
                </div>
                <p className="text-base-content/70">Perfect for trying out our tools</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>125 Mana Points monthly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Access to all tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Standard image resolution</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>

              <Link href="/sign-up" className="btn btn-outline btn-block">
                Get Started Free
              </Link>
            </div>

            {/* Standard Plan */}
            <div className="relative bg-base-100 rounded-2xl shadow-lg border-2 border-primary p-8 hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-primary-content rounded-full px-4 py-1 text-sm font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  MOST POPULAR
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Standard</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$19</span>
                  <span className="text-base-content/60">/month</span>
                </div>
                <p className="text-base-content/70">For creators and professionals</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="font-medium">20,480 Mana Points monthly</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Priority generation queue</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>High resolution exports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Premium AI models</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>No watermarks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>

              <Link href="/sign-up" className="btn btn-primary btn-block gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="max-w-4xl mx-auto">
            <PricingTable
              appearance={{
                elements: {
                  pricingTable: "w-full flex flex-col md:flex-row gap-8",
                  pricingTableCard: "w-full",
                  pricingTablePlanCard: "flex-1 bg-base-100 rounded-2xl shadow-lg border border-base-300 p-8 hover:shadow-xl transition-shadow",
                  pricingTablePlanCardTitle: "text-2xl font-bold mb-2",
                  pricingTablePlanCardPrice: "text-4xl font-bold",
                  formButtonPrimary: "btn btn-primary btn-block mt-8",
                },
              }}
            />
          </div>
        </SignedIn>
      </div>

      {/* Additional Mana Points Section */}
      <div className="bg-base-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Need More Mana Points?</h2>
          <p className="text-base-content/70 mb-8">
            Purchase additional Mana Points anytime. They never expire and stack with your monthly allowance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/buy-tokens" className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" />
              Buy Mana Points
            </Link>
            <button 
              onClick={() => set_show_faq(!show_faq)} 
              className="btn btn-outline gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              View FAQ
              <ChevronDown className={`w-4 h-4 transition-transform ${show_faq ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {show_faq && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-base-100 rounded-lg border border-base-300 overflow-hidden"
              >
                <button
                  onClick={() => set_expanded_faq(expanded_faq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-base-200 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${
                      expanded_faq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {expanded_faq === index && (
                  <div className="px-6 pb-4 text-base-content/70">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="border-t border-base-300 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          <div className="flex items-center gap-2 text-base-content/60">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-base-content/60">
            <Zap className="w-5 h-5" />
            <span className="text-sm">Instant Access</span>
          </div>
          <div className="flex items-center gap-2 text-base-content/60">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm">Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}