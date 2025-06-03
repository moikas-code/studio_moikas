// Token estimation utility for client-side usage calculation
// This provides a reasonable approximation without needing to call the API

export interface token_estimate {
  estimated_tokens: number;
  estimated_cost: number;  // in MP (Memu Points)
  character_count: number;
  word_count: number;
}

// Constants matching the API
const TEXT_TOKENS_PER_3000 = 1; // 1 MP per 3000 tokens
const MIN_TEXT_COST = 1; // Minimum 1 MP per message

/**
 * Estimates token count from text input
 * Uses a simple approximation: ~4 characters per token (varies by language/content)
 * This is reasonably accurate for English text
 */
export function estimate_tokens_from_text(text: string): token_estimate {
  if (!text || text.trim().length === 0) {
    return {
      estimated_tokens: 0,
      estimated_cost: MIN_TEXT_COST,
      character_count: 0,
      word_count: 0
    };
  }

  const character_count = text.length;
  const word_count = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Estimation: ~4 characters per token for English
  // Adjust this based on your typical content
  const estimated_tokens = Math.ceil(character_count / 4);
  
  // Calculate cost: 1 MP per 3000 tokens, minimum 1 MP
  const estimated_cost = Math.max(MIN_TEXT_COST, Math.ceil(estimated_tokens / 3000));

  return {
    estimated_tokens,
    estimated_cost,
    character_count,
    word_count
  };
}

/**
 * Formats token estimate for display
 */
export function format_token_estimate(estimate: token_estimate): string {
  if (estimate.estimated_tokens === 0) {
    return "0 tokens (1 MP minimum)";
  }
  
  return `~${estimate.estimated_tokens} tokens (${estimate.estimated_cost} MP)`;
}

/**
 * Real-time token estimation hook for React components
 */
export function use_token_estimation(text: string) {
  const estimate = estimate_tokens_from_text(text);
  const formatted = format_token_estimate(estimate);
  
  return {
    ...estimate,
    formatted_estimate: formatted,
    is_over_limit: (token_limit: number) => estimate.estimated_tokens > token_limit
  };
} 