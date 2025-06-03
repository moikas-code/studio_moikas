// Token estimation utility for client-side usage calculation
// This provides a reasonable approximation without needing to call the API

export interface token_estimate {
  estimated_tokens: number;
  estimated_cost: number;  // in MP (Memu Points)
  character_count: number;
  word_count: number;
}

export interface complete_token_estimate extends token_estimate {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
}

// Feature types for output estimation
export type feature_type = 
  | "script" 
  | "product_description" 
  | "video_description" 
  | "tweet" 
  | "profile_bio" 
  | "summary" 
  | "test" 
  | "outline";

// Constants matching the API
const MIN_TEXT_COST = 1; // Minimum 1 MP per message

// Output token estimation multipliers based on feature type and input length
const OUTPUT_ESTIMATIONS: Record<feature_type, {
  base_tokens: number;        // Minimum tokens for this feature type
  input_multiplier: number;   // How much the output scales with input
  max_tokens: number;         // Maximum reasonable output for this feature
}> = {
  "tweet": {
    base_tokens: 50,           // ~50 tokens minimum for a tweet
    input_multiplier: 0.3,     // Tweets are usually much shorter than input
    max_tokens: 280            // Twitter character limit ≈ 70 tokens
  },
  "profile_bio": {
    base_tokens: 75,           // ~75 tokens for a bio
    input_multiplier: 0.2,     // Bios are concise summaries
    max_tokens: 400            // ~100 words max
  },
  "summary": {
    base_tokens: 100,          // Minimum summary length
    input_multiplier: 0.25,    // Summaries are typically 15-30% of input
    max_tokens: 2000           // ~500 words max
  },
  "product_description": {
    base_tokens: 150,          // ~150 tokens minimum
    input_multiplier: 0.8,     // Rich descriptions based on input features
    max_tokens: 1200           // ~300 words max
  },
  "video_description": {
    base_tokens: 125,          // ~125 tokens minimum
    input_multiplier: 0.6,     // Video descriptions are moderately detailed
    max_tokens: 800            // ~200 words max
  },
  "outline": {
    base_tokens: 200,          // Structured outline with headers
    input_multiplier: 0.4,     // Outlines are structured summaries
    max_tokens: 1600           // ~400 words max
  },
  "script": {
    base_tokens: 300,          // Scripts need substantial content
    input_multiplier: 1.5,     // Scripts are usually longer than input
    max_tokens: 4000           // ~1000 words max
  },
  "test": {
    base_tokens: 250,          // Questions + answers + explanations
    input_multiplier: 1.2,     // Tests expand on input content
    max_tokens: 3000           // ~750 words max
  }
};

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
 * Estimates output tokens based on feature type and input content
 */
export function estimate_output_tokens(input_tokens: number, feature: feature_type): number {
  const estimation = OUTPUT_ESTIMATIONS[feature];
  
  // Calculate output tokens: base + (input * multiplier), capped at max
  const estimated_output = Math.round(
    estimation.base_tokens + (input_tokens * estimation.input_multiplier)
  );
  
  return Math.min(estimated_output, estimation.max_tokens);
}

/**
 * Complete token estimation including input and output
 */
export function estimate_complete_tokens(text: string, feature: feature_type): complete_token_estimate {
  const input_estimate = estimate_tokens_from_text(text);
  const output_tokens = estimate_output_tokens(input_estimate.estimated_tokens, feature);
  const total_tokens = input_estimate.estimated_tokens + output_tokens;
  
  // Calculate costs
  const input_cost = Math.max(MIN_TEXT_COST, Math.ceil(input_estimate.estimated_tokens / 3000));
  const output_cost = Math.ceil(output_tokens / 3000);
  const total_cost = Math.max(MIN_TEXT_COST, Math.ceil(total_tokens / 3000));
  
  return {
    // Original estimate data
    estimated_tokens: input_estimate.estimated_tokens,
    estimated_cost: input_estimate.estimated_cost,
    character_count: input_estimate.character_count,
    word_count: input_estimate.word_count,
    
    // Complete estimation data
    input_tokens: input_estimate.estimated_tokens,
    output_tokens,
    total_tokens,
    input_cost,
    output_cost,
    total_cost
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
 * Formats complete token estimate for display
 */
export function format_complete_estimate(estimate: complete_token_estimate): string {
  if (estimate.total_tokens === 0) {
    return "0 tokens (1 MP minimum)";
  }
  
  return `~${estimate.total_tokens} tokens (${estimate.total_cost} MP)`;
}

/**
 * Real-time token estimation hook for React components (input only)
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

/**
 * Real-time complete token estimation hook including input + output
 */
export function use_complete_token_estimation(text: string, feature: feature_type) {
  const estimate = estimate_complete_tokens(text, feature);
  const formatted = format_complete_estimate(estimate);
  
  return {
    ...estimate,
    formatted_complete_estimate: formatted,
    formatted_input_estimate: format_token_estimate(estimate),
    is_over_limit: (token_limit: number) => estimate.total_tokens > token_limit,
    breakdown: {
      input: `${estimate.input_tokens} tokens (${estimate.input_cost} MP)`,
      output: `${estimate.output_tokens} tokens (${estimate.output_cost} MP)`,
      total: `${estimate.total_tokens} tokens (${estimate.total_cost} MP)`
    }
  };
} 