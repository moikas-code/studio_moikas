"use client";
import { Protect } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { Zap, Shield, ArrowLeft, CheckCircle, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import TokenBalanceCard from "@/components/TokenBalanceCard";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  price_id: string;
  tokens: number;
  popular?: boolean;
}

export default function BuyTokensClient() {
  const [products, set_products] = useState<Product[]>([]);
  const [loading, set_loading] = useState(false);
  const [loading_product, set_loading_product] = useState<string | null>(null);

  useEffect(() => {
    fetch_products();
  }, []);

  const fetch_products = async () => {
    try {
      const response = await fetch("/api/stripe/products");
      const data = await response.json();
      set_products(data.products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handle_purchase = async (price_id: string) => {
    set_loading(true);
    set_loading_product(price_id);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_id,
          success_url: `${window.location.origin}/buy-tokens?success=true`,
          cancel_url: `${window.location.origin}/buy-tokens`,
        }),
      });

      const { checkout_url } = await response.json();

      if (checkout_url) {
        window.location.href = checkout_url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      set_loading(false);
      set_loading_product(null);
    }
  };

  const token_benefits = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Never Expire",
      description: "Purchased tokens last forever",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Payment",
      description: "Powered by Stripe",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Instant Access",
      description: "Use immediately after purchase",
    },
  ];

  return (
    <Protect fallback={<div>Please sign in to purchase tokens.</div>}>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="pt-8 pb-12 px-6">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tools
            </Link>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Buy Mana Points
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Purchase additional Mana Points that never expire. Use them anytime across all
                tools.
              </p>
            </div>
          </div>
        </div>

        {/* Token Balance Card */}
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <TokenBalanceCard show_buy_button={false} />
        </div>

        {/* Benefits */}
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {token_benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 glass dark:glass-dark rounded-xl"
              >
                <div className="text-jade">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Choose Your Mana Potion
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className={`relative p-8 rounded-3xl ${
                  product.popular
                    ? "glass dark:glass-dark shadow-xl scale-105"
                    : "bg-gray-50 dark:bg-gray-900 shadow-macos"
                } hover:shadow-macos-hover transform hover:scale-[1.02] transition-all duration-300`}
              >
                {/* Popular Badge */}
                {product.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-jade to-jade-dark dark:text-white text-xs font-medium rounded-full">
                      <Star className="w-3 h-3" />
                      Best Value
                    </div>
                  </div>
                )}

                {/* Product Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-jade/20 to-jade-dark/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-jade" />
                </div>

                {/* Product Details */}
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                  {product.name}
                </h3>

                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {product.tokens.toLocaleString()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">MP</span>
                </div>

                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                  {product.description}
                </p>

                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-2xl font-bold text-jade">${product.price}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    ${((product.price / product.tokens) * 1000).toFixed(2)} per 1K MP
                  </span>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handle_purchase(product.price_id)}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-2xl font-medium transition-all duration-300 ${
                    product.popular
                      ? "bg-gradient-to-r from-jade to-jade-dark dark:text-white hover:shadow-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:shadow-macos hover:bg-gray-200 dark:hover:bg-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading_product === product.price_id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    `Buy ${product.tokens.toLocaleString()} MP`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t border-gray-200 dark:border-gray-800 py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              How Purchased Mana Points Work
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>• Purchased MP never expire and are account-bound</p>
              <p>• Your monthly allowance is used first, then purchased MP</p>
              <p>• All purchases are processed securely through Stripe</p>
              <p>• Refunds available within 14 days if MP are unused</p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="pb-12 px-6">
          <div className="max-w-md mx-auto flex items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure checkout powered by Stripe</span>
          </div>
        </div>
      </div>
    </Protect>
  );
}
