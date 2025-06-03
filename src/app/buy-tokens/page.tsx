"use client";
import { Protect } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { Coins, Zap, Shield, ArrowLeft, CheckCircle, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import TokenBalanceCard from "@/app/components/TokenBalanceCard";

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

interface EnhancedProduct extends Product {
  tokens: number;
  bonus: number;
  features: string[];
  value_per_token: number;
  popular: boolean;
}

// Helper function to enhance products with display information
const enhance_products = (products: Product[]): EnhancedProduct[] => {
  // Define token packages based on product order
  const token_configs = [
    { tokens: 2048, bonus: 0 },     // Minor Mana Potion - 2048 @ $2
    { tokens: 6144, bonus: 0 },     // Greater Mana Potion - 6144 @ $6
    { tokens: 16384, bonus: 0 }     // Superior Mana Potion - 16384 @ $16
  ];
  
  return products.map((product, index) => {
    // Get token config based on index, or default to parsing from name
    const config = token_configs[index] || { tokens: 0, bonus: 0 };
    let tokens = config.tokens;
    let bonus = config.bonus;
    
    // Override with metadata if available
    if (product.metadata?.tokens) {
      tokens = parseInt(product.metadata.tokens);
    }
    if (product.metadata?.bonus) {
      bonus = parseInt(product.metadata.bonus);
    }
    
    // If still no tokens, try parsing from product name
    if (tokens === 0) {
      const token_match = product.name.match(/(\d+)/);
      if (token_match) {
        tokens = parseInt(token_match[1]);
      }
    }
    
    // Define features based on product tier
    const features = get_product_features(product, tokens, bonus, index);
    
    const total_tokens = tokens + bonus;
    const value_per_token = total_tokens > 0 ? product.price / total_tokens : 0;
    
    return {
      ...product,
      tokens,
      bonus,
      features,
      value_per_token,
      popular: index === 1 // Middle package is most popular
    };
  });
};

// Helper function to generate features based on product
const get_product_features = (product: Product, tokens: number, bonus: number, index: number): string[] => {
  const base_features = [];
  const total_tokens = tokens + bonus;
  
  // Tier-specific features
  if (index === 0) {
    base_features.push("Perfect for trying premium features");
    base_features.push(`Generate ~${Math.floor(total_tokens / 20)} high-quality images`);
    base_features.push("Never expires");
    base_features.push("$0.001 per MP");
  } else if (index === 1) {
    base_features.push("Most popular choice");
    base_features.push(`Generate ~${Math.floor(total_tokens / 20)}+ images`);
    base_features.push("Best value for regular creators");
    base_features.push("$0.001 per MP");
  } else if (index === 2) {
    base_features.push("For power users & creators");
    base_features.push(`Generate ${Math.floor(total_tokens / 20)}+ images`);
    base_features.push("Maximum value per token");
    base_features.push("Premium support priority");
    base_features.push("$0.001 per MP");
  }
  
  return base_features;
};

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
      .catch(() => {
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
    } catch {
      setError("Failed to start checkout.");
    } finally {
      setPaying(null);
    }
  };

  return (
    <Protect feature={"all_freemium_features"} fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
        {/* Header with back button */}
        <div className="w-full bg-base-100/80 backdrop-blur-sm border-b border-base-300">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn btn-ghost btn-circle">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Buy Mana Points</h1>
                <p className="text-sm text-base-content/70">Permanent tokens that never expire</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Current Balance Card */}
          <TokenBalanceCard show_buy_button={false} className="mb-8" />

          {/* Value Proposition */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Choose Your Mana Pack</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Permanent tokens that never expire. Use them for image generation, AI chat, and premium features.
              <br />
              <span className="text-primary font-medium">The more you buy, the better the value!</span>
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-6 max-w-2xl mx-auto">
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
              <span className="ml-3 text-lg">Loading packages...</span>
            </div>
          ) : (
            <>
              {/* Enhanced Token Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {enhance_products(products).map((product, idx) => {
                  const totalTokens = product.tokens + product.bonus;
                  
                  return (
                    <div
                      key={idx}
                      className={`relative bg-base-100 rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                        product.popular 
                          ? "border-primary border-2 scale-105" 
                          : "border-base-300 hover:border-primary/50"
                      }`}
                    >
                      {product.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-primary to-secondary text-primary-content px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                            <Star className="w-4 h-4 inline mr-1" />
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      
                      <div className="p-6">
                        {/* Package Header */}
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Coins className="w-5 h-5 text-primary" />
                            <span className="text-3xl font-bold">{product.tokens.toLocaleString()}</span>
                            <span className="text-lg text-base-content/60">MP</span>
                          </div>
                          {product.bonus > 0 && (
                            <div className="bg-success/10 text-success px-3 py-1 rounded-full text-sm font-medium inline-block">
                              +{product.bonus} Bonus Tokens!
                            </div>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-center mb-6">
                          <div className="text-4xl font-bold mb-1">${product.price}</div>
                          <div className="text-sm text-base-content/60">
                            <span className="block">Total: {totalTokens.toLocaleString()} MP</span>
                            <span className="text-xs text-base-content/50">
                              ${product.value_per_token.toFixed(4)} per MP
                            </span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 mb-6">
                          {product.features.map((feature: string, featureIdx: number) => (
                            <div key={featureIdx} className="flex items-center gap-3">
                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              <span className="text-sm text-base-content/80">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Buy Button */}
                        <button
                          className={`btn w-full ${
                            product.popular ? "btn-primary" : "btn-outline btn-primary"
                          }`}
                          disabled={!!paying}
                          onClick={() => handlePay(product.price_id)}
                        >
                          {paying === product.price_id ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Processing...
                            </>
                          ) : (
                            `Buy ${product.name}`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Signals & FAQ */}
              <div className="bg-base-100 rounded-2xl shadow-lg p-8 mb-8">
                <h3 className="text-2xl font-bold text-center mb-6">Why Choose Permanent Tokens?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold mb-2">Never Expire</h4>
                    <p className="text-sm text-base-content/70">
                      Your tokens are permanent and will never expire. Use them whenever you want.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-success" />
                    </div>
                    <h4 className="font-bold mb-2">Better Value</h4>
                    <p className="text-sm text-base-content/70">
                      Larger packages offer better value per token. Save more when you buy more.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-info/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-info" />
                    </div>
                    <h4 className="font-bold mb-2">Instant Access</h4>
                    <p className="text-sm text-base-content/70">
                      Tokens are added to your account immediately after purchase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="text-center text-sm text-base-content/60">
                <p className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure payments powered by Stripe • 30-day money-back guarantee
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Protect>
  );
}
