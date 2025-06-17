"use client";
import React, { useState } from "react";
import {
  Shield,
  Eye,
  Database,
  Cookie,
  Lock,
  Mail,
  Users,
  AlertCircle,
  ChevronDown,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyClient() {
  const [expanded_section, set_expanded_section] = useState<string | null>(null);

  const toggle_section = (section: string) => {
    set_expanded_section(expanded_section === section ? null : section);
  };

  const sections = [
    {
      id: "data-collection",
      icon: Database,
      title: "Data We Collect",
      content: [
        {
          subtitle: "Account Information",
          items: [
            "Email address and authentication details (via Clerk)",
            "Username and profile information",
            "Payment information (processed securely by Stripe)",
          ],
        },
        {
          subtitle: "Usage Data",
          items: [
            "Generated content metadata (not the content itself unless you save it)",
            "Feature usage statistics",
            "Token consumption data",
          ],
        },
        {
          subtitle: "Technical Data",
          items: [
            "IP address and browser information",
            "Device type and operating system",
            "Cookies and similar technologies",
          ],
        },
      ],
    },
    {
      id: "data-usage",
      icon: Eye,
      title: "How We Use Your Data",
      content: [
        {
          subtitle: "Service Provision",
          items: [
            "To provide and maintain our AI generation services",
            "To process your requests and manage your account",
            "To handle payments and subscriptions",
          ],
        },
        {
          subtitle: "Service Improvement",
          items: [
            "To analyze usage patterns and improve our tools",
            "To develop new features and services",
            "To ensure platform security and prevent abuse",
          ],
        },
        {
          subtitle: "Communication",
          items: [
            "To send service updates and important notices",
            "To respond to your inquiries and support requests",
            "To send marketing communications (with your consent)",
          ],
        },
      ],
    },
    {
      id: "data-protection",
      icon: Lock,
      title: "Data Protection & Security",
      content: [
        {
          subtitle: "Security Measures",
          items: [
            "Industry-standard encryption for data transmission",
            "Secure cloud infrastructure with regular backups",
            "Access controls and authentication systems",
            "Regular security audits and updates",
          ],
        },
        {
          subtitle: "Data Retention",
          items: [
            "Account data retained while your account is active",
            "Generated content metadata kept for 90 days",
            "Payment records retained as required by law",
            "You can request data deletion at any time",
          ],
        },
      ],
    },
    {
      id: "third-parties",
      icon: Users,
      title: "Third-Party Services",
      content: [
        {
          subtitle: "Service Providers",
          items: [
            "Clerk - Authentication and user management",
            "Stripe - Payment processing",
            "Supabase - Database and storage",
            "fal.ai - AI model hosting",
            "Vercel - Hosting and analytics",
          ],
        },
        {
          subtitle: "Data Sharing",
          items: [
            "We only share data necessary for service operation",
            "Third parties are bound by strict confidentiality agreements",
            "We never sell your personal data",
            "Law enforcement requests handled per legal requirements",
          ],
        },
      ],
    },
    {
      id: "your-rights",
      icon: Scale,
      title: "Your Rights",
      content: [
        {
          subtitle: "Data Rights",
          items: [
            "Access - Request a copy of your personal data",
            "Correction - Update or correct your information",
            "Deletion - Request removal of your data",
            "Portability - Receive your data in a portable format",
            "Objection - Opt out of certain data processing",
          ],
        },
        {
          subtitle: "How to Exercise Rights",
          items: [
            "Contact us at privacy@moikas.com",
            "Use the data export feature in your account settings",
            "Submit deletion requests through our privacy portal",
          ],
        },
      ],
    },
    {
      id: "cookies",
      icon: Cookie,
      title: "Cookies & Tracking",
      content: [
        {
          subtitle: "Essential Cookies",
          items: [
            "Authentication and security cookies",
            "User preference settings",
            "Session management",
          ],
        },
        {
          subtitle: "Analytics Cookies",
          items: [
            "Usage statistics (anonymized)",
            "Performance monitoring",
            "Feature adoption tracking",
          ],
        },
        {
          subtitle: "Cookie Management",
          items: [
            "Manage preferences in account settings",
            "Use browser settings to control cookies",
            "Opt out of analytics tracking anytime",
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-jade" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your privacy is important to us. Learn how we protect your data.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Last updated: January 17, 2025
          </p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-jade" />
            Quick Summary
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>• We collect only essential data needed to provide our services</p>
            <p>• Your generated content is private and not used for training</p>
            <p>• We never sell your personal information</p>
            <p>• You can delete your data anytime</p>
            <p>• We use industry-standard security measures</p>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="glass dark:glass-dark rounded-2xl shadow-macos overflow-hidden"
            >
              <button
                onClick={() => toggle_section(section.id)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <section.icon className="w-6 h-6 text-jade" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                    expanded_section === section.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded_section === section.id && (
                <div className="px-8 pb-6 space-y-6">
                  {section.content.map((subsection, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        {subsection.subtitle}
                      </h4>
                      <ul className="space-y-2">
                        {subsection.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-gray-600 dark:text-gray-400 pl-4 relative"
                          >
                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-jade" />
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Questions About Privacy?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We&apos;re here to help. Contact our privacy team for any questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:privacy@moikas.com"
              className="px-6 py-3 bg-gradient-to-r from-jade to-jade-dark text-white font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
            >
              privacy@moikas.com
            </Link>
            <Link
              href="/contact/privacy"
              className="px-6 py-3 glass dark:glass-dark text-gray-700 dark:text-gray-300 font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
            >
              Privacy Contact Form
            </Link>
          </div>
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-gray-50 dark:bg-gray-950 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm">
          <Link
            href="/terms-of-service"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/cookie-policy"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            Cookie Policy
          </Link>
          <Link
            href="/dmca"
            className="text-gray-600 dark:text-gray-400 hover:text-jade transition-colors"
          >
            DMCA Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
