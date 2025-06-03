import { describe, it, expect, mock } from "bun:test";
import { chat_tool } from "../../tools/chat-tool";
import { workflow_node } from "../../types";

describe("chat-tool", () => {
  const mock_model = {
    invoke: mock(() => Promise.resolve({
      content: "Hello! I'm doing great, thanks for asking. How are you today?",
      usage_metadata: {
        input_tokens: 15,
        output_tokens: 25
      }
    }))
  };

  describe("create", () => {
    it("should create a chat tool from a workflow node", () => {
      const node: workflow_node = {
        id: "chat-1",
        type: "chat",
        data: {
          personality: "friendly",
          description: "Test chat tool"
        }
      };

      const tool = chat_tool.create(node, mock_model);

      expect(tool).not.toBeNull();
      expect(tool.name).toBe("chat_chat-1");
      expect(tool.type).toBe("chat");
      expect(tool.description).toContain("Handle conversational interactions");
      expect(tool.description).toContain("Test chat tool");
    });

    it("should handle nodes without personality or description", () => {
      const node: workflow_node = {
        id: "chat-2", 
        type: "chat",
        data: {}
      };

      const tool = chat_tool.create(node, mock_model);

      expect(tool).not.toBeNull();
      expect(tool.name).toBe("chat_chat-2");
      expect(tool.description).toContain("Handle conversational interactions");
    });
  });

  describe("execute", () => {
    it("should execute chat interaction successfully", async () => {
      const node: workflow_node = {
        id: "chat-test",
        type: "chat",
        data: {
          personality: "helpful and friendly",
          context: "Test conversation"
        }
      };

      const tool = chat_tool.create(node, mock_model);
      const input = {
        user_message: "How are you doing today?",
        personality: "enthusiastic"
      };

      const result = await tool.execute(input);

      expect(result.status).toBe("success");
      expect(result.response).toBe("Hello! I'm doing great, thanks for asking. How are you today?");
      expect(result.user_message).toBe("How are you doing today?");
      expect(result.personality_used).toBe("enthusiastic");
      expect(result.token_usage).toEqual({
        input: 15,
        output: 25
      });
      expect(result.model_costs).toBeGreaterThan(0);
      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("enthusiastic")
        }),
        expect.objectContaining({
          content: "How are you doing today?"
        })
      ]);
    });

    it("should use default personality when none provided", async () => {
      const node: workflow_node = {
        id: "chat-default",
        type: "chat",
        data: {}
      };

      const tool = chat_tool.create(node, mock_model);
      const input = {
        user_message: "Hello there!"
      };

      const result = await tool.execute(input);

      expect(result.personality_used).toBe("friendly and helpful");
      expect(result.status).toBe("success");
    });

    it("should include context in system prompt when provided", async () => {
      const node: workflow_node = {
        id: "chat-context",
        type: "chat", 
        data: {
          context: "You are helping with cooking advice"
        }
      };

      const tool = chat_tool.create(node, mock_model);
      const input = {
        user_message: "What should I cook for dinner?",
        context: "User is vegetarian"
      };

      await tool.execute(input);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("User is vegetarian")
        }),
        expect.any(Object)
      ]);
    });

    it("should calculate model costs correctly", async () => {
      const node: workflow_node = {
        id: "chat-cost",
        type: "chat",
        data: {}
      };

      // Mock with specific token usage for cost calculation
      const cost_mock_model = {
        invoke: mock(() => Promise.resolve({
          content: "Test response",
          usage_metadata: {
            input_tokens: 1000,  // Should cost 0.002
            output_tokens: 500   // Should cost 0.003
          }
        }))
      };

      const tool = chat_tool.create(node, cost_mock_model);
      const result = await tool.execute({
        user_message: "Test message"
      });

      // Expected cost: (1000 * 0.002 + 500 * 0.006) / 1000 = 0.005
      expect(result.model_costs).toBeCloseTo(0.005, 4);
    });

    it("should handle missing usage metadata gracefully", async () => {
      const node: workflow_node = {
        id: "chat-no-usage",
        type: "chat",
        data: {}
      };

      const no_usage_model = {
        invoke: mock(() => Promise.resolve({
          content: "Test response"
          // No usage_metadata
        }))
      };

      const tool = chat_tool.create(node, no_usage_model);
      const result = await tool.execute({
        user_message: "Test message"
      });

      expect(result.token_usage).toEqual({
        input: 0,
        output: 0
      });
      expect(result.model_costs).toBe(0);
    });
  });
}); 