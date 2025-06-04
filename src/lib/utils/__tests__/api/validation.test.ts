import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import {
  image_generation_schema,
  enhance_prompt_schema,
  validate_request,
  user_id_schema,
  memu_message_schema
} from '../../api/validation'

describe('API Validation Schemas', () => {
  describe('image_generation_schema', () => {
    test('validates correct input', () => {
      const input = {
        prompt: 'A beautiful sunset',
        model: 'flux-pro',
        width: 1024,
        height: 1024
      }
      
      const result = image_generation_schema.parse(input)
      expect(result.prompt).toBe('A beautiful sunset')
      expect(result.model).toBe('flux-pro')
    })
    
    test('trims prompt whitespace', () => {
      const input = {
        prompt: '  spaces around  ',
        model: 'flux'
      }
      
      const result = image_generation_schema.parse(input)
      expect(result.prompt).toBe('spaces around')
    })
    
    test('rejects invalid dimensions', () => {
      const input = {
        prompt: 'test',
        model: 'flux',
        width: 4096 // too large
      }
      
      expect(() => image_generation_schema.parse(input)).toThrow()
    })
    
    test('rejects empty prompt', () => {
      const input = {
        prompt: '',
        model: 'flux'
      }
      
      expect(() => image_generation_schema.parse(input)).toThrow()
    })
  })
  
  describe('enhance_prompt_schema', () => {
    test('validates and trims prompt', () => {
      const input = {
        prompt: '  enhance this  '
      }
      
      const result = enhance_prompt_schema.parse(input)
      expect(result.prompt).toBe('enhance this')
    })
    
    test('accepts optional style', () => {
      const input = {
        prompt: 'test',
        style: 'artistic'
      }
      
      const result = enhance_prompt_schema.parse(input)
      expect(result.style).toBe('artistic')
    })
  })
  
  describe('memu_message_schema', () => {
    test('validates message structure', () => {
      const input = {
        role: 'user',
        content: 'Hello'
      }
      
      const result = memu_message_schema.parse(input)
      expect(result.role).toBe('user')
      expect(result.content).toBe('Hello')
    })
    
    test('rejects invalid role', () => {
      const input = {
        role: 'invalid',
        content: 'test'
      }
      
      expect(() => memu_message_schema.parse(input)).toThrow()
    })
  })
  
  describe('validate_request', () => {
    const test_schema = z.object({
      name: z.string(),
      age: z.number()
    })
    
    test('returns parsed data for valid input', () => {
      const data = { name: 'John', age: 30 }
      const result = validate_request(test_schema, data)
      
      expect(result.name).toBe('John')
      expect(result.age).toBe(30)
    })
    
    test('throws formatted error for invalid input', () => {
      const data = { name: 'John', age: 'thirty' }
      
      expect(() => {
        validate_request(test_schema, data)
      }).toThrow('Validation error: age:')
    })
  })
})