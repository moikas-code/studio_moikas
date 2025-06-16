import { get_redis_client } from '../database/redis';
import { createHash } from 'crypto';

export interface ModerationResult {
  safe: boolean;
  violations: string[];
  confidence: number;
  cached?: boolean;
}

export interface ModerationConfig {
  skipCache?: boolean;
  skipForAdmin?: boolean;
  confidenceThreshold?: number;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const CACHE_TTL = 3600; // 1 hour in seconds

// Violation categories that we check for
export const VIOLATION_CATEGORIES = {
  VIOLENCE: 'violence',
  ILLEGAL: 'illegal_content',
  MINORS: 'minors',
  NON_CONSENSUAL: 'non_consensual',
  SELF_HARM: 'self_harm',
  DEEPFAKES: 'non_consensual_deepfakes',
} as const;

export type ViolationCategory = typeof VIOLATION_CATEGORIES[keyof typeof VIOLATION_CATEGORIES];

/**
 * Generate a cache key for a prompt
 */
function get_cache_key(prompt: string): string {
  const hash = createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex');
  return `moderation:${hash}`;
}

/**
 * Check if a prompt is safe for image generation
 * Allows NSFW content with consenting adults, blocks harmful/illegal content
 */
export async function moderate_prompt(
  prompt: string,
  config: ModerationConfig = {}
): Promise<ModerationResult> {
  const {
    skipCache = false,
    skipForAdmin = false,
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
  } = config;

  // Allow admins to skip moderation if configured
  if (skipForAdmin) {
    return {
      safe: true,
      violations: [],
      confidence: 1,
      cached: false
    };
  }

  // Check cache first
  if (!skipCache) {
    const redis = get_redis_client();
    if (redis) {
      const cache_key = get_cache_key(prompt);
      try {
        const cached = await redis.get<ModerationResult>(cache_key);
        if (cached) {
          return { ...cached, cached: true };
        }
      } catch (error) {
        console.error('Redis cache error:', error);
        // Continue without cache
      }
    }
  }

  // Prepare the moderation prompt for grok-3-mini
  const moderation_prompt = `Analyze this image generation prompt for safety. You must return valid JSON only.

IMPORTANT: Adult/NSFW content with consenting adults is ALLOWED and should be marked as safe.

Check for these PROHIBITED categories only:
- violence: Extreme violence, gore, graphic harm, torture
- illegal_content: Any illegal activities or content
- minors: ANY content involving minors in sexual or inappropriate contexts
- non_consensual: Non-consensual sexual content, assault, coercion
- self_harm: Self-harm, suicide, or encouraging dangerous behavior
- non_consensual_deepfakes: Creating explicit images of real people without consent

Prompt to analyze: "${prompt}"

Return JSON in this exact format:
{
  "safe": boolean (true if content is allowed, false if prohibited),
  "violations": array of violated categories from the list above (empty if safe),
  "confidence": number between 0 and 1
}

Remember: Consensual adult content should be marked as SAFE.`;

  try {
    // Call grok-3-mini for moderation
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation system. You must always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: moderation_prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Moderation API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in moderation response');
    }

    // Parse the JSON response
    let result: ModerationResult;
    try {
      const parsed = JSON.parse(content);
      result = {
        safe: parsed.safe === true,
        violations: Array.isArray(parsed.violations) ? parsed.violations : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1,
      };
    } catch {
      console.error('Failed to parse moderation response:', content);
      // Default to safe to avoid false positives
      result = {
        safe: true,
        violations: [],
        confidence: 0.5,
      };
    }

    // Apply confidence threshold
    if (result.confidence < confidenceThreshold && !result.safe) {
      // If we're not confident about blocking, default to safe
      result.safe = true;
      result.violations = [];
    }

    // Cache the result
    if (!skipCache) {
      const redis = get_redis_client();
      if (redis) {
        const cache_key = get_cache_key(prompt);
        try {
          await redis.set(cache_key, result, { ex: CACHE_TTL });
        } catch (error) {
          console.error('Failed to cache moderation result:', error);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Moderation error:', error);
    // On error, default to safe to avoid blocking legitimate content
    return {
      safe: true,
      violations: [],
      confidence: 0,
    };
  }
}

/**
 * Format violations for user-friendly error messages
 */
export function format_violations(violations: string[]): string {
  const formatted = violations.map(v => {
    switch (v) {
      case VIOLATION_CATEGORIES.VIOLENCE:
        return 'extreme violence or gore';
      case VIOLATION_CATEGORIES.ILLEGAL:
        return 'illegal content';
      case VIOLATION_CATEGORIES.MINORS:
        return 'inappropriate content involving minors';
      case VIOLATION_CATEGORIES.NON_CONSENSUAL:
        return 'non-consensual content';
      case VIOLATION_CATEGORIES.SELF_HARM:
        return 'self-harm or dangerous content';
      case VIOLATION_CATEGORIES.DEEPFAKES:
        return 'non-consensual deepfakes';
      default:
        return v;
    }
  });

  if (formatted.length === 0) return 'prohibited content';
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  
  const last = formatted.pop();
  return `${formatted.join(', ')}, and ${last}`;
}