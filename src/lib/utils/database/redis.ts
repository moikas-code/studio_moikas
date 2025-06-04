import { Redis } from '@upstash/redis'

let redis_instance: Redis | null = null

/**
 * Get Redis client instance (singleton pattern)
 * @returns Redis client instance
 */
export function get_redis_client(): Redis {
  if (!redis_instance) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error('Redis configuration missing')
    }

    redis_instance = new Redis({ url, token })
  }

  return redis_instance
}

/**
 * Rate limiting helper using Redis
 * @param key - Rate limit key
 * @param limit - Max requests allowed
 * @param window_seconds - Time window in seconds
 * @returns { allowed: boolean, remaining: number }
 */
export async function check_rate_limit(
  key: string,
  limit: number,
  window_seconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = get_redis_client()
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, window_seconds)
  }
  
  const remaining = Math.max(0, limit - current)
  
  return {
    allowed: current <= limit,
    remaining
  }
}