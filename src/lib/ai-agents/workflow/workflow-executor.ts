import { BaseMessage } from "@langchain/core/messages";
import { 
  agent_state, 
  workflow_execution_result, 
  workflow_node,
  workflow_node_tool 
} from "../types";
import { model_factory } from "../utils/model-factory";
import { tool_factory } from "../tools/tool-factory";
import { workflow_graph_manager } from "./workflow-graph";
import { extract_message_content } from "../utils/message-utils";

/**
 * Main workflow executor that orchestrates multi-agent execution
 */
export class workflow_executor {
  private model: any;
  private workflow_graph_manager: workflow_graph_manager;
  private tools_registry: Map<string, workflow_node_tool>;

  constructor(model_options: Record<string, unknown> = {}) {
    this.model = model_factory.create_xai_model(model_options);
    this.tools_registry = new Map();
    this.workflow_graph_manager = new workflow_graph_manager(this.model, this.tools_registry);
  }

  /**
   * Registers workflow nodes as tools
   * @param nodes - Array of workflow nodes
   */
  register_workflow_nodes(nodes: workflow_node[]): void {
    this.tools_registry = tool_factory.create_tools_from_nodes(nodes, this.model);
  }

  /**
   * Executes the multi-agent workflow
   * @param messages - Conversation messages
   * @param workflow_id - ID of the workflow
   * @param session_id - Session ID
   * @param user_id - User ID
   * @param workflow_nodes - Workflow nodes to register as tools
   * @returns Workflow execution result
   */
  async execute(
    messages: BaseMessage[],
    workflow_id: string,
    session_id: string,
    user_id: string,
    workflow_nodes: workflow_node[] = []
  ): Promise<workflow_execution_result> {
    // Register workflow nodes as tools
    this.register_workflow_nodes(workflow_nodes);

    // Prepare initial state
    const initial_state: agent_state = {
      messages,
      workflow_id,
      session_id,
      user_id,
      variables: {},
      current_step: "start",
      execution_history: [],
      available_tools: Array.from(this.tools_registry.values()),
      token_usage: { input: 0, output: 0 },
      model_costs: 0
    };

    // Execute workflow
    const compiled_graph = this.workflow_graph_manager.compile();
    const final_state = await compiled_graph.invoke(initial_state);

    // Extract final response
    const last_message = final_state.messages[final_state.messages.length - 1];
    const response = extract_message_content(last_message.content);

    return {
      response,
      token_usage: final_state.token_usage,
      model_costs: final_state.model_costs,
      execution_history: final_state.execution_history
    };
  }
}