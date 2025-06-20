import { agent_state, workflow_node_tool, execution_result } from "../types";

/**
 * Executor agent responsible for executing individual steps using tools
 */
export class executor_agent {
  private tools_registry: Map<string, workflow_node_tool>;

  constructor(tools_registry: Map<string, workflow_node_tool>) {
    this.tools_registry = tools_registry;
  }

  /**
   * Executes all steps in the execution plan
   * @param state - Current agent state
   * @returns Updated state with execution results
   */
  async execute(state: agent_state): Promise<Partial<agent_state>> {
    const plan = state.variables.execution_plan as { steps?: Array<{ tool_name: string; parameters: Record<string, unknown> }> } | undefined;
    
    if (!plan?.steps?.length) {
      return {
        current_step: "executed",
        variables: { ...state.variables, execution_results: [] }
      };
    }

    const results = await this.execute_steps(plan.steps, state);

    return {
      current_step: "executed",
      variables: { ...state.variables, execution_results: results },
      execution_history: [...state.execution_history, ...results],
      token_usage: state.token_usage,
      model_costs: state.model_costs
    };
  }

  /**
   * Executes individual steps from the plan
   * @param steps - Array of execution steps
   * @param state - Current agent state
   * @returns Array of execution results
   */
  private async execute_steps(steps: Array<{ tool_name: string; parameters: Record<string, unknown> }>, state: agent_state): Promise<execution_result[]> {
    const results: execution_result[] = [];
    
    for (const step of steps) {
      const result = await this.execute_single_step(step);
      results.push(result);
      
      // Update token usage and costs if available
      if (result.status === "success" && result.result) {
        const execution_result = result.result as { token_usage?: { input?: number; output?: number }; model_costs?: number };
        if (execution_result.token_usage) {
          state.token_usage.input += execution_result.token_usage.input || 0;
          state.token_usage.output += execution_result.token_usage.output || 0;
        }
        if (execution_result.model_costs) {
          state.model_costs += execution_result.model_costs || 0;
        }
      }
    }
    
    return results;
  }

  /**
   * Executes a single step
   * @param step - Step to execute
   * @returns Execution result
   */
  private async execute_single_step(step: { tool_name: string; parameters: Record<string, unknown> }): Promise<execution_result> {
    const tool_id = step.tool_name?.replace(/^.*_/, '');
    const tool = this.tools_registry.get(tool_id);
    
    if (!tool) {
      return {
        step: step,
        error: "Tool not found",
        status: "failed"
      };
    }

    try {
      const result = await tool.execute(step.parameters);
      return {
        step: step,
        result: result,
        status: "success"
      };
    } catch (error) {
      return {
        step: step,
        error: error instanceof Error ? error.message : "Unknown error",
        status: "failed"
      };
    }
  }
}