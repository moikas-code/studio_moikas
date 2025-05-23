"use client";
import { Protect } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";

// Example product IDs (replace with your actual Stripe product IDs)
const PRODUCT_IDS = [
  "prod_SMOj2uZ9YSSDIB", // Minor Mana Potion
  "prod_SMOkzIx2sykhIT", // Greater Mana Potion
  "prod_SMOmkz8PBtRM0l", // Superior Mana Potion
];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  price_id: string;
  currency: string;
  metadata?: Record<string, string>;
}

export default function BuyTokensPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/stripe/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_ids: PRODUCT_IDS }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProducts(data.products);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load products.");
        setLoading(false);
      });
  }, []);

  const handlePay = async (price_id: string) => {
    setPaying(price_id);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout.");
      }
    } catch (err) {
      setError("Failed to start checkout.");
    } finally {
      setPaying(null);
    }
  };

  return (
    <Protect feature={"all_freemium_features"} fallback={<div>Loading...</div>}>
      <div className="w-full flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full mx-auto">
          <h1 className="text-3xl mx-auto font-bold mb-4">Buy Tokens</h1>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            Purchase permanent tokens to use for image generation and other
            features. Tokens do not expire and can be used at any time. Choose a
            package below:
          </p>
        </div>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        {loading ? (
          <div className="my-8">Loading products...</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className={`flex flex-col items-center bg-white dark:bg-base-200 rounded-xl shadow-lg border border-base-200 p-6 w-full max-w-xs ${
                  idx === 1 ? "border-2 border-primary scale-105" : ""
                }`}
              >
                {idx === 1 && (
                  <span className="mb-2 px-2 py-1 bg-primary text-white text-xs rounded">
                    Most popular
                  </span>
                )}
                <h2 className="text-xl font-bold mb-2 text-center">
                  {product.name}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4 text-center whitespace-pre-line">
                  {product.description}
                </p>
                <div className="text-3xl font-bold mb-4">${product.price}</div>
                <button
                  className="btn btn-primary w-full"
                  disabled={!!paying}
                  onClick={() => handlePay(product.price_id)}
                >
                  {paying === product.price_id ? "Processing..." : "Pay"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protect>
  );
}
