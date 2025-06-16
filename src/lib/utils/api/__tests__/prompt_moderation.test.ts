import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { 
  moderate_prompt, 
  format_violations, 
  ModerationResult 
} from '../prompt_moderation'
import * as redis_module from '../../database/redis'

// Mock Redis
vi.mock('../../database/redis', () => ({
  get_redis_client: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn()
  }))
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Prompt Moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.XAI_API_KEY = 'test-api-key'
  })

  describe('moderate_prompt', () => {
    it('should return safe for appropriate adult content', async () => {
      const mock_response = {
        safe: true,
        violations: [],
        confidence: 0.95
      }

      ;(global.fetch as Mock).mockResolvedValueOnce({
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

      ;(global.fetch as Mock).mockResolvedValueOnce({
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

      ;(global.fetch as Mock).mockResolvedValueOnce({
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

      const redis_client = {
        get: vi.fn().mockResolvedValueOnce(cached_result),
        set: vi.fn()
      }

      ;(redis_module.get_redis_client as Mock).mockReturnValueOnce(redis_client)

      const result = await moderate_prompt('Test prompt')
      
      expect(result.cached).toBe(true)
      expect(redis_client.get).toHaveBeenCalledOnce()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should default to safe on API error', async () => {
      ;(global.fetch as Mock).mockRejectedValueOnce(new Error('API Error'))

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

      ;(global.fetch as Mock).mockResolvedValueOnce({
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