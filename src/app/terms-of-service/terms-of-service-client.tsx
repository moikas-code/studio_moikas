"use client";
import React, { useState } from "react";
import {
  FileText,
  Users,
  Ban,
  CreditCard,
  Scale,
  AlertTriangle,
  Copyright,
  Mail,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Shield,
  Gavel,
} from "lucide-react";
import Link from "next/link";

export default function TermsOfServiceClient() {
  const [expanded_section, set_expanded_section] = useState<string | null>(null);

  const toggle_section = (section: string) => {
    set_expanded_section(expanded_section === section ? null : section);
  };

  const sections = [
    {
      id: "acceptance",
      icon: FileText,
      title: "1. Acceptance of Terms",
      content: [
        {
          subtitle: "Agreement to Terms",
          text: "By accessing or using Studio Moikas, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services.",
        },
        {
          subtitle: "Age Requirements",
          text: "You must be at least 18 years old to use our services. By using Studio Moikas, you represent and warrant that you meet this age requirement.",
        },
        {
          subtitle: "Account Responsibility",
          text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
        },
      ],
    },
    {
      id: "services",
      icon: Sparkles,
      title: "2. Services Description",
      content: [
        {
          subtitle: "AI Generation Tools",
          text: "Studio Moikas provides AI-powered tools for generating images, videos, audio, and text content. These tools include:",
          list: [
            "Image Generation using models like FLUX, SANA, and Stable Diffusion",
            "Video Effects and restoration services",
            "Text-to-Speech and voice cloning capabilities",
            "AI workflow automation through MEMU",
            "Text analysis and content creation tools",
          ],
        },
        {
          subtitle: "Mana Points System",
          text: "Our services operate on a token-based system called Mana Points (MP). Different operations consume different amounts of MP based on complexity and computational requirements.",
        },
        {
          subtitle: "Service Availability",
          text: "While we strive for 99.9% uptime, we do not guarantee uninterrupted access to our services. Maintenance, updates, or technical issues may occasionally affect availability.",
        },
      ],
    },
    {
      id: "usage",
      icon: Users,
      title: "3. Acceptable Use Policy",
      content: [
        {
          subtitle: "Permitted Uses",
          text: "You may use our services for lawful purposes only, including:",
          list: [
            "Creating original content for personal or commercial use",
            "Generating assets for creative projects",
            "Automating workflows for legitimate business purposes",
            "Educational and research activities",
          ],
        },
        {
          subtitle: "Prohibited Content",
          text: "You may NOT use our services to generate or process:",
          list: [
            "Illegal content or content that violates any laws",
            "Adult content involving minors or non-consensual themes",
            "Content that infringes on intellectual property rights",
            "Deepfakes intended to deceive or harm",
            "Hate speech, harassment, or discriminatory content",
            "Content promoting violence or self-harm",
            "Spam or malicious content",
          ],
        },
        {
          subtitle: "Rate Limits",
          text: "We enforce rate limits to ensure fair usage. Free users are limited to 10 requests per minute, while Standard users can make up to 60 requests per minute.",
        },
      ],
    },
    {
      id: "content",
      icon: Copyright,
      title: "4. Content Rights & Licensing",
      content: [
        {
          subtitle: "Your Content",
          text: "You retain all rights to the content you create using our services, subject to the licenses granted below. You are responsible for ensuring you have the right to use any input content.",
        },
        {
          subtitle: "License to Studio Moikas",
          text: "By using our services, you grant us a limited, non-exclusive license to process your input content solely for the purpose of providing the requested services. We do not use your generated content for training our models.",
        },
        {
          subtitle: "Generated Content License",
          text: "Content generated using our services is provided to you under a commercial use license. Free tier users&apos; content includes watermarks, while paid users receive unwatermarked content.",
        },
        {
          subtitle: "Third-Party Rights",
          text: "You acknowledge that generated content may inadvertently resemble existing copyrighted works. You are responsible for verifying that your use of generated content does not infringe on third-party rights.",
        },
      ],
    },
    {
      id: "payment",
      icon: CreditCard,
      title: "5. Payment Terms",
      content: [
        {
          subtitle: "Subscription Plans",
          text: "We offer monthly subscription plans and one-time token purchases. Subscription fees are billed in advance on a monthly basis and are non-refundable except as required by law.",
        },
        {
          subtitle: "Mana Points",
          text: "Monthly Mana Points expire at the end of each billing cycle. Purchased Mana Points never expire and are used after monthly allowances are depleted.",
        },
        {
          subtitle: "Refund Policy",
          text: "Refunds for purchased Mana Points are available within 14 days of purchase if the points remain unused. Subscription refunds are handled on a case-by-case basis.",
        },
        {
          subtitle: "Price Changes",
          text: "We reserve the right to modify our pricing with 30 days notice for existing subscribers. Price changes take effect at the next billing cycle.",
        },
      ],
    },
    {
      id: "privacy",
      icon: Shield,
      title: "6. Privacy & Data Security",
      content: [
        {
          subtitle: "Data Collection",
          text: "We collect and process personal data as described in our Privacy Policy. By using our services, you consent to such processing.",
        },
        {
          subtitle: "Data Security",
          text: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.",
        },
        {
          subtitle: "GDPR Compliance",
          text: "For users in the European Union, we comply with GDPR requirements including data portability, right to deletion, and explicit consent for data processing.",
        },
      ],
    },
    {
      id: "liability",
      icon: Scale,
      title: "7. Limitation of Liability",
      content: [
        {
          subtitle: "Service Warranties",
          text: "Our services are provided &apos;as is&apos; without any warranties, express or implied. We do not guarantee that the services will meet your specific requirements or produce particular results.",
        },
        {
          subtitle: "Liability Limits",
          text: "To the maximum extent permitted by law, Studio Moikas shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.",
        },
        {
          subtitle: "Indemnification",
          text: "You agree to indemnify and hold harmless Studio Moikas from any claims, damages, or expenses arising from your use of our services or violation of these terms.",
        },
      ],
    },
    {
      id: "termination",
      icon: Ban,
      title: "8. Account Termination",
      content: [
        {
          subtitle: "Termination by You",
          text: "You may terminate your account at any time through your account settings. Upon termination, your right to use the services will immediately cease.",
        },
        {
          subtitle: "Termination by Us",
          text: "We reserve the right to suspend or terminate your account for violations of these terms, fraudulent activity, or extended periods of inactivity.",
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination, your access to the services will be revoked. Purchased Mana Points are non-refundable after the 14-day period, regardless of termination reason.",
        },
      ],
    },
    {
      id: "governing",
      icon: Gavel,
      title: "9. Governing Law",
      content: [
        {
          subtitle: "Applicable Law",
          text: "These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.",
        },
        {
          subtitle: "Dispute Resolution",
          text: "Any disputes arising from these terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.",
        },
        {
          subtitle: "Changes to Terms",
          text: "We reserve the right to update these terms at any time. Material changes will be notified via email or through the service interface. Continued use after changes constitutes acceptance.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="max-w-4xl mx-auto text-center">
          <FileText className="w-16 h-16 mx-auto mb-6 text-jade" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Please read these terms carefully before using Studio Moikas
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Last updated: January 17, 2025
          </p>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass dark:glass-dark rounded-2xl p-8 shadow-macos">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-jade" />
            Key Points
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  Must be 18+ years old to use our services
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">You own the content you create</p>
              </div>
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  No illegal or harmful content allowed
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  Monthly MP expire, purchased MP don&apos;t
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">We protect your privacy and data</p>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-jade mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  Services provided &quot;as is&quot; without warranties
                </p>
              </div>
            </div>
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
                      {subsection.text && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{subsection.text}</p>
                      )}
                      {subsection.list && (
                        <ul className="space-y-2">
                          {subsection.list.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              className="text-gray-600 dark:text-gray-400 pl-4 relative"
                            >
                              <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-jade rounded-full" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
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
            Questions About Our Terms?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            If you have any questions about these Terms of Service, please contact us.
          </p>
          <Link
            href="mailto:legal@moikas.com"
            className="inline-block px-6 py-3 bg-gradient-to-r from-jade to-jade-dark text-white font-medium rounded-xl shadow-macos hover:shadow-macos-hover transition-all"
          >
            legal@moikas.com
          </Link>
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
