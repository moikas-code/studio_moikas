import { BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

/**
 * Represents a tool that can be used within a workflow node
 */
export interface workflow_node_tool {
  /** Unique identifier for the tool */
  id: string;
  /** Type of the tool (e.g., 'image_generator', 'text_analyzer') */
  type: string;
  /** Human-readable name for the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Zod schema for validating input parameters */
  parameters: z.ZodSchema;
  /** Function to execute the tool with given parameters */
  execute: (input: unknown) => Promise<unknown>;
}

/**
 * Represents the state of an agent during workflow execution
 */
export interface agent_state {
  /** Conversation messages */
  messages: BaseMessage[];
  /** ID of the current workflow */
  workflow_id?: string;
  /** Current session ID */
  session_id: string;
  /** User ID executing the workflow */
  user_id: string;
  /** Variables available during execution */
  variables: Record<string, unknown>;
  /** Current execution step */
  current_step: string;
  /** History of all executed steps */
  execution_history: execution_result[];
  /** Available tools for execution */
  available_tools: workflow_node_tool[];
  /** Token usage tracking */
  token_usage: token_usage;
  /** Total model costs */
  model_costs: number;
}

/**
 * Token usage tracking
 */
export interface token_usage {
  /** Input tokens consumed */
  input: number;
  /** Output tokens generated */
  output: number;
}

/**
 * Result of executing a workflow step
 */
export interface execution_result {
  /** The step that was executed */
  step: execution_step;
  /** Result of the execution (if successful) */
  result?: unknown;
  /** Error message (if failed) */
  error?: string;
  /** Status of the execution */
  status: "success" | "failed";
}

/**
 * Represents a single execution step
 */
export interface execution_step {
  /** Name of the tool to execute */
  tool_name: string;
  /** Parameters to pass to the tool */
  parameters: Record<string, unknown>;
}

/**
 * Execution plan created by the planner agent
 */
export interface execution_plan {
  /** Array of steps to execute */
  steps: execution_step[];
  /** Reasoning behind the plan */
  reasoning: string;
}

/**
 * Structured AI response for better logging and user experience
 */
export interface structured_ai_response {
  /** The main response to show the user */
  response: string;
  /** AI's internal thinking process (for logging/debugging) */
  thinking?: string;
  /** Identified objectives from the user's request */
  objectives?: string[];
  /** Summary of what was accomplished */
  summary?: string;
  /** Confidence level in the response (0-1) */
  confidence?: number;
  /** Response metadata */
  metadata?: {
    response_type?: "greeting" | "question" | "task" | "conversation" | "error";
    requires_followup?: boolean;
    suggested_actions?: string[];
  };
}

/**
 * Final result of workflow execution
 */
export interface workflow_execution_result {
  /** Final response message */
  response: string;
  /** Structured response with thinking and objectives */
  structured_response?: structured_ai_response;
  /** Total token usage */
  token_usage: token_usage;
  /** Total model costs */
  model_costs: number;
  /** Complete execution history */
  execution_history: execution_result[];
}

/**
 * Node types supported by the workflow system
 */
export type workflow_node_type = "image_generator" | "text_analyzer" | "llm" | "chat";

/**
 * Configuration for a workflow node
 */
export interface workflow_node {
  /** Unique identifier */
  id: string;
  /** Type of the node */
  type: workflow_node_type;
  /** Node-specific data and configuration */
  data: Record<string, unknown>;
}

/**
 * Model cost mapping for image generation
 * Imported from centralized ai_models.ts
 */
export { IMAGE_MODEL_COSTS } from "../ai_models";