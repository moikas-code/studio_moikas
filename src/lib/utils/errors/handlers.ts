/**
 * Custom error classes for better error handling
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class InsufficientTokensError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient tokens: ${required} required, ${available} available`)
    this.name = 'InsufficientTokensError'
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Format error for logging (removes sensitive data)
 * @param error - Error object
 * @returns Sanitized error object
 */
export function format_error_for_logging(error: unknown): {
  message: string
  type: string
  stack?: string
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }
  
  return {
    message: String(error),
    type: 'Unknown'
  }
}

/**
 * Get user-friendly error message
 * @param error - Error object
 * @returns Message safe to show users
 */
export function get_user_error_message(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue'
  }
  
  if (error instanceof InsufficientTokensError) {
    return 'Insufficient tokens for this operation'
  }
  
  if (error instanceof RateLimitError) {
    return 'Too many requests. Please try again later'
  }
  
  // Generic message for production
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred. Please try again'
  }
  
  // More detailed message for development
  return error instanceof Error ? error.message : 'Unknown error'
}