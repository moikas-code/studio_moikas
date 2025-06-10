import { get_redis_client, check_rate_limit } from '../database/redis'
import { RateLimitError } from '../errors/handlers'
import { check_admin_access } from './admin'

interface RateLimitConfig {
  requests: number
  window_seconds: number
  key_prefix?: string
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  image_generation_free: {
    requests: 10,
    window_seconds: 60,
    key_prefix: 'rl:img:free'
  },
  image_generation_standard: {
    requests: 60,
    window_seconds: 60,
    key_prefix: 'rl:img:std'
  },
  api_general: {
    requests: 100,
    window_seconds: 60,
    key_prefix: 'rl:api'
  },
  video_processing: {
    requests: 5,
    window_seconds: 300, // 5 minutes
    key_prefix: 'rl:video'
  }
} as const

/**
 * Apply rate limiting to a user
 * @param user_id - User identifier
 * @param config - Rate limit configuration
 * @returns Rate limit status
 */
export async function apply_rate_limit(
  user_id: string,
  config: RateLimitConfig
): Promise<{ 
  allowed: boolean
  remaining: number
  reset_in_seconds: number 
}> {
  const key = `${config.key_prefix}:${user_id}`
  const result = await check_rate_limit(
    key,
    config.requests,
    config.window_seconds
  )
  
  // Get TTL for reset time
  const redis = get_redis_client()
  const ttl = redis ? await redis.ttl(key) : -1
  
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    reset_in_seconds: ttl > 0 ? ttl : config.window_seconds
  }
}

/**
 * Enforce rate limit or throw error
 * @param user_id - User identifier  
 * @param config - Rate limit configuration
 * @param skip_for_admin - Whether to skip rate limiting for admin users (default: true)
 * @throws RateLimitError if limit exceeded
 */
export async function enforce_rate_limit(
  user_id: string,
  config: RateLimitConfig,
  skip_for_admin: boolean = true
): Promise<void> {
  // Check if user is admin and skip rate limiting if enabled
  if (skip_for_admin) {
    const admin_check = await check_admin_access()
    if (admin_check.is_admin) {
      return // Skip rate limiting for admins
    }
  }
  
  const result = await apply_rate_limit(user_id, config)
  
  if (!result.allowed) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${result.reset_in_seconds}s`
    )
  }
}

/**
 * Get rate limit headers for response
 * @param result - Rate limit result
 * @returns Headers object
 */
export function get_rate_limit_headers(result: {
  remaining: number
  reset_in_seconds: number
}): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(
      Date.now() + result.reset_in_seconds * 1000
    ).toISOString()
  }
}