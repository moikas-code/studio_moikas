import { SupabaseClient } from '@supabase/supabase-js';
import { hasUnlimitedTokens, isInternalPlan } from '../plan_config';

interface TokenDeductionResult {
  success: boolean;
  is_admin: boolean;
  plan_type: string;
  original_cost: number;
  effective_cost: number;
  error?: string;
}

/**
 * Deduct tokens from user balance, but skip deduction for plans with unlimited tokens
 * Still logs usage for analytics purposes
 */
export async function deduct_tokens_with_admin_check(
  supabase: SupabaseClient,
  user_id: string,
  amount: number,
  subscription: {
    renewable_tokens: number;
    permanent_tokens: number;
    plan: string;
  }
): Promise<TokenDeductionResult> {
  try {
    // Check if user is admin and get plan info
    const { data: user_data, error: user_error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user_id)
      .single();

    if (user_error) {
      return {
        success: false,
        is_admin: false,
        plan_type: subscription.plan || 'free',
        original_cost: amount,
        effective_cost: amount,
        error: 'Failed to check user role'
      };
    }

    const is_admin = user_data?.role === 'admin';
    const plan_type = subscription.plan || 'free';
    
    // Check if this plan has unlimited tokens
    const has_unlimited = hasUnlimitedTokens(plan_type) || is_admin;

    // Skip token deduction for unlimited plans (including admin)
    if (has_unlimited) {
      return {
        success: true,
        is_admin,
        plan_type,
        original_cost: amount,
        effective_cost: 0
      };
    }

    // Regular token deduction for limited plans
    const renewable_to_deduct = Math.min(amount, subscription.renewable_tokens);
    const permanent_to_deduct = amount - renewable_to_deduct;

    const { error: deduct_error } = await supabase
      .from('subscriptions')
      .update({
        renewable_tokens: subscription.renewable_tokens - renewable_to_deduct,
        permanent_tokens: subscription.permanent_tokens - permanent_to_deduct
      })
      .eq('user_id', user_id);

    if (deduct_error) {
      return {
        success: false,
        is_admin,
        plan_type,
        original_cost: amount,
        effective_cost: amount,
        error: `Failed to deduct tokens: ${deduct_error.message}`
      };
    }

    return {
      success: true,
      is_admin,
      plan_type,
      original_cost: amount,
      effective_cost: amount
    };
  } catch (error) {
    return {
      success: false,
      is_admin: false,
      plan_type: subscription.plan || 'free',
      original_cost: amount,
      effective_cost: amount,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log usage with enhanced plan tracking
 * Tracks original cost, effective cost, and plan details for analytics
 */
export async function log_usage_with_admin_tracking(
  supabase: SupabaseClient,
  user_id: string,
  tokens_used: number,
  operation_type: string,
  description: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {},
  token_result?: TokenDeductionResult
) {
  const plan_type = token_result?.plan_type || (metadata.plan as string) || 'free';
  const is_admin = token_result?.is_admin || false;
  const original_cost = token_result?.original_cost || tokens_used;
  const effective_cost = token_result?.effective_cost || tokens_used;
  
  return supabase
    .from('usage')
    .insert({
      user_id,
      tokens_used: original_cost,
      operation_type,
      description,
      metadata: {
        ...metadata,
        // Plan information
        plan_type,
        is_admin_usage: is_admin,
        is_internal_plan: isInternalPlan(plan_type),
        
        // Cost tracking
        original_cost,
        effective_cost,
        cost_saved: original_cost - effective_cost,
        
        // Analytics categories
        counted_as_plan: plan_type,
        revenue_impact: effective_cost > 0,
        
        // Plan features
        has_unlimited_tokens: hasUnlimitedTokens(plan_type)
      }
    });
}