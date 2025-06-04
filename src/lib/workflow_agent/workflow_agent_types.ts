import { BaseMessage } from "@langchain/core/messages"
import { Annotation } from "@langchain/langgraph"

export interface WorkflowNode {
  id: string
  node_id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
  connections: Record<string, unknown>[]
}

export interface ExecutionResult {
  success: boolean
  output?: string
  error?: string
  metadata?: Record<string, unknown>
}

export interface ToolInput {
  user_message: string
  context?: Record<string, unknown>
}

export interface DatabaseRecord {
  session_id: string
  user_id: string
  message: string
  role: 'user' | 'assistant' | 'system'
  tokens_used?: number
}

// Define state schema using Annotation
export const agent_state_schema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
    default: () => []
  }),
  current_node: Annotation<string>(),
  workflow_data: Annotation<Record<string, unknown>>(),
  execution_context: Annotation<Record<string, unknown>>(),
  next_action: Annotation<string>()
})

export type AgentState = typeof agent_state_schema.State

export interface WorkflowExecutionOptions {
  temperature?: number
  max_tokens?: number
  model?: string
}