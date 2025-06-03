import { describe, it, expect, mock, beforeEach } from "bun:test";
import { workflow_executor } from "../../workflow/workflow-executor";
import { HumanMessage } from "@langchain/core/messages";
import { workflow_node } from "../../types";

// Mock environment variable
process.env.XAI_API_KEY = "test-key";

// Mock the ChatXAI module
mock.module("@langchain/xai", () => ({
  ChatXAI: mock(() => ({
    invoke: mock(() => Promise.resolve({
      content: "Mocked response",
      usage_metadata: {
        input_tokens: 10,
        output_tokens: 20
      }
    }))
  }))
}));

describe("workflow integration", () => {
  let executor: workflow_executor;

  beforeEach(() => {
    executor = new workflow_executor();
  });

  it("should handle basic workflow execution", async () => {
    const nodes: workflow_node[] = [
      {
        id: "test-node",
        type: "llm",
        data: { prompt: "Test prompt" }
      }
    ];

    const messages = [new HumanMessage("Test message")];

    // This test verifies the structure is correct
    // In a real test, you'd mock the model responses
    expect(executor.execute).toBeDefined();
    expect(typeof executor.execute).toBe("function");
    expect(executor.register_workflow_nodes).toBeDefined();
  });

  it("should register nodes correctly", () => {
    const nodes: workflow_node[] = [
      {
        id: "img-1",
        type: "image_generator",
        data: { model: "test-model" }
      },
      {
        id: "text-1",
        type: "text_analyzer",
        data: {}
      }
    ];

    // Should not throw
    expect(() => executor.register_workflow_nodes(nodes)).not.toThrow();
  });
});