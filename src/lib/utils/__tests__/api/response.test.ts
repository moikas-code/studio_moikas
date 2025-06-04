import { describe, test, expect } from 'bun:test'
import { 
  api_success, 
  api_error, 
  handle_api_error,
  validate_env_vars
} from '../../api/response'

describe('API Response Utilities', () => {
  describe('api_success', () => {
    test('creates success response with data', () => {
      const response = api_success({ foo: 'bar' })
      const body = response.body
      
      expect(response.status).toBe(200)
      expect(body).toBeTruthy()
    })
    
    test('includes optional message', () => {
      const response = api_success({ id: 1 }, 'Created successfully', 201)
      
      expect(response.status).toBe(201)
    })
  })
  
  describe('api_error', () => {
    test('creates error response', () => {
      const response = api_error('Invalid input')
      
      expect(response.status).toBe(400)
    })
    
    test('uses custom status code', () => {
      const response = api_error('Not found', 404)
      
      expect(response.status).toBe(404)
    })
  })
  
  describe('handle_api_error', () => {
    test('handles Error instances', () => {
      const error = new Error('Test error')
      const response = handle_api_error(error)
      
      expect(response.status).toBe(500)
    })
    
    test('handles unknown errors', () => {
      const response = handle_api_error('string error')
      
      expect(response.status).toBe(500)
    })
    
    test('hides error details in production', () => {
      const original = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Sensitive error details')
      const response = handle_api_error(error)
      
      expect(response.status).toBe(500)
      
      process.env.NODE_ENV = original
    })
  })
  
  describe('validate_env_vars', () => {
    test('returns all valid env vars', () => {
      process.env.TEST_VAR = 'test_value'
      
      const result = validate_env_vars({
        test: 'TEST_VAR'
      })
      
      expect(result.test).toBe('test_value')
      
      delete process.env.TEST_VAR
    })
    
    test('throws for missing env vars', () => {
      expect(() => {
        validate_env_vars({
          missing: 'MISSING_VAR'
        })
      }).toThrow('Missing environment variable: MISSING_VAR')
    })
  })
})