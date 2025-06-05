/**
 * Centralized Pricing Configuration
 * 
 * This file manages all pricing multipliers and upcharges across the platform.
 * All generation types (image, video, text, audio) use these multipliers.
 */

export interface PricingConfig {
  standard: number;
  free: number;
}

/**
 * Standard upcharge multipliers for different user tiers
 * These are applied to all generation costs (image, video, text, audio)
 */
export const PRICING_MULTIPLIERS: PricingConfig = {
  standard: 1.3,  // 30% markup for standard users
  free: 1.6       // 60% markup for free users
};

/**
 * Get the appropriate pricing multiplier based on plan type
 * @param planType - The user's subscription plan type
 * @returns The multiplier to apply to base costs
 */
export function get_pricing_multiplier(planType: string | null): number {
  if (planType === 'standard') {
    return PRICING_MULTIPLIERS.standard;
  }
  return PRICING_MULTIPLIERS.free;
}

/**
 * Calculate the final cost with plan-based markup
 * @param baseCost - The base cost before markup
 * @param planType - The user's subscription plan type
 * @returns The final cost with appropriate markup applied
 */
export function calculate_final_cost(baseCost: number, planType: string | null): number {
  const multiplier = get_pricing_multiplier(planType);
  return Math.ceil(baseCost * multiplier);
}