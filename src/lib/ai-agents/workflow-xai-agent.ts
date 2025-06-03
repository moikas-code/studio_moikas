import { BaseMessage } from "@langchain/core/messages";
import { workflow_executor } from "./workflow/workflow-executor";
import { workflow_node, workflow_execution_result } from "./types";

/**
 * Enhanced xAI agent with LangGraph support for workflow integration
 * This class provides backward compatibility while using the new modular architecture
 */
export class workflow_xai_agent {
  private workflow_executor: workflow_executor;

  constructor(model_options: Record<string, unknown> = {}) {
    this.workflow_executor = new workflow_executor(model_options);
  }

  /**
   * Register workflow nodes as tools
   * @param nodes - Array of workflow nodes
   */
  register_workflow_nodes_as_tools(nodes: workflow_node[]): void {
    this.workflow_executor.register_workflow_nodes(nodes);
  }

  /**
   * Execute the multi-agent workflow
   * @param messages - Conversation messages
   * @param workflow_id - ID of the workflow
   * @param session_id - Session ID
   * @param user_id - User ID
   * @param workflow_nodes - Workflow nodes to register as tools
   * @returns Workflow execution result
   */
  async execute_workflow(
    messages: BaseMessage[],
    workflow_id: string,
    session_id: string,
    user_id: string,
    workflow_nodes: workflow_node[] = []
  ): Promise<workflow_execution_result> {
    return await this.workflow_executor.execute(
      messages,
      workflow_id,
      session_id,
      user_id,
      workflow_nodes
    );
  }
}