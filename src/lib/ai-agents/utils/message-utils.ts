import { BaseMessage } from "@langchain/core/messages";

/**
 * Utility functions for handling messages
 */

/**
 * Extracts string content from a message response
 * @param content - Message content to extract from
 * @returns Extracted string content
 */
export function extract_message_content(content: unknown): string {
  if (typeof content === "string") {
    return content;
  } else if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "text" in item) {
          return String(item.text);
        }
        return "";
      })
      .join("");
  }
  return JSON.stringify(content);
}

/**
 * Extracts JSON from a message response
 * @param content - Message content containing JSON
 * @returns Parsed JSON object or null
 */
export function extract_json_from_message(content: string): unknown | null {
  try {
    const json_match = content.match(/\{[\s\S]*\}/);
    return json_match ? JSON.parse(json_match[0]) : null;
  } catch {
    return null;
  }
}