import { Metadata } from "next";
import PricingClient from "./pricing-client";
import { generate_metadata, generate_faq_schema, generate_product_schema } from "@/lib/seo";
import Script from "next/script";

export const metadata: Metadata = generate_metadata({
  title: "Pricing - Affordable AI Creative Tools",
  description:
    "Simple, transparent pricing for AI image, video & audio generation. Start free with 125 MP monthly. Upgrade to Standard for 20,480 MP at $20/month.",
  keywords: [
    "AI pricing",
    "mana points",
    "subscription plans",
    "AI generator pricing",
    "Studio Moikas pricing",
    "free AI tools",
    "pay as you go",
    "AI credits",
  ],
  canonical_path: "/pricing",
});

export default function Pricing_page() {
  const faq_schema = generate_faq_schema([
    {
      question: "What are Mana Points (MP)?",
      answer:
        "Mana Points are the currency used to generate content in Studio Moikas. Each creation consumes MP based on the complexity and model used.",
    },
    {
      question: "Do unused Mana Points roll over?",
      answer:
        "Monthly Mana Points expire at the end of your billing cycle. However, purchased Mana Points never expire and are used after your monthly allowance.",
    },
    {
      question: "Can I upgrade or downgrade anytime?",
      answer:
        "Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.",
    },
    {
      question: "What happens when I run out of Mana Points?",
      answer:
        "You can purchase additional Mana Points anytime, or wait for your monthly allowance to refresh on your billing date.",
    },
  ]);

  const standard_plan_schema = generate_product_schema({
    name: "Studio Moikas Standard Plan",
    description:
      "Professional AI creative tools with 20,480 Mana Points monthly, priority processing, and no watermarks.",
    price: "20",
    currency: "USD",
  });

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faq_schema),
        }}
      />
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(standard_plan_schema),
        }}
      />
      <PricingClient />
    </>
  );
}
