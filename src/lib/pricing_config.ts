/**
 * Centralized Pricing Configuration
 * 
 * This file manages all pricing multipliers and upcharges across the platform.
 * All generation types (image, video, text, audio) use these multipliers.
 */

import { getPricingMultiplier, hasUnlimitedTokens } from './plan_config';

export interface PricingConfig {
  standard: number;
  free: number;
  admin: number;
}

/**
 * Legacy pricing multipliers - now replaced by plan_config.ts
 * @deprecated Use getPricingMultiplier from plan_config.ts instead
 */
export const PRICING_MULTIPLIERS: PricingConfig = {
  standard: 1.0,  // Base pricing for standard users
  free: 1.2,      // 20% markup for free users
  admin: 0.0      // No cost for admins
};

/**
 * Get the appropriate pricing multiplier based on plan type
 * @param planType - The user's subscription plan type
 * @returns The multiplier to apply to base costs
 */
export function get_pricing_multiplier(planType: string | null): number {
  if (!planType) {
    return getPricingMultiplier('free');
  }
  
  // Admin users get unlimited usage at no cost
  if (planType === 'admin') {
    return 0.0;
  }
  
  return getPricingMultiplier(planType);
}

/**
 * Calculate the final cost with plan-based markup
 * @param baseCost - The base cost before markup
 * @param planType - The user's subscription plan type
 * @returns The final cost with appropriate markup applied
 */
export function calculate_final_cost(baseCost: number, planType: string | null): number {
  if (!planType) {
    planType = 'free';
  }
  
  // Admin users don't pay for usage
  if (hasUnlimitedTokens(planType)) {
    return 0;
  }
  
  const multiplier = get_pricing_multiplier(planType);
  return Math.ceil(baseCost * multiplier);
}

/**
 * Check if a plan should be charged for usage
 * @param planType - The user's subscription plan type
 * @returns Whether the plan should be charged
 */
export function shouldChargeForUsage(planType: string | null): boolean {
  if (!planType) {
    return true;
  }
  
  return !hasUnlimitedTokens(planType);
}