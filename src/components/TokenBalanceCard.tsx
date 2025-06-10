import React, { useContext } from "react";
import { MpContext } from "@/context/mp_context";
import { Coins, Zap, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

interface token_balance_card_props {
  show_buy_button?: boolean;
  compact?: boolean;
  className?: string;
}

export default function TokenBalanceCard({ 
  show_buy_button = true, 
  compact = false,
  className = ""
}: token_balance_card_props) {
  const { mp_tokens, renewable_tokens, permanent_tokens, plan, is_loading_tokens } = useContext(MpContext);

  if (is_loading_tokens) {
    return (
      <div className={`bg-base-100 rounded-xl p-4 border border-base-300 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-base-300 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-base-300 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{mp_tokens ?? 0} MP</p>
              <p className="text-xs text-base-content/60">
                {renewable_tokens ?? 0} renewable • {permanent_tokens ?? 0} permanent
              </p>
            </div>
          </div>
          {show_buy_button && (
            <Link href="/buy-tokens" className="btn btn-primary btn-sm">
              Buy More
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/20 rounded-xl">
          <Coins className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Your Mana Balance</h3>
          <p className="text-sm text-base-content/70">Current token status</p>
        </div>
        {show_buy_button && (
          <Link href="/buy-tokens" className="btn btn-primary ml-auto">
            <Coins className="w-4 h-4" />
            Buy More Tokens
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-base-100/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Total Balance</span>
          </div>
          <p className="text-2xl font-bold">{mp_tokens ?? 0} MP</p>
        </div>
        
        <div className="bg-base-100/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Renewable</span>
          </div>
          <p className="text-2xl font-bold">{renewable_tokens ?? 0} MP</p>
          <p className="text-xs text-base-content/60">Refills monthly</p>
        </div>
        
        <div className="bg-base-100/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-info" />
            <span className="text-sm font-medium">Permanent</span>
          </div>
          <p className="text-2xl font-bold">{permanent_tokens ?? 0} MP</p>
          <p className="text-xs text-base-content/60">Never expires</p>
        </div>
      </div>
      
      {plan && (
        <div className="p-3 bg-base-100/30 rounded-lg">
          <p className="text-sm">
            Current Plan: <span className="font-semibold capitalize">{plan}</span>
            {plan === "free" && (
              <span className="ml-2">
                <Link href="/pricing" className="link text-primary text-xs">
                  Upgrade for more monthly tokens
                </Link>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}