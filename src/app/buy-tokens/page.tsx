import { Metadata } from "next";
import BuyTokensClient from "./buy-tokens-client";
import { generate_metadata, generate_product_schema } from "@/lib/seo";
import Script from "next/script";

export const metadata: Metadata = generate_metadata({
  title: "Buy Mana Points - Never Expire",
  description:
    "Purchase Mana Points for AI image, video & audio generation. Starting from $2. Never expire, use anytime. Instant delivery via Stripe.",
  keywords: [
    "buy mana points",
    "AI credits",
    "purchase tokens",
    "Studio Moikas tokens",
    "AI generation credits",
    "permanent tokens",
    "pay as you go",
  ],
  canonical_path: "/buy-tokens",
});

export default function Buy_tokens_page() {
  const mana_potion_schema = generate_product_schema({
    name: "Mana Points",
    description:
      "Permanent credits for AI image, video, and audio generation. Never expire, use across all Studio Moikas tools.",
    offers: {
      price: "2",
      currency: "USD",
      availability: "https://schema.org/InStock",
    },
  });

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(mana_potion_schema),
        }}
      />
      <BuyTokensClient />
    </>
  );
}
