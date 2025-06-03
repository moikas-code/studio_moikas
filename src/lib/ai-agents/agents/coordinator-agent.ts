import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { agent_state } from "../types";

/**
 * Coordinator agent responsible for deciding if more execution is needed
 */
export class coordinator_agent {
  private model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>;

  constructor(model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>) {
    this.model = model;
  }

  /**
   * Analyzes execution results and decides next action
   * @param state - Current agent state
   * @returns Updated state with decision
   */
  async coordinate(state: agent_state): Promise<Partial<agent_state>> {
    const results = state.variables.execution_results as Array<{ status: string }> | undefined;
    const failed_steps = results?.filter((r: { status: string }) => r.status === "failed") || [];
    
    if (failed_steps.length === 0) {
      return {
        current_step: "finish"
      };
    }

    const decision = await this.analyze_failures(failed_steps);
    
    return {
      current_step: decision,
      messages: [...state.messages]
    };
  }

  /**
   * Analyzes failed steps and decides whether to retry
   * @param failed_steps - Array of failed execution results
   * @returns Decision to continue or finish
   */
  private async analyze_failures(failed_steps: Array<{ status: string; error?: string }>): Promise<string> {
    const system_prompt = `You are a coordinator agent. Some steps failed during execution. 
    Analyze the failures and determine if they can be recovered or if the task is complete.
    
    Failed steps: ${JSON.stringify(failed_steps)}
    
    Respond with either "continue" to retry/modify approach or "finish" to complete.`;

    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage("Should we continue or finish?")
    ];

    const response = await this.model.invoke(messages);
    const content = response.content.toString().toLowerCase();
    
    return content.includes("continue") ? "continue" : "finish";
  }
}