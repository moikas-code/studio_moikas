"use client";
import React, { useEffect, useRef } from "react";

export default function BuyTokensPage() {
  const pricingTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject Stripe script if not already present
    if (
      !document.querySelector(
        'script[src="https://js.stripe.com/v3/pricing-table.js"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      document.body.appendChild(script);
    }
    // Render the custom element
    if (pricingTableRef.current) {
      pricingTableRef.current.innerHTML = `
        <stripe-pricing-table
          pricing-table-id="prctbl_1RRgF7QJcKXoJgq7QczD4a0N"
          publishable-key="pk_live_51ROQIkQJcKXoJgq7QXjpRaBj6Ll7rvhfPjutTxrFfzzlr69lzIUiRvPFvLIiZsmJopSXpen27z5RsNwS2WETvt2D00woFxqnQ6">
        </stripe-pricing-table>
      `;
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full mx-auto">
        <h1 className="text-3xl mx-auto font-bold mb-4">
          Buy Tokens
        </h1>
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
          Purchase permanent tokens to use for image generation and other
          features. Tokens do not expire and can be used at any time. Choose a
          package below:
        </p>
      </div>

      <div className="w-full" ref={pricingTableRef} />
    </div>
  );
}
