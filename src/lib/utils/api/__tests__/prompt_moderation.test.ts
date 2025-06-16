import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { 
  moderate_prompt, 
  format_violations, 
  ModerationResult 
} from '../prompt_moderation'

// Mock Redis module
const mockRedisGet = mock()
const mockRedisSet = mock()
const mockGetRedisClient = mock(() => ({
  get: mockRedisGet,
  set: mockRedisSet
}))

mock.module('../../database/redis', () => ({
  get_redis_client: mockGetRedisClient
}))

// Mock fetch for API calls
const mockFetch = mock()
global.fetch = mockFetch as unknown as typeof fetch

describe('Prompt Moderation', () => {
  beforeEach(() => {
    mockRedisGet.mockReset()
    mockRedisSet.mockReset()
    mockGetRedisClient.mockReset()
    mockFetch.mockReset()
    mockGetRedisClient.mockReturnValue({
      get: mockRedisGet,
      set: mockRedisSet
    })
    process.env.XAI_API_KEY = 'test-api-key'
  })

  describe('moderate_prompt', () => {
    it('should return safe for appropriate adult content', async () => {
      const mock_response = {
        safe: true,
        violations: [],
        confidence: 0.95
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mock_response) } }]
        })
      })

      const result = await moderate_prompt('A romantic scene between two adults')
      
      expect(result.safe).toBe(true)
      expect(result.violations).toEqual([])
      expect(result.confidence).toBe(0.95)
    })

    it('should return unsafe for content with minors', async () => {
      const mock_response = {
        safe: false,
        violations: ['minors'],
        confidence: 0.98
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mock_response) } }]
        })
      })

      const result = await moderate_prompt('Inappropriate content involving minors')
      
      expect(result.safe).toBe(false)
      expect(result.violations).toContain('minors')
      expect(result.confidence).toBe(0.98)
    })

    it('should return unsafe for violent content', async () => {
      const mock_response = {
        safe: false,
        violations: ['violence'],
        confidence: 0.92
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mock_response) } }]
        })
      })

      const result = await moderate_prompt('Extreme violence and gore')
      
      expect(result.safe).toBe(false)
      expect(result.violations).toContain('violence')
    })

    it('should use cache when available', async () => {
      const cached_result: ModerationResult = {
        safe: true,
        violations: [],
        confidence: 0.9,
        cached: true
      }

      mockRedisGet.mockResolvedValueOnce(cached_result)

      const result = await moderate_prompt('Test prompt')
      
      expect(result.cached).toBe(true)
      expect(mockRedisGet).toHaveBeenCalledTimes(1)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should default to safe on API error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await moderate_prompt('Test prompt')
      
      expect(result.safe).toBe(true)
      expect(result.violations).toEqual([])
      expect(result.confidence).toBe(0)
    })

    it('should apply confidence threshold', async () => {
      const mock_response = {
        safe: false,
        violations: ['violence'],
        confidence: 0.3 // Low confidence
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mock_response) } }]
        })
      })

      const result = await moderate_prompt('Ambiguous content', { 
        confidenceThreshold: 0.7 
      })
      
      // Should default to safe due to low confidence
      expect(result.safe).toBe(true)
      expect(result.violations).toEqual([])
    })
  })

  describe('format_violations', () => {
    it('should format single violation', () => {
      const formatted = format_violations(['violence'])
      expect(formatted).toBe('extreme violence or gore')
    })

    it('should format two violations', () => {
      const formatted = format_violations(['violence', 'illegal_content'])
      expect(formatted).toBe('extreme violence or gore and illegal content')
    })

    it('should format multiple violations', () => {
      const formatted = format_violations(['violence', 'illegal_content', 'minors'])
      expect(formatted).toBe('extreme violence or gore, illegal content, and inappropriate content involving minors')
    })

    it('should handle empty violations', () => {
      const formatted = format_violations([])
      expect(formatted).toBe('prohibited content')
    })

    it('should handle unknown violation types', () => {
      const formatted = format_violations(['unknown_type'])
      expect(formatted).toBe('unknown_type')
    })
  })
})