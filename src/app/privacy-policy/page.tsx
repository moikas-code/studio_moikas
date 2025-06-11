"use client"
import React, { useState } from "react";
import { Shield, Eye, Database, Cookie, Lock, Mail, Users, AlertCircle, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Privacy_policy_page() {
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
            "Email address and authentication details (managed by Clerk)",
            "Username and profile information you provide",
            "Subscription status and billing information (processed by Stripe)"
          ]
        },
        {
          subtitle: "Usage Data",
          items: [
            "AI-generated content you create (images, videos, audio, text)",
            "Prompts and parameters used for generation",
            "Tool usage patterns and preferences",
            "Mana Points (MP) consumption and transaction history"
          ]
        },
        {
          subtitle: "Technical Data",
          items: [
            "Browser type and version",
            "Device information and operating system",
            "IP address (for security and fraud prevention)",
            "Analytics data through Vercel Analytics (anonymous)"
          ]
        }
      ]
    },
    {
      id: "data-usage",
      icon: Eye,
      title: "How We Use Your Data",
      content: [
        {
          subtitle: "Service Delivery",
          items: [
            "Process your AI generation requests",
            "Manage your account and subscription",
            "Track and display your Mana Points balance",
            "Store your creation history and preferences"
          ]
        },
        {
          subtitle: "Service Improvement",
          items: [
            "Analyze usage patterns to improve our AI models",
            "Optimize tool performance and user experience",
            "Develop new features based on user needs",
            "Debug and fix technical issues"
          ]
        },
        {
          subtitle: "Communication",
          items: [
            "Send important account and service updates",
            "Notify you about new features and tools",
            "Respond to your support requests",
            "Send billing and subscription information"
          ]
        }
      ]
    },
    {
      id: "data-protection",
      icon: Lock,
      title: "Data Protection & Security",
      content: [
        {
          subtitle: "Security Measures",
          items: [
            "End-to-end encryption for sensitive data",
            "Secure authentication through Clerk",
            "Regular security audits and updates",
            "Row-level security in our database (Supabase)"
          ]
        },
        {
          subtitle: "Data Storage",
          items: [
            "Your generated content is stored securely on our servers",
            "Temporary files are automatically deleted after processing",
            "Backups are encrypted and stored separately",
            "We use industry-standard cloud infrastructure providers"
          ]
        }
      ]
    },
    {
      id: "third-parties",
      icon: Users,
      title: "Third-Party Services",
      content: [
        {
          subtitle: "Service Providers We Use",
          items: [
            "Clerk: Authentication and user management",
            "Stripe: Payment processing (PCI compliant)",
            "Supabase: Database and file storage",
            "fal.ai: AI model hosting and processing",
            "Vercel: Hosting and anonymous analytics",
            "Upstash Redis: Caching and rate limiting"
          ]
        },
        {
          subtitle: "Data Sharing",
          items: [
            "We never sell your personal data",
            "Third parties only receive necessary data to provide their services",
            "All partners are bound by strict confidentiality agreements",
            "You can request a list of all third parties with access to your data"
          ]
        }
      ]
    },
    {
      id: "your-rights",
      icon: Shield,
      title: "Your Rights & Choices",
      content: [
        {
          subtitle: "Data Control",
          items: [
            "Access all data we have about you",
            "Export your creations and account data",
            "Delete your account and associated data",
            "Opt-out of non-essential communications"
          ]
        },
        {
          subtitle: "Content Ownership",
          items: [
            "You retain full ownership of content you create",
            "We only store your content to provide our services",
            "You can delete your generated content at any time",
            "We don't use your content to train AI models without permission"
          ]
        }
      ]
    },
    {
      id: "cookies",
      icon: Cookie,
      title: "Cookies & Tracking",
      content: [
        {
          subtitle: "Essential Cookies",
          items: [
            "Authentication tokens to keep you logged in",
            "Session preferences and settings",
            "Security cookies to prevent fraud"
          ]
        },
        {
          subtitle: "Analytics",
          items: [
            "Anonymous usage statistics through Vercel Analytics",
            "No personally identifiable information in analytics",
            "You can opt-out using the toggle in the footer",
            "We respect Do Not Track browser settings"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-base-100 rounded-full px-4 py-2 mb-6 shadow-lg">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            At Studio Moikas, we&apos;re committed to protecting your privacy and being transparent about how we handle your data.
          </p>
          <p className="text-sm text-base-content/60 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Quick Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Quick Summary
          </h2>
          <ul className="space-y-2 text-base-content/80">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>We collect only what&apos;s necessary to provide our AI creative tools</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Your generated content belongs to you - we just store it for your access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>We never sell your personal data to third parties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>You can delete your account and data at any time</span>
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
                  <ChevronDown className={`w-5 h-5 transition-transform ${is_expanded ? 'rotate-180' : ''}`} />
                </button>
                
                {is_expanded && (
                  <div className="px-6 pb-6 space-y-6">
                    {section.content.map((subsection, idx) => (
                      <div key={idx}>
                        <h3 className="font-semibold text-lg mb-3 text-primary">{subsection.subtitle}</h3>
                        <ul className="space-y-2">
                          {subsection.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2 text-base-content/80">
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

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Questions About Privacy?</h2>
          <p className="text-base-content/70 mb-6">
            We&apos;re here to help clarify any concerns about your data and privacy.
          </p>
          <div className="space-y-3">
            <p>
              Contact our founder on X:{" "}
              <a 
                href="https://x.com/moikapy_" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-medium"
              >
                @moikapy_
              </a>
            </p>
            <p className="text-sm text-base-content/60">
              Response time: Usually within 24-48 hours
            </p>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/terms-of-service" className="text-primary hover:underline">
            Terms of Service
          </Link>
          <span className="text-base-content/40">•</span>
          <Link href="/pricing" className="text-primary hover:underline">
            Pricing
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