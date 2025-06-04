import { BaseMessage } from "@langchain/core/messages"

/**
 * Calculate approximate token count for messages
 * @param messages - Array of messages
 * @returns Estimated token count
 */
export function calculate_tokens_used(messages: BaseMessage[]): number {
  const total_chars = messages.reduce((sum, msg) => {
    const content = typeof msg.content === 'string' 
      ? msg.content 
      : JSON.stringify(msg.content)
    return sum + content.length
  }, 0)
  
  // Rough estimate: 4 chars per token
  return Math.ceil(total_chars / 4)
}

/**
 * Format error message for user display
 * @param error - Error object or message
 * @returns Formatted error string
 */
export function format_error_message(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}