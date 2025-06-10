/**
 * Comprehensive plan configuration for the application
 * Defines all plan types including the new admin plan
 */

export interface PlanConfig {
  id: string;
  name: string;
  display_name: string;
  description: string;
  renewable_tokens: number;
  permanent_tokens: number;
  features: string[];
  limitations: string[];
  pricing_multiplier: number; // 1.0 = base price, 0.8 = 20% discount, 1.2 = 20% markup
  rate_limit_multiplier: number; // 1.0 = base rate limit, 2.0 = double rate limit
  can_purchase_tokens: boolean;
  has_watermark: boolean;
  priority_queue: boolean;
  unlimited_tokens: boolean;
  is_internal: boolean; // For admin/internal use only
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'free',
    display_name: 'Free',
    description: 'Basic access with limited tokens',
    renewable_tokens: 125,
    permanent_tokens: 0,
    features: [
      'Basic image generation',
      'Basic text analysis',
      'Community support'
    ],
    limitations: [
      'Watermarked images',
      'Queue delays',
      'Limited models',
      'Basic rate limits'
    ],
    pricing_multiplier: 1.2, // 20% markup for free users
    rate_limit_multiplier: 0.5, // Slower rate limits
    can_purchase_tokens: true,
    has_watermark: true,
    priority_queue: false,
    unlimited_tokens: false,
    is_internal: false
  },

  standard: {
    id: 'standard',
    name: 'standard',
    display_name: 'Standard',
    description: 'Full access with generous token allowance',
    renewable_tokens: 20480,
    permanent_tokens: 0,
    features: [
      'All image generation models',
      'All text analysis features',
      'Video generation',
      'Audio generation',
      'Priority support',
      'No watermarks',
      'Priority queue'
    ],
    limitations: [
      'Token consumption applies'
    ],
    pricing_multiplier: 1.0, // Base pricing
    rate_limit_multiplier: 1.0, // Standard rate limits
    can_purchase_tokens: true,
    has_watermark: false,
    priority_queue: true,
    unlimited_tokens: false,
    is_internal: false
  },

  admin: {
    id: 'admin',
    name: 'admin',
    display_name: 'Administrator',
    description: 'Internal admin access with unlimited usage',
    renewable_tokens: 999999999,
    permanent_tokens: 999999999,
    features: [
      'Unlimited token usage',
      'All features unlocked',
      'Admin dashboard access',
      'User management',
      'Analytics access',
      'No rate limits',
      'Priority processing',
      'Internal testing access'
    ],
    limitations: [],
    pricing_multiplier: 0.0, // No cost for admins
    rate_limit_multiplier: 10.0, // Much higher rate limits
    can_purchase_tokens: false, // No need to purchase
    has_watermark: false,
    priority_queue: true,
    unlimited_tokens: true,
    is_internal: true
  }
};

/**
 * Get plan configuration by plan name
 */
export function getPlanConfig(planName: string): PlanConfig {
  const plan = PLAN_CONFIGS[planName];
  if (!plan) {
    console.warn(`Unknown plan: ${planName}, defaulting to free plan`);
    return PLAN_CONFIGS.free;
  }
  return plan;
}

/**
 * Check if a plan has unlimited tokens
 */
export function hasUnlimitedTokens(planName: string): boolean {
  return getPlanConfig(planName).unlimited_tokens;
}

/**
 * Check if a plan is internal/admin only
 */
export function isInternalPlan(planName: string): boolean {
  return getPlanConfig(planName).is_internal;
}

/**
 * Get pricing multiplier for a plan
 */
export function getPricingMultiplier(planName: string): number {
  return getPlanConfig(planName).pricing_multiplier;
}

/**
 * Get rate limit multiplier for a plan
 */
export function getRateLimitMultiplier(planName: string): number {
  return getPlanConfig(planName).rate_limit_multiplier;
}

/**
 * Check if plan should have watermarks
 */
export function shouldHaveWatermark(planName: string): boolean {
  return getPlanConfig(planName).has_watermark;
}

/**
 * Get display-friendly plan information
 */
export function getPlanDisplayInfo(planName: string) {
  const config = getPlanConfig(planName);
  return {
    name: config.display_name,
    description: config.description,
    features: config.features,
    limitations: config.limitations,
    isUnlimited: config.unlimited_tokens,
    isInternal: config.is_internal
  };
}

/**
 * Get all available plans (excluding internal ones for public display)
 */
export function getPublicPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS).filter(plan => !plan.is_internal);
}

/**
 * Get all plans including internal ones
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS);
}