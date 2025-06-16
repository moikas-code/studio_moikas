"use client"
import React, { useState } from "react";
import { FileText, Users, Ban, CreditCard, Scale, AlertTriangle, Copyright, Mail, ChevronDown, Sparkles, Image as ImageIcon, Video, Mic, Bot, Shield, Globe, Gavel } from "lucide-react";
import Link from "next/link";

export default function Terms_of_service_page() {
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
          items: [
            "By accessing Studio Moikas, you agree to be bound by these Terms of Service",
            "If you disagree with any part of these terms, you may not use our services",
            "You must be at least 13 years old to use Studio Moikas",
            "If using on behalf of an organization, you confirm you have authority to bind them to these terms"
          ]
        },
        {
          subtitle: "Updates to Terms",
          items: [
            "We may update these terms at any time to reflect service changes or legal requirements",
            "Continued use after updates constitutes acceptance of the new terms",
            "Major changes will be announced via email or in-app notification",
            "You can always find the latest version of these terms on our website"
          ]
        }
      ]
    },
    {
      id: "services",
      icon: Sparkles,
      title: "2. Our Services",
      content: [
        {
          subtitle: "AI Creative Tools",
          items: [
            "Image Generation: Create AI-generated images from text prompts using FLUX, SANA, Stable Diffusion, and other models",
            "Image Editor: Edit and enhance images with AI-powered tools",
            "Video Effects: Generate and enhance videos with AI effects",
            "Audio Tools: Text-to-speech, voice cloning, and audio processing",
            "Text Analyzer: AI-powered text analysis and generation",
            "MEMU: Visual workflow editor for AI automation (Standard/Admin plans only)"
          ]
        },
        {
          subtitle: "Mana Points (MP) System",
          items: [
            "MP is our virtual currency for using AI generation features",
            "Free plan: 125 MP monthly allowance",
            "Standard plan: 20,480 MP monthly allowance",
            "Admin plan: Unlimited MP usage",
            "Additional MP can be purchased as needed",
            "Monthly MP expires at the end of billing cycle, purchased MP never expires"
          ]
        },
        {
          subtitle: "Content Moderation",
          items: [
            "All prompts are automatically screened using AI (powered by xAI's Grok) before generation",
            "Moderation aims to prevent illegal and harmful content while allowing creative freedom",
            "Adult/NSFW content between consenting adults is permitted",
            "Blocked prompts do not consume your Mana Points",
            "False positive reports can be submitted for admin review",
            "Moderation decisions are logged for safety and compliance"
          ]
        }
      ]
    },
    {
      id: "user-responsibilities",
      icon: Users,
      title: "3. User Responsibilities",
      content: [
        {
          subtitle: "Account Security",
          items: [
            "You are responsible for maintaining the security of your account",
            "Keep your login credentials confidential",
            "Notify us immediately of any unauthorized access",
            "You are liable for all activities under your account"
          ]
        },
        {
          subtitle: "Acceptable Use",
          items: [
            "Use Studio Moikas only for lawful purposes",
            "Respect intellectual property rights of others",
            "Do not attempt to bypass usage limits or security measures",
            "Do not use automated systems to access the service without permission",
            "Do not resell or redistribute generated content as a competing service"
          ]
        },
        {
          subtitle: "Content Guidelines",
          items: [
            "You must have rights to any content you upload or reference",
            "Generated content must comply with our content policy",
            "No creation of harmful, illegal, or deceptive content",
            "No impersonation or misleading representations",
            "We may remove content that violates these guidelines"
          ]
        }
      ]
    },
    {
      id: "prohibited-uses",
      icon: Ban,
      title: "4. Prohibited Uses",
      content: [
        {
          subtitle: "You May Not",
          items: [
            "Generate content that is illegal in your jurisdiction",
            "Create any content involving minors (under 18) in sexual or suggestive contexts",
            "Generate child sexual abuse material (CSAM) or content that sexualizes minors",
            "Create deepfakes of real people without consent",
            "Use the service for spam, phishing, or malicious activities",
            "Attempt to reverse engineer or copy our technology",
            "Circumvent rate limits or abuse the API",
            "Share your account with others or create multiple free accounts"
          ]
        },
        {
          subtitle: "Content Restrictions",
          items: [
            "No illegal content including CSAM, non-consensual intimate images, or content that violates local laws",
            "No content depicting minors in any sexual, suggestive, or inappropriate context",
            "No violent content intended to harm or threaten real individuals",
            "No content that promotes hatred or discrimination against protected groups",
            "No content that infringes copyrights or trademarks",
            "No generation of private personal data or sensitive information without consent",
            "Adult/NSFW content is permitted only between consenting adults and must not involve minors"
          ]
        },
        {
          subtitle: "Moderation Compliance",
          items: [
            "Your prompts will be automatically screened before generation",
            "Attempting to bypass moderation systems is strictly prohibited",
            "Repeated violations may result in account suspension or termination",
            "False positive reports must be made in good faith"
          ]
        }
      ]
},
    {
      id: "intellectual-property",
      icon: Copyright,
      title: "5. Intellectual Property",
      content: [
        {
          subtitle: "Your Content",
          items: [
            "You retain ownership of original content you create",
            "You grant us a license to process and store your content for service delivery",
            "You are responsible for ensuring you have rights to input content",
            "Generated content may be subject to AI model licenses"
          ]
        },
        {
          subtitle: "Our Property",
          items: [
            "Studio Moikas platform, design, and technology remain our property",
            "Our trademarks, logos, and branding are protected",
            "You may not copy, modify, or distribute our software",
            "Feedback you provide may be used to improve our services"
          ]
        },
        {
          subtitle: "AI-Generated Content",
          items: [
            "You own the rights to content you generate (subject to input rights)",
            "Free plan content includes watermarks which must not be removed",
            "We don't claim ownership of your generated content",
            "You're responsible for how you use generated content",
            "We do not train our AI models on your generated content without explicit permission",
            "Third-party AI models (FLUX, SANA, etc.) may have their own terms"
          ]
        }
      ]
    },
    {
      id: "payment",
      icon: CreditCard,
      title: "6. Payment & Billing",
      content: [
        {
          subtitle: "Subscription Plans",
          items: [
            "Free: Limited features with 125 MP/month",
            "Standard ($20/month): Full features with 20,480 MP/month",
            "Subscriptions auto-renew unless cancelled",
            "Prices may change with 30 days notice"
          ]
        },
        {
          subtitle: "Payment Terms",
          items: [
            "Payment processed securely through Stripe",
            "All fees are in USD unless otherwise stated",
            "Taxes may apply based on your location",
            "Failed payments may result in service suspension",
            "No refunds for unused monthly MP allowance"
          ]
        },
        {
          subtitle: "Additional MP Purchases",
          items: [
            "MP can be purchased in various packages",
            "Purchased MP never expires",
            "No refunds for purchased MP",
            "MP cannot be transferred between accounts",
            "Promotional MP may have expiration dates"
          ]
        }
      ]
    },
    {
      id: "liability",
      icon: Scale,
      title: "7. Limitation of Liability",
      content: [
        {
          subtitle: "Service Disclaimer",
          items: [
            "Studio Moikas is provided 'as is' without warranties",
            "We don't guarantee uninterrupted or error-free service",
            "AI outputs may not always be accurate or appropriate",
            "We're not liable for content you create or how you use it"
          ]
        },
        {
          subtitle: "Limitation of Damages",
          items: [
            "Our liability is limited to the amount you paid in the last 12 months",
            "We're not liable for indirect, incidental, or consequential damages",
            "We're not responsible for lost profits or data",
            "Some jurisdictions don't allow these limitations"
          ]
        }
      ]
    },
    {
      id: "termination",
      icon: AlertTriangle,
      title: "8. Termination",
      content: [
        {
          subtitle: "Termination by You",
          items: [
            "You can cancel your subscription at any time",
            "Account deletion can be requested through support",
            "Unused monthly MP is not refunded upon cancellation",
            "Purchased MP remains available until account deletion"
          ]
        },
        {
          subtitle: "Termination by Us",
          items: [
            "We may suspend or terminate accounts that violate these terms",
            "Serious violations may result in immediate termination",
            "We may terminate service with 30 days notice",
            "No refunds for termination due to violations"
          ]
        }
      ]
    },
    {
      id: "dmca",
      icon: Copyright,
      title: "9. DMCA & Copyright Policy",
      content: [
        {
          subtitle: "Copyright Infringement Claims",
          items: [
            "We respect intellectual property rights and respond to valid DMCA takedown notices",
            "To report copyright infringement, send a DMCA notice to: x.com/moikas_official",
            "Include: (1) Your signature, (2) Identification of copyrighted work, (3) URL of infringing content, (4) Your contact information, (5) Good faith statement, (6) Statement of accuracy under penalty of perjury"
          ]
        },
        {
          subtitle: "Counter-Notification",
          items: [
            "If you believe content was wrongly removed, you may submit a counter-notice",
            "Counter-notices must include: (1) Your signature, (2) Identification of removed content, (3) Statement under penalty of perjury, (4) Consent to jurisdiction",
            "We will forward counter-notices to the original complainant",
            "Content may be restored after 10-14 business days unless legal action is filed"
          ]
        },
        {
          subtitle: "Repeat Infringers",
          items: [
            "We maintain a policy of terminating repeat copyright infringers",
            "Users with multiple valid DMCA complaints may be permanently banned",
            "False DMCA claims may result in legal liability"
          ]
        }
      ]
    },
    {
      id: "indemnification",
      icon: Shield,
      title: "10. Indemnification",
      content: [
        {
          subtitle: "Your Indemnification Obligations",
          items: [
            "You agree to indemnify, defend, and hold harmless Studio Moikas, its officers, directors, employees, agents, and affiliates",
            "This covers any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from:",
            "- Your use or misuse of our services",
            "- Your violation of these Terms of Service",
            "- Your violation of any third-party rights, including intellectual property rights",
            "- Any content you create, upload, or distribute through our platform",
            "- Your violation of any applicable laws or regulations"
          ]
        },
        {
          subtitle: "Defense and Settlement",
          items: [
            "We reserve the right to assume exclusive defense of any claim subject to indemnification",
            "You agree to cooperate fully in the defense of such claims",
            "You may not settle any claim without our prior written consent"
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
            <Scale className="w-5 h-5 text-primary" />
            <span className="font-semibold">Legal Agreement</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Please read these terms carefully before using Studio Moikas. They outline the rules and guidelines for using our AI creative platform.
          </p>
          <p className="text-sm text-base-content/60 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Quick Overview */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Key Points
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-base-content/80">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">You own the content you create</span>
              </div>
              <div className="flex items-start gap-2">
                <Video className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">Respect intellectual property rights</span>
              </div>
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">No harmful or illegal content</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">AI outputs may vary in accuracy</span>
              </div>
              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">Subscriptions auto-renew monthly</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm">MP expires monthly (except purchased)</span>
              </div>
            </div>
          </div>
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

        {/* Additional Legal Sections */}
        <div className="space-y-4 mt-8">
          {/* Governing Law */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gavel className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">11. Governing Law & Disputes</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Governing Law</h3>
                  <p className="text-base-content/80">
                    These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Arbitration Agreement</h3>
                  <ul className="space-y-2 text-base-content/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Any disputes shall be resolved through binding arbitration under the American Arbitration Association (AAA) rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Arbitration will be conducted in Delaware, or online if mutually agreed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>You waive any right to a jury trial or class action lawsuit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Small claims court remains available for qualifying disputes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* International Users */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">12. International Users</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Age Requirements</h3>
                  <ul className="space-y-2 text-base-content/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>United States: Must be 13 years or older</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>European Union: Must be 16 years or older (or 13 with parental consent where allowed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Other regions: Must meet your local age of digital consent</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">GDPR Rights (EU Users)</h3>
                  <ul className="space-y-2 text-base-content/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Right to access your personal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Right to rectification of inaccurate data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Right to erasure (&quot;right to be forgotten&quot;)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Right to data portability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Right to object to processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Contact us at privacy@studiomoikas.com to exercise these rights</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Terms */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">13. Additional Terms</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">API Terms</h3>
                  <ul className="space-y-2 text-base-content/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>API access is available for Standard and Admin plans only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Rate limits apply based on your subscription tier</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Commercial use requires explicit written permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Bulk generation for resale is prohibited without enterprise agreement</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Model Availability</h3>
                  <ul className="space-y-2 text-base-content/80">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>AI models may be added, removed, or updated at any time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>We&apos;ll notify you of major model changes when possible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>No guarantee of continued availability of specific models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span>Model performance and outputs may vary over time</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Age Verification</h3>
                  <p className="text-base-content/80 mb-2">
                    By using our service, you affirm that you meet the minimum age requirements. We may request age verification at any time. If we determine you are underage, your account will be terminated immediately without refund.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Force Majeure</h3>
                  <p className="text-base-content/80">
                    We are not liable for failures or delays due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation facilities, fuel, energy, labor or materials.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Severability</h3>
                  <p className="text-base-content/80">
                    If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">Export Controls</h3>
                  <p className="text-base-content/80">
                    You may not use or export our services in violation of U.S. export laws and regulations. Our AI technology may be subject to export controls and you agree to comply with all applicable international and national laws.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Entire Agreement */}
          <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">14. Entire Agreement</h2>
              </div>
              <div className="text-base-content/80">
                <p>
                  These Terms constitute the entire agreement between you and Studio Moikas regarding our services and supersede all prior agreements and understandings, whether written or oral, relating to the subject matter of these Terms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Legal Contact Information</h2>
          <p className="text-base-content/70 mb-6">
            For questions about these Terms of Service or legal matters:
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Legal Inquiries:</p>
              <p>
                Email: <a href="https://x.com/moikas_official" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Moikas</a>
              </p>
            </div>
            <div>
              <p className="font-semibold">DMCA Agent:</p>
              <p>
                Email: <a href="https://x.com/moikas_official" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Moikas</a>
              </p>
            </div>
            <div>
              <p className="font-semibold">Privacy Inquiries:</p>
              <p>
                Email: <a href="https://x.com/moikas_official" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Moikas</a>
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
            </div>
          </div>
        </div>

        {/* Agreement Statement */}
        <div className="mt-8 text-center p-6 bg-primary/5 rounded-2xl">
          <p className="text-sm text-base-content/70">
            By using Studio Moikas, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
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