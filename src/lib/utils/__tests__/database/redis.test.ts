import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { get_redis_client, check_rate_limit } from '../../database/redis'

// Mock the Redis module
mock.module('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
    
    async incr(key: string) {
      return 1
    }
    
    async expire(key: string, seconds: number) {
      return 1
    }
    
    async ttl(key: string) {
      return 60
    }
  }
}))

describe('Redis Utilities', () => {
  beforeEach(() => {
    // Clear any cached instance
    const redis_module = require('../../database/redis')
    redis_module.redis_instance = null
  })
  
  describe('get_redis_client', () => {
    test('returns Redis instance', () => {
      const client = get_redis_client()
      expect(client).toBeDefined()
      expect(client.incr).toBeDefined()
    })
    
    test('returns same instance on multiple calls', () => {
      const client1 = get_redis_client()
      const client2 = get_redis_client()
      expect(client1).toBe(client2)
    })
  })
  
  describe('check_rate_limit', () => {
    test('allows request within limit', async () => {
      const result = await check_rate_limit('test-key', 10, 60)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })
    
    test('calculates remaining correctly', async () => {
      const mock_redis = {
        incr: mock(() => Promise.resolve(5)),
        expire: mock(() => Promise.resolve(1)),
        ttl: mock(() => Promise.resolve(30))
      }
      
      // Mock the get_redis_client to return our mock
      const redis_module = require('../../database/redis')
      redis_module.get_redis_client = () => mock_redis
      
      const result = await redis_module.check_rate_limit('test', 10, 60)
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5) // 10 - 5
    })
  })
})