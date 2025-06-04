import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML
 */
export function sanitize_html(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize user input for safe display
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitize_text(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .slice(0, 10000) // Limit length
}

/**
 * Validate and sanitize URL
 * @param url - URL string to validate
 * @returns Sanitized URL or null if invalid
 */
export function sanitize_url(url: string): string | null {
  try {
    const parsed = new URL(url)
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Remove sensitive data from objects
 * @param obj - Object to sanitize
 * @param sensitive_keys - Keys to remove
 * @returns Sanitized object
 */
export function remove_sensitive_data<T extends Record<string, unknown>>(
  obj: T,
  sensitive_keys: string[] = ['password', 'token', 'secret', 'key', 'api_key']
): Partial<T> {
  const sanitized = { ...obj }
  
  for (const key of Object.keys(sanitized)) {
    if (sensitive_keys.some(s => key.toLowerCase().includes(s))) {
      delete sanitized[key]
    }
  }
  
  return sanitized
}

/**
 * Validate file upload
 * @param file - File object
 * @param allowed_types - Allowed MIME types
 * @param max_size_mb - Maximum file size in MB
 * @returns Validation result
 */
export function validate_file_upload(
  file: File,
  allowed_types: string[],
  max_size_mb: number
): { valid: boolean; error?: string } {
  if (!allowed_types.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  const max_bytes = max_size_mb * 1024 * 1024
  if (file.size > max_bytes) {
    return { valid: false, error: `File too large (max ${max_size_mb}MB)` }
  }
  
  return { valid: true }
}