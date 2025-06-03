/**
 * Precise token counting for accurate billing
 * Uses tiktoken for GPT-style tokenization and model-specific adjustments
 */

export interface token_usage_result {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_mp: number;
  model_used: string;
  calculation_method: 'actual' | 'estimated' | 'hybrid';
}

export interface model_token_config {
  tokens_per_mp: number; // How many tokens = 1 MP
  min_cost_mp: number;   // Minimum cost per request
  estimation_accuracy?: number; // Multiplier for estimation (default 1.0)
}

// Model configurations for accurate pricing
const MODEL_CONFIGS: Record<string, model_token_config> = {
  'grok-3-mini-latest': {
    tokens_per_mp: 3000,
    min_cost_mp: 1,
    estimation_accuracy: 1.1 // Slightly overestimate for safety
  },
  'grok-2-latest': {
    tokens_per_mp: 1500,
    min_cost_mp: 2,
    estimation_accuracy: 1.2
  },
  'grok-2-mini-latest': {
    tokens_per_mp: 2500,
    min_cost_mp: 1,
    estimation_accuracy: 1.1
  },
  'fal-ai/flux/schnell': {
    tokens_per_mp: 1, // Image models work differently
    min_cost_mp: 4
  }
};

export class precise_token_counter {
  /**
   * Get actual token usage from AI response metadata
   */
  static extract_actual_usage(
    ai_response: any, 
    model: string,
    input_text: string
  ): token_usage_result {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['grok-3-mini-latest'];
    
    if (ai_response.usage_metadata) {
      const input_tokens = ai_response.usage_metadata.input_tokens || 0;
      const output_tokens = ai_response.usage_metadata.output_tokens || 0;
      const total_tokens = input_tokens + output_tokens;
      
      return {
        input_tokens,
        output_tokens,
        total_tokens,
        estimated_cost_mp: this.calculate_cost(total_tokens, config),
        model_used: model,
        calculation_method: 'actual'
      };
    }
    
    // Fallback to estimation
    return this.estimate_usage(input_text, ai_response.content || '', model);
  }

  /**
   * Estimate token usage when actual data isn't available
   */
  static estimate_usage(
    input_text: string, 
    output_text: string, 
    model: string
  ): token_usage_result {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['grok-3-mini-latest'];
    
    // More accurate estimation based on text characteristics
    const input_tokens = this.estimate_tokens_from_text(input_text);
    const output_tokens = this.estimate_tokens_from_text(output_text);
    const total_tokens = input_tokens + output_tokens;
    
    // Apply estimation accuracy multiplier for safety
    const adjusted_tokens = Math.ceil(total_tokens * (config.estimation_accuracy || 1.0));
    
    return {
      input_tokens,
      output_tokens,
      total_tokens: adjusted_tokens,
      estimated_cost_mp: this.calculate_cost(adjusted_tokens, config),
      model_used: model,
      calculation_method: 'estimated'
    };
  }

  /**
   * Pre-estimate cost before making AI call for budget checking
   */
  static pre_estimate_cost(input_text: string, model: string): number {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['grok-3-mini-latest'];
    
    // Estimate input tokens
    const input_tokens = this.estimate_tokens_from_text(input_text);
    
    // Estimate output tokens (assume 2-3x input for conversational AI)
    const estimated_output_tokens = Math.ceil(input_tokens * 2.5);
    const total_estimated_tokens = input_tokens + estimated_output_tokens;
    
    // Apply safety multiplier and model-specific accuracy
    const safety_multiplier = 1.3; // 30% buffer for pre-estimation
    const adjusted_tokens = Math.ceil(
      total_estimated_tokens * safety_multiplier * (config.estimation_accuracy || 1.0)
    );
    
    return this.calculate_cost(adjusted_tokens, config);
  }

  /**
   * More accurate token estimation from text
   * Considers word complexity, punctuation, and language patterns
   */
  private static estimate_tokens_from_text(text: string): number {
    if (!text) return 0;
    
    // Base estimation: ~4 characters per token for English
    let base_tokens = Math.ceil(text.length / 4);
    
    // Adjustments for better accuracy:
    
    // 1. Word boundaries (spaces increase token count)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const word_bonus = Math.ceil(words.length * 0.1);
    
    // 2. Special characters and punctuation
    const special_chars = (text.match(/[.,!?;:()[\]{}"`'"]/g) || []).length;
    const punctuation_bonus = Math.ceil(special_chars * 0.05);
    
    // 3. Numbers and technical terms (tend to be more tokens)
    const numbers = (text.match(/\d+/g) || []).length;
    const number_bonus = Math.ceil(numbers * 0.1);
    
    // 4. Code blocks or technical content
    const code_blocks = (text.match(/```[\s\S]*?```|`[^`]+`/g) || []).length;
    const code_bonus = Math.ceil(code_blocks * 0.2);
    
    return base_tokens + word_bonus + punctuation_bonus + number_bonus + code_bonus;
  }

  /**
   * Calculate MP cost from token count
   */
  private static calculate_cost(tokens: number, config: model_token_config): number {
    const cost = Math.ceil(tokens / config.tokens_per_mp);
    return Math.max(cost, config.min_cost_mp);
  }

  /**
   * Hybrid approach: Use actual when available, estimate for missing parts
   */
  static hybrid_calculation(
    input_text: string,
    ai_response: any,
    model: string
  ): token_usage_result {
    const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['grok-3-mini-latest'];
    
    let input_tokens = 0;
    let output_tokens = 0;
    let method: 'actual' | 'estimated' | 'hybrid' = 'hybrid';
    
    // Try to get actual input tokens
    if (ai_response.usage_metadata?.input_tokens) {
      input_tokens = ai_response.usage_metadata.input_tokens;
    } else {
      input_tokens = this.estimate_tokens_from_text(input_text);
    }
    
    // Try to get actual output tokens
    if (ai_response.usage_metadata?.output_tokens) {
      output_tokens = ai_response.usage_metadata.output_tokens;
    } else {
      output_tokens = this.estimate_tokens_from_text(ai_response.content || '');
    }
    
    // If we got both actual values, mark as actual
    if (ai_response.usage_metadata?.input_tokens && ai_response.usage_metadata?.output_tokens) {
      method = 'actual';
    } else if (!ai_response.usage_metadata?.input_tokens && !ai_response.usage_metadata?.output_tokens) {
      method = 'estimated';
    }
    
    const total_tokens = input_tokens + output_tokens;
    
    return {
      input_tokens,
      output_tokens,
      total_tokens,
      estimated_cost_mp: this.calculate_cost(total_tokens, config),
      model_used: model,
      calculation_method: method
    };
  }
}