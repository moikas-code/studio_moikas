import { describe, it, expect, mock } from "bun:test";
import { tool_factory } from "../../tools/tool-factory";
import { workflow_node } from "../../types";

describe("tool-factory", () => {
  const mock_model = {
    invoke: mock(() => Promise.resolve({ content: "mock response" }))
  };

  describe("create_tool_from_node", () => {
    it("should create image generation tool", () => {
      const node: workflow_node = {
        id: "img-1",
        type: "image_generator",
        data: { model: "test-model" }
      };

      const tool = tool_factory.create_tool_from_node(node, mock_model);
      
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("generate_image_img-1");
      expect(tool?.type).toBe("image_generator");
    });

    it("should create text analysis tool", () => {
      const node: workflow_node = {
        id: "text-1",
        type: "text_analyzer",
        data: {}
      };

      const tool = tool_factory.create_tool_from_node(node, mock_model);
      
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("analyze_text_text-1");
      expect(tool?.type).toBe("text_analyzer");
    });

    it("should create LLM tool", () => {
      const node: workflow_node = {
        id: "llm-1",
        type: "llm",
        data: { prompt: "test prompt" }
      };

      const tool = tool_factory.create_tool_from_node(node, mock_model);
      
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("llm_process_llm-1");
      expect(tool?.type).toBe("llm");
    });

    it("should return null for unsupported node type", () => {
      const node: workflow_node = {
        id: "unknown-1",
        type: "unsupported" as any,
        data: {}
      };

      const tool = tool_factory.create_tool_from_node(node, mock_model);
      
      expect(tool).toBeNull();
    });
  });

  describe("create_tools_from_nodes", () => {
    it("should create multiple tools", () => {
      const nodes: workflow_node[] = [
        { id: "img-1", type: "image_generator", data: {} },
        { id: "text-1", type: "text_analyzer", data: {} },
        { id: "llm-1", type: "llm", data: {} }
      ];

      const tools_map = tool_factory.create_tools_from_nodes(nodes, mock_model);
      
      expect(tools_map.size).toBe(3);
      expect(tools_map.has("img-1")).toBe(true);
      expect(tools_map.has("text-1")).toBe(true);
      expect(tools_map.has("llm-1")).toBe(true);
    });

    it("should skip unsupported nodes", () => {
      const nodes: workflow_node[] = [
        { id: "img-1", type: "image_generator", data: {} },
        { id: "unknown-1", type: "unsupported" as any, data: {} }
      ];

      const tools_map = tool_factory.create_tools_from_nodes(nodes, mock_model);
      
      expect(tools_map.size).toBe(1);
      expect(tools_map.has("img-1")).toBe(true);
      expect(tools_map.has("unknown-1")).toBe(false);
    });
  });
});