/**
 * Main entry point for the AI agents library
 * 
 * This module provides a multi-agent workflow system powered by xAI and LangGraph.
 * It supports dynamic tool registration, workflow execution, and legacy compatibility.
 */

// Main exports
export { workflow_executor } from "./workflow/workflow-executor";
export { workflow_xai_agent } from "./workflow-xai-agent";

// Type exports
export type {
  workflow_node_tool,
  agent_state,
  token_usage,
  execution_result,
  execution_step,
  execution_plan,
  workflow_execution_result,
  workflow_node_type,
  workflow_node
} from "./types";

// Constant exports
export { IMAGE_MODEL_COSTS } from "./types";

// Legacy exports for backward compatibility
export { 
  invoke_xai_agent_with_tools, 
  build_xai_chain 
} from "./legacy/xai-legacy";

// Tool exports
export { tool_factory } from "./tools/tool-factory";
export { image_generation_tool } from "./tools/image-generation-tool";
export { text_analysis_tool } from "./tools/text-analysis-tool";
export { llm_tool } from "./tools/llm-tool";
export { chat_tool } from "./tools/chat-tool";

// Agent exports
export { planner_agent } from "./agents/planner-agent";
export { executor_agent } from "./agents/executor-agent";
export { coordinator_agent } from "./agents/coordinator-agent";
export { summarizer_agent } from "./agents/summarizer-agent";
export { conversational_agent } from "./agents/conversational-agent";

// Utility exports
export { model_factory } from "./utils/model-factory";
export { extract_message_content, extract_json_from_message } from "./utils/message-utils";