"use client"
import React, { useState } from "react";
import { Shield, Eye, Database, Cookie, Lock, Mail, Users, AlertCircle, ChevronDown, Scale } from "lucide-react";
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
            "Mana Points (MP) consumption and transaction history",
            "Moderation logs including prompts checked and safety decisions",
            "False positive reports you submit"
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
            "Store your creation history and preferences",
            "Screen prompts for safety and legal compliance",
            "Maintain moderation logs for platform safety",
            "Review false positive reports to improve moderation"
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
            "HTTPS/TLS encryption for all data in transit",
            "Secure authentication through Clerk",
            "Database encryption at rest via Supabase",
            "Row-level security policies for data access control",
            "Regular security audits and updates",
            "Input sanitization to prevent injection attacks"
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
            "xAI (Grok): Content moderation and safety screening",
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
            "Opt-out of non-essential communications",
            "Report false positives in content moderation",
            "Request review of moderation decisions"
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
      id: "data-retention",
      icon: Database,
      title: "Data Retention",
      content: [
        {
          subtitle: "Content Storage",
          items: [
            "Generated content is stored until you delete it",
            "Prompts are automatically deleted after 7 days",
            "Deleted content is permanently removed within 30 days",
            "Temporary processing files are deleted immediately after use",
            "Cached content expires after 1 hour automatically"
          ]
        },
        {
          subtitle: "Account Data",
          items: [
            "Account information is retained while your account is active",
            "Billing records are maintained by Stripe per their data retention policy",
            "Usage logs retained for 90 days for debugging and support",
            "Account deletion removes all personal data within 30 days"
          ]
        },
        {
          subtitle: "Moderation Data",
          items: [
            "Moderation logs are retained for 90 days for safety compliance",
            "False positive reports are kept until resolved by admin review",
            "Aggregated statistics may be kept longer for improving the system",
            "You can request deletion of your moderation logs with your account"
          ]
        },
        {
          subtitle: "Legal Retention",
          items: [
            "Moderation logs retained for 90 days for legal compliance",
            "Billing transactions handled by Stripe with their retention policies",
            "Data may be retained longer if required by law or legal process",
            "Content flagged for legal issues may be preserved for investigation",
            "We comply with valid legal preservation requests"
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

        {/* Additional Privacy Sections */}
        <div className="space-y-4 mt-8">
          {/* Children's Privacy */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Children&apos;s Privacy</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <p>Studio Moikas is not intended for children under 13 (or 16 in the EU).</p>
                <ul className="space-y-2 mt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We do not knowingly collect data from children</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Parents can contact us to remove any data collected from their children</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We will terminate accounts found to belong to underage users</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* International Data Transfers */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">International Data Transfers</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <p>Your data may be processed in different countries:</p>
                <ul className="space-y-2 mt-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Our servers are primarily located in the United States</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We use standard contractual clauses for EU data transfers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>All data transfers comply with applicable privacy laws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Your data is encrypted during transfer and at rest</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Breach Response */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Data Breach Response</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We will notify affected users within 72 hours of discovering a breach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Notifications will include what data was affected and steps we&apos;re taking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We maintain incident response procedures to minimize impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>You will receive guidance on protecting your account</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* California Privacy Rights */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">California Privacy Rights (CCPA)</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Right to know what personal information we collect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Right to delete your personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Right to opt-out of sale (we do not sell your data)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Right to non-discrimination for exercising privacy rights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Submit requests at privacy@studiomoikas.com</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legal Basis for Processing */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Legal Basis for Processing (EU Users)</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Contract: To provide our AI services you&apos;ve subscribed to</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Legitimate Interests: Security, fraud prevention, service improvement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Consent: For marketing communications (which you can withdraw)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Legal Obligation: To comply with applicable laws</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Changes to Privacy Policy */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Changes to This Policy</h2>
              </div>
              <div className="space-y-2 text-base-content/80">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>We may update this policy to reflect changes in our practices or laws</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Material changes will be notified via email or in-app notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>Continued use after changes constitutes acceptance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span>You can always review the latest version on our website</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Privacy Contact Information</h2>
          <p className="text-base-content/70 mb-6">
            We&apos;re here to help clarify any concerns about your data and privacy.
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Privacy Inquiries:</p>
              <p>
                Email: <a href="https://x.com/moikas_official" target="blank" className="text-primary hover:underline">Moikas</a>
              </p>
            </div>
            <div>
              <p className="font-semibold">Data Requests (GDPR/CCPA):</p>
              <p>
                Email: <a href="https://x.com/moikas_official" target="blank" className="text-primary hover:underline">Moikas</a>
              </p>
            </div>
            <div className="pt-4 border-t border-base-content/20">
              <p className="text-sm">
                General support: Contact{" "}
                <a 
                  href="https://x.com/moikas_official" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline"
                >
                  Moikas
                </a>{" "}
                on X
              </p>
              <p className="text-sm text-base-content/60 mt-2">
                Response time: Usually within 24-48 hours
              </p>
            </div>
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