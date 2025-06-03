import { z } from "zod";
import { workflow_node_tool, workflow_node, IMAGE_MODEL_COSTS } from "../types";
import { image_generation_tool } from "./image-generation-tool";
import { text_analysis_tool } from "./text-analysis-tool";
import { llm_tool } from "./llm-tool";
import { chat_tool } from "./chat-tool";

/**
 * Factory for creating tools from workflow nodes
 */
export class tool_factory {
  /**
   * Creates a workflow tool from a node configuration
   * @param node - Workflow node configuration
   * @param model - ChatXAI model instance for LLM operations
   * @returns Workflow tool or null if node type is not supported
   */
  static create_tool_from_node(node: workflow_node, model: any): workflow_node_tool | null {
    switch (node.type) {
      case "image_generator":
        return image_generation_tool.create(node);
      
      case "text_analyzer":
        return text_analysis_tool.create(node, model);
      
      case "llm":
        return llm_tool.create(node, model);
      
      case "chat":
        return chat_tool.create(node, model);
      
      default:
        return null;
    }
  }

  /**
   * Creates tools from multiple workflow nodes
   * @param nodes - Array of workflow nodes
   * @param model - ChatXAI model instance
   * @returns Map of tool ID to workflow tool
   */
  static create_tools_from_nodes(nodes: workflow_node[], model: any): Map<string, workflow_node_tool> {
    const tools_registry = new Map<string, workflow_node_tool>();
    
    for (const node of nodes) {
      const tool = this.create_tool_from_node(node, model);
      if (tool) {
        tools_registry.set(node.id, tool);
      }
    }
    
    return tools_registry;
  }
}