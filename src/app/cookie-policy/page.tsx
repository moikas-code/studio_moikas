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

export default function Cookie_policy_page() {
  const [expanded_section, set_expanded_section] = useState<string | null>(null);

  const toggle_section = (section: string) => {
    set_expanded_section(expanded_section === section ? null : section);
  };

  const sections = [
    {
      id: "what-are-cookies",
      icon: Info,
      title: "What Are Cookies?",
      content: [
        {
          subtitle: "Understanding Cookies",
          items: [
            "Cookies are small text files stored on your device when you visit our website",
            "They help us remember your preferences and improve your experience",
            "Cookies cannot harm your device or access your personal files",
            "Most cookies expire after a set period or when you close your browser",
          ],
        },
        {
          subtitle: "Why We Use Cookies",
          items: [
            "To keep you signed in to your account securely",
            "To remember your preferences and settings",
            "To understand how you use our platform and improve it",
            "To ensure our services are working properly",
            "To provide relevant features based on your usage",
          ],
        },
      ],
    },
    {
      id: "essential-cookies",
      icon: Shield,
      title: "Essential Cookies",
      content: [
        {
          subtitle: "Authentication & Security",
          items: [
            "__clerk_db_jwt - Manages your secure login session (Session duration)",
            "__client_uat - Clerk user authentication token (7 days)",
            "__session - Active session identifier (Session duration)",
            "XSRF-TOKEN - Protects against cross-site request forgery attacks (Session duration)",
          ],
        },
        {
          subtitle: "Functionality",
          items: [
            "theme_preference - Remembers your light/dark mode choice (1 year)",
            "cookie_consent - Tracks your cookie consent decision (1 year)",
            "language_preference - Stores your preferred language (1 year)",
            "session_data - Temporary data for your current session (Session duration)",
          ],
        },
      ],
    },
    {
      id: "analytics-cookies",
      icon: Database,
      title: "Analytics Cookies",
      content: [
        {
          subtitle: "Vercel Analytics",
          items: [
            "_vercel_analytics - Anonymous usage statistics (1 year)",
            "No personally identifiable information is collected",
            "Helps us understand which features are most popular",
            "Tracks page views and general usage patterns",
            "You can opt-out using the toggle in our footer",
          ],
        },
        {
          subtitle: "Performance Monitoring",
          items: [
            "Measures page load times and performance",
            "Identifies technical issues and errors",
            "Helps us optimize the platform for better speed",
            "All data is aggregated and anonymous",
          ],
        },
      ],
    },
    {
      id: "third-party-cookies",
      icon: Globe,
      title: "Third-Party Cookies",
      content: [
        {
          subtitle: "Service Provider Cookies",
          items: [
            "Clerk (Authentication): Secure login and user management",
            "Stripe (Payments): Payment processing and subscription management",
            "Supabase (Database): Session management for real-time features",
            "Cloudflare (Security): Bot protection and security features",
          ],
        },
        {
          subtitle: "Important Notes",
          items: [
            "We carefully select our partners based on their privacy practices",
            "Third-party cookies are essential for providing our services",
            "Each provider has their own cookie policy you can review",
            "We do not allow advertising or tracking cookies",
          ],
        },
      ],
    },
    {
      id: "managing-cookies",
      icon: Settings,
      title: "Managing Your Cookie Preferences",
      content: [
        {
          subtitle: "Browser Controls",
          items: [
            "Chrome: Settings > Privacy and security > Cookies and other site data",
            "Firefox: Settings > Privacy & Security > Cookies and Site Data",
            "Safari: Preferences > Privacy > Manage Website Data",
            "Edge: Settings > Privacy, search, and services > Cookies and site permissions",
          ],
        },
        {
          subtitle: "Our Cookie Controls",
          items: [
            "Analytics opt-out toggle available in the footer of every page",
            "Essential cookies cannot be disabled (required for the site to function)",
            "Clearing your browser cookies will reset all preferences",
            "Private/Incognito browsing may limit some functionality",
          ],
        },
        {
          subtitle: "Impact of Disabling Cookies",
          items: [
            "Disabling essential cookies will prevent you from signing in",
            "You may need to re-enter preferences on each visit",
            "Some features may not work as expected",
            "We recommend keeping essential cookies enabled for the best experience",
          ],
        },
      ],
    },
  ];

  const cookie_table = [
    {
      name: "__clerk_db_jwt",
      purpose: "Authentication session",
      type: "Essential",
      duration: "Session",
      provider: "Clerk",
    },
    {
      name: "__client_uat",
      purpose: "User authentication",
      type: "Essential",
      duration: "7 days",
      provider: "Clerk",
    },
    {
      name: "cookie_consent",
      purpose: "Cookie consent choice",
      type: "Essential",
      duration: "1 year",
      provider: "Studio Moikas",
    },
    {
      name: "theme_preference",
      purpose: "UI theme setting",
      type: "Functional",
      duration: "1 year",
      provider: "Studio Moikas",
    },
    {
      name: "_vercel_analytics",
      purpose: "Anonymous analytics",
      type: "Analytics",
      duration: "1 year",
      provider: "Vercel",
    },
    {
      name: "mp_context_sync",
      purpose: "Token balance sync",
      type: "Functional",
      duration: "Session",
      provider: "Studio Moikas",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-base-100 rounded-full px-4 py-2 mb-6 shadow-lg">
            <Cookie className="w-5 h-5 text-primary" />
            <span className="font-semibold">Cookie Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How We Use Cookies</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            This policy explains how Studio Moikas uses cookies to enhance your experience while
            respecting your privacy.
          </p>
          <p className="text-sm text-base-content/60 mt-4">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Quick Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Quick Summary
          </h2>
          <ul className="space-y-2 text-base-content/80">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>We use cookies to keep you logged in and remember your preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Analytics cookies help us improve our platform (you can opt-out)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>We don&apos;t use advertising or tracking cookies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>You can manage cookies through your browser settings</span>
            </li>
          </ul>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const is_expanded = expanded_section === section.id;

            return (
              <div key={section.id} className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={() => toggle_section(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-base-200/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${is_expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {is_expanded && (
                  <div className="px-6 pb-6 space-y-6">
                    {section.content.map((subsection, idx) => (
                      <div key={idx}>
                        <h3 className="font-semibold text-lg mb-3 text-primary">
                          {subsection.subtitle}
                        </h3>
                        <ul className="space-y-2">
                          {subsection.items.map((item, itemIdx) => (
                            <li
                              key={itemIdx}
                              className="flex items-start gap-2 text-base-content/80"
                            >
                              <span className="text-primary/60 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cookie Details Table */}
        <div className="mt-8 bg-base-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              Cookie Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-base-content/20">
                  <tr>
                    <th className="text-left py-2 px-2 text-sm font-semibold">Cookie Name</th>
                    <th className="text-left py-2 px-2 text-sm font-semibold">Purpose</th>
                    <th className="text-left py-2 px-2 text-sm font-semibold">Type</th>
                    <th className="text-left py-2 px-2 text-sm font-semibold">Duration</th>
                    <th className="text-left py-2 px-2 text-sm font-semibold">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {cookie_table.map((cookie, idx) => (
                    <tr key={idx} className="border-b border-base-content/10">
                      <td className="py-3 px-2 text-sm font-mono">{cookie.name}</td>
                      <td className="py-3 px-2 text-sm">{cookie.purpose}</td>
                      <td className="py-3 px-2 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            cookie.type === "Essential"
                              ? "bg-primary/20 text-primary"
                              : cookie.type === "Analytics"
                                ? "bg-secondary/20 text-secondary"
                                : "bg-accent/20 text-accent"
                          }`}
                        >
                          {cookie.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">{cookie.duration}</td>
                      <td className="py-3 px-2 text-sm">{cookie.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 space-y-4">
          {/* Do Not Track */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Do Not Track</h2>
              </div>
              <p className="text-base-content/80">
                We respect Do Not Track (DNT) browser settings. When DNT is enabled, our analytics
                cookies will not be set, and we won&apos;t collect analytics data about your visit.
                Essential cookies will still be used as they&apos;re necessary for the website to
                function properly.
              </p>
            </div>
          </div>

          {/* Cookie Policy Updates */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Updates to This Policy</h2>
              </div>
              <ul className="space-y-2 text-base-content/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>We may update this policy when we add new features or services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>Significant changes will be notified through our website</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>
                    The &ldquo;Last updated&rdquo; date at the top shows the latest revision
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>Continued use of our services means you accept the updated policy</span>
                </li>
              </ul>
            </div>
          </div>

          {/* External Resources */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Learn More About Cookies</h2>
              </div>
              <ul className="space-y-2 text-base-content/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>
                    <a
                      href="https://www.allaboutcookies.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      All About Cookies
                    </a>{" "}
                    - Independent guide to cookies
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>
                    <a
                      href="https://www.aboutcookies.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      AboutCookies.org
                    </a>{" "}
                    - How to manage cookies in your browser
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary/60 mt-1">•</span>
                  <span>
                    Your browser&apos;s help section for specific cookie management instructions
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Questions About Cookies?</h2>
          <p className="text-base-content/70 mb-6">
            If you have any questions about how we use cookies or want to know more about your
            privacy, we&apos;re here to help.
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Cookie & Privacy Inquiries:</p>
              <p>
                Contact us on{" "}
                <a
                  href="https://x.com/moikas_official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X (Twitter)
                </a>
              </p>
            </div>
            <div className="pt-4 border-t border-base-content/20">
              <p className="text-sm text-base-content/60">
                For general privacy questions, see our{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <span className="text-base-content/40">•</span>
          <Link href="/terms-of-service" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <span className="text-base-content/40">•</span>
          <Link href="/" className="text-primary hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
