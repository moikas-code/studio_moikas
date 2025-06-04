import { NextResponse } from 'next/server'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Create successful API response
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default 200)
 */
export function api_success<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  )
}

/**
 * Create error API response
 * @param error - Error message
 * @param status - HTTP status code (default 400)
 */
export function api_error(
  error: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  )
}

/**
 * Handle API errors consistently
 * @param error - Error object
 * @returns Formatted error response
 */
export function handle_api_error(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message
    
    return api_error(message, 500)
  }
  
  return api_error('Unknown error occurred', 500)
}

/**
 * Validate required environment variables
 * @param vars - Object with variable names as keys
 * @returns All variables or throws error
 */
export function validate_env_vars<T extends Record<string, string>>(
  vars: T
): Record<keyof T, string> {
  const result: Record<string, string> = {}
  
  for (const [key, env_name] of Object.entries(vars)) {
    const value = process.env[env_name]
    if (!value) {
      throw new Error(`Missing environment variable: ${env_name}`)
    }
    result[key] = value
  }
  
  return result as Record<keyof T, string>
}