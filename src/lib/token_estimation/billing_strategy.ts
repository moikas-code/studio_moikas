/**
 * Smart billing strategy for chat operations
 * Handles pre-charging, actual usage tracking, and adjustments
 */

import { precise_token_counter, token_usage_result } from './precise_token_counter';

export interface billing_transaction {
  id: string;
  user_id: string;
  session_id: string;
  pre_charge_amount: number;
  actual_charge_amount?: number;
  adjustment_amount?: number;
  status: 'pending' | 'completed' | 'adjusted' | 'refunded';
  token_usage?: token_usage_result;
  created_at: Date;
  completed_at?: Date;
}

export class billing_strategy {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Step 1: Pre-charge user before making AI call
   * This ensures we don't provide free responses if deduction fails
   */
  async pre_charge_user(
    user_id: string,
    session_id: string,
    input_text: string,
    model: string
  ): Promise<{ success: boolean; transaction_id: string; pre_charge_amount: number; error?: string }> {
    try {
      // Estimate maximum possible cost
      const pre_charge_amount = precise_token_counter.pre_estimate_cost(input_text, model);
      
      // Check if user has sufficient balance
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('renewable_tokens, permanent_tokens')
        .eq('user_id', user_id)
        .single();
      
      if (!subscription) {
        return { success: false, transaction_id: '', pre_charge_amount: 0, error: 'No subscription found' };
      }
      
      const total_available = subscription.renewable_tokens + subscription.permanent_tokens;
      if (total_available < pre_charge_amount) {
        return { 
          success: false, 
          transaction_id: '', 
          pre_charge_amount, 
          error: `Insufficient tokens. Need ${pre_charge_amount} MP, have ${total_available} MP` 
        };
      }
      
      // Create transaction record
      const transaction_id = crypto.randomUUID();
      
      // Pre-deduct tokens (we'll adjust later)
      const renewable_to_use = Math.min(subscription.renewable_tokens, pre_charge_amount);
      const permanent_to_use = Math.max(0, pre_charge_amount - renewable_to_use);
      
      const { error: deduct_error } = await this.supabase.rpc('deduct_tokens', {
        p_user_id: user_id,
        p_renewable_tokens: renewable_to_use,
        p_permanent_tokens: permanent_to_use
      });
      
      if (deduct_error) {
        return { success: false, transaction_id: '', pre_charge_amount: 0, error: 'Token deduction failed' };
      }
      
      // Log the pre-charge transaction
      await this.supabase
        .from('billing_transactions')
        .insert({
          id: transaction_id,
          user_id,
          session_id,
          pre_charge_amount,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      return { success: true, transaction_id, pre_charge_amount };
    } catch (error) {
      console.error('Pre-charge error:', error);
      return { success: false, transaction_id: '', pre_charge_amount: 0, error: 'Pre-charge failed' };
    }
  }
  
  /**
   * Step 2: Calculate actual usage and adjust billing
   * Called after AI response is received
   */
  async finalize_billing(
    transaction_id: string,
    user_id: string,
    input_text: string,
    ai_response: any,
    model: string
  ): Promise<{ success: boolean; final_cost: number; adjustment: number; error?: string }> {
    try {
      // Get the original transaction
      const { data: transaction } = await this.supabase
        .from('billing_transactions')
        .select('*')
        .eq('id', transaction_id)
        .eq('user_id', user_id)
        .single();
      
      if (!transaction || transaction.status !== 'pending') {
        return { success: false, final_cost: 0, adjustment: 0, error: 'Transaction not found or not pending' };
      }
      
      // Calculate actual token usage
      const token_usage = precise_token_counter.hybrid_calculation(input_text, ai_response, model);
      const actual_cost = token_usage.estimated_cost_mp;
      const pre_charged = transaction.pre_charge_amount;
      const adjustment = actual_cost - pre_charged;
      
      if (adjustment > 0) {
        // Need to charge more
        const { data: subscription } = await this.supabase
          .from('subscriptions')
          .select('renewable_tokens, permanent_tokens')
          .eq('user_id', user_id)
          .single();
        
        const total_available = subscription.renewable_tokens + subscription.permanent_tokens;
        if (total_available < adjustment) {
          // Insufficient tokens for adjustment - refund pre-charge and fail
          await this.refund_transaction(transaction_id, user_id);
          return { 
            success: false, 
            final_cost: actual_cost, 
            adjustment, 
            error: `Insufficient tokens for adjustment. Need ${adjustment} more MP` 
          };
        }
        
        // Charge the additional amount
        const renewable_to_use = Math.min(subscription.renewable_tokens, adjustment);
        const permanent_to_use = Math.max(0, adjustment - renewable_to_use);
        
        await this.supabase.rpc('deduct_tokens', {
          p_user_id: user_id,
          p_renewable_tokens: renewable_to_use,
          p_permanent_tokens: permanent_to_use
        });
        
      } else if (adjustment < 0) {
        // Refund excess
        const refund_amount = Math.abs(adjustment);
        
        // Add tokens back (prioritize renewable)
        await this.supabase
          .from('subscriptions')
          .update({
            renewable_tokens: this.supabase.raw(`renewable_tokens + ${refund_amount}`)
          })
          .eq('user_id', user_id);
      }
      
      // Update transaction record
      await this.supabase
        .from('billing_transactions')
        .update({
          actual_charge_amount: actual_cost,
          adjustment_amount: adjustment,
          token_usage: token_usage,
          status: adjustment === 0 ? 'completed' : 'adjusted',
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction_id);
      
      // Log usage for analytics
      await this.supabase
        .from('usage')
        .insert({
          user_id,
          action: 'chat_completion',
          tokens_used: actual_cost,
          metadata: {
            transaction_id,
            token_usage,
            model,
            calculation_method: token_usage.calculation_method,
            pre_charge_amount: pre_charged,
            adjustment
          }
        });
      
      return { success: true, final_cost: actual_cost, adjustment };
    } catch (error) {
      console.error('Billing finalization error:', error);
      // Attempt to refund on error
      await this.refund_transaction(transaction_id, user_id);
      return { success: false, final_cost: 0, adjustment: 0, error: 'Billing finalization failed' };
    }
  }
  
  /**
   * Refund a transaction (if AI call fails)
   */
  async refund_transaction(transaction_id: string, user_id: string): Promise<boolean> {
    try {
      const { data: transaction } = await this.supabase
        .from('billing_transactions')
        .select('*')
        .eq('id', transaction_id)
        .eq('user_id', user_id)
        .single();
      
      if (!transaction) return false;
      
      // Refund the pre-charged amount
      await this.supabase
        .from('subscriptions')
        .update({
          renewable_tokens: this.supabase.raw(`renewable_tokens + ${transaction.pre_charge_amount}`)
        })
        .eq('user_id', user_id);
      
      // Mark transaction as refunded
      await this.supabase
        .from('billing_transactions')
        .update({
          status: 'refunded',
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction_id);
      
      return true;
    } catch (error) {
      console.error('Refund error:', error);
      return false;
    }
  }
}