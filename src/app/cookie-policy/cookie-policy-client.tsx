"use client";
import React, { useState } from "react";
import {
  Cookie,
  Shield,
  Settings,
  Globe,
  Database,
  Info,
  ChevronDown,
  Mail,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CookiePolicyClient() {
  const [expanded_section, set_expanded_section] = useState<string | null>(null);

  const toggle_section = (section: string) => {
    set_expanded_section(expanded_section === section ? null : section);
  };

  const cookie_types = [
    {
      id: "essential",
      icon: Shield,
      title: "Essential Cookies",
      description: "Required for the website to function properly",
      content: [
        {
          name: "__session",
          purpose: "User authentication and session management",
          duration: "Session",
          provider: "Clerk",
        },
        {
          name: "mp_preferences",
          purpose: "User interface preferences and settings",
          duration: "1 year",
          provider: "Studio Moikas",
        },
        {
          name: "csrf_token",
          purpose: "Security - prevents cross-site request forgery",
          duration: "Session",
          provider: "Studio Moikas",
        },
      ],
    },
    {
      id: "functional",
      icon: Settings,
      title: "Functional Cookies",
      description: "Enable enhanced functionality and personalization",
      content: [
        {
          name: "theme_preference",
          purpose: "Stores your dark/light mode preference",
          duration: "1 year",
          provider: "Studio Moikas",
        },
        {
          name: "language",
          purpose: "Stores your preferred language setting",
          duration: "1 year",
          provider: "Studio Moikas",
        },
        {
          name: "recent_tools",
          purpose: "Remembers your recently used tools",
          duration: "30 days",
          provider: "Studio Moikas",
        },
      ],
    },
    {
      id: "analytics",
      icon: Globe,
      title: "Analytics Cookies",
      description: "Help us understand how visitors interact with our website",
      content: [
        {
          name: "_ga",
          purpose: "Google Analytics - tracks unique visitors",
          duration: "2 years",
          provider: "Google",
        },
        {
          name: "_vercel_analytics",
          purpose: "Vercel Analytics - performance monitoring",
          duration: "1 year",
          provider: "Vercel",
        },
        {
          name: "mp_analytics_opt_out",
          purpose: "Remembers if you've opted out of analytics",
          duration: "1 year",
          provider: "Studio Moikas",
        },
      ],
    },
    {
      id: "third-party",
      icon: Database,
      title: "Third-Party Cookies",
      description: "Set by our trusted partners for specific services",
      content: [
        {
          name: "stripe_*",
          purpose: "Payment processing and fraud prevention",
          duration: "Varies",
          provider: "Stripe",
        },
        {
          name: "__clerk_*",
          purpose: "Authentication and user management",
          duration: "Varies",
          provider: "Clerk",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="max-w-4xl mx-auto text-center">
          <Cookie className="w-16 h-16 mx-auto mb-6 text-jade" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            How we use cookies to improve your experience
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Last updated: January 17, 2025
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-jade" />
            What are cookies?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Cookies are small text files that are placed on your device when you visit our website.
            They help us provide you with a better experience by remembering your preferences,
            analyzing how you use our site, and enabling certain features.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            This policy explains what cookies we use, why we use them, and how you can manage your
            cookie preferences.
          </p>
        </div>

        {/* Cookie Banner Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Cookie Consent</h3>
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            When you first visit our website, you&apos;ll see a cookie consent banner. You can
            accept all cookies, reject non-essential cookies, or customize your preferences. You can
            change your cookie settings at any time through your account settings.
          </p>
        </div>

        {/* Cookie Types */}
        <div className="space-y-4">
          {cookie_types.map((type) => (
            <div
              key={type.id}
              className="glass dark:glass-dark rounded-2xl shadow-macos overflow-hidden"
            >
              <button
                onClick={() => toggle_section(type.id)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <type.icon className="w-6 h-6 text-jade" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {type.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                    {type.description}
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${
                    expanded_section === type.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded_section === type.id && (
                <div className="px-8 pb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                            Cookie Name
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                            Purpose
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                            Duration
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                            Provider
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.content.map((cookie, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                              {cookie.name}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {cookie.purpose}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {cookie.duration}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                              {cookie.provider}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Managing Cookies */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Managing Your Cookie Preferences
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Through Your Account
              </h3>
              <p>
                You can manage your cookie preferences at any time by visiting your{" "}
                <Link href="/tools/settings" className="text-jade hover:underline">
                  account settings
                </Link>
                . Here you can opt out of analytics cookies and customize your preferences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Through Your Browser
              </h3>
              <p>Most web browsers allow you to control cookies through their settings. You can:</p>
              <ul className="mt-2 space-y-1">
                <li className="pl-4 relative">
                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
                  Delete existing cookies
                </li>
                <li className="pl-4 relative">
                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
                  Block all cookies
                </li>
                <li className="pl-4 relative">
                  <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
                  Allow cookies from specific websites only
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> Blocking essential cookies may prevent you from using certain
                features of our website, including signing in to your account.
              </p>
            </div>
          </div>
        </div>

        {/* Third-Party Links */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Third-Party Services
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Some of our third-party partners may also use cookies. You can learn more about their
            cookie policies here:
          </p>
          <div className="space-y-3">
            <a
              href="https://stripe.com/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-jade hover:underline"
            >
              Stripe Cookie Policy
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://clerk.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-jade hover:underline"
            >
              Clerk Privacy Policy
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://policies.google.com/technologies/cookies"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-jade hover:underline"
            >
              Google Cookies Policy
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Updates to Policy */}
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Updates to This Policy
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update this Cookie Policy from time to time to reflect changes in our practices
            or for legal reasons. When we make significant changes, we&apos;ll notify you through
            our website or via email. The &quot;Last updated&quot; date at the top of this policy
            indicates when it was last revised.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-jade" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Questions About Cookies?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            If you have any questions about our use of cookies or this policy, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://x.com/moikas_official"
              className="px-6 py-3 bg-gradient-to-r from-jade to-jade-darkdark:text-white font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
            >
              @moikas_official
            </Link>
            <Link
              href="/privacy-policy"
              className="px-6 py-3 glass dark:glass-dark text-gray-700 dark:text-gray-300 font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-gray-50 dark:bg-gray-950 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm">
          <Link
            href="/privacy-policy"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/tools/settings"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            Cookie Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
