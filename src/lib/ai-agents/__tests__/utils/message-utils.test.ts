import { describe, it, expect } from "bun:test";
import { extract_message_content, extract_json_from_message } from "../../utils/message-utils";

describe("message-utils", () => {
  describe("extract_message_content", () => {
    it("should extract string content directly", () => {
      const result = extract_message_content("Hello world");
      expect(result).toBe("Hello world");
    });

    it("should extract content from array of strings", () => {
      const result = extract_message_content(["Hello", " ", "world"]);
      expect(result).toBe("Hello world");
    });

    it("should extract text from objects with text property", () => {
      const result = extract_message_content([
        { text: "Hello" },
        { text: " world" }
      ]);
      expect(result).toBe("Hello world");
    });

    it("should handle mixed array content", () => {
      const result = extract_message_content([
        "Hello",
        { text: " world" },
        "!"
      ]);
      expect(result).toBe("Hello world!");
    });

    it("should stringify non-string objects", () => {
      const obj = { foo: "bar" };
      const result = extract_message_content(obj);
      expect(result).toBe(JSON.stringify(obj));
    });
  });

  describe("extract_json_from_message", () => {
    it("should extract valid JSON from message", () => {
      const message = 'Some text {"key": "value"} more text';
      const result = extract_json_from_message(message);
      expect(result).toEqual({ key: "value" });
    });

    it("should return null for invalid JSON", () => {
      const message = 'Some text {invalid json} more text';
      const result = extract_json_from_message(message);
      expect(result).toBeNull();
    });

    it("should return null when no JSON found", () => {
      const message = 'Just plain text';
      const result = extract_json_from_message(message);
      expect(result).toBeNull();
    });

    it("should extract nested JSON", () => {
      const message = 'Response: {"plan": {"steps": [1, 2, 3]}}';
      const result = extract_json_from_message(message);
      expect(result).toEqual({ plan: { steps: [1, 2, 3] } });
    });
  });
});