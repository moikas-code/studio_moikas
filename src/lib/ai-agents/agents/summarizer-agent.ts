import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { agent_state } from "../types";

/**
 * Summarizer agent responsible for creating final responses
 */
export class summarizer_agent {
  private model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>;

  constructor(model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>) {
    this.model = model;
  }

  /**
   * Creates a comprehensive summary of execution results
   * @param state - Current agent state
   * @returns Updated state with final summary
   */
  async summarize(state: agent_state): Promise<Partial<agent_state>> {
    const results = state.variables.execution_results;
    const original_request = state.messages[0].content;

    const system_prompt = this.build_summary_prompt(original_request, results);
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage("Summarize the execution results")
    ];

    const response = await this.model.invoke(messages);

    return {
      current_step: "completed",
      messages: [...state.messages, response]
    };
  }

  /**
   * Builds the summary prompt
   * @param original_request - Original user request
   * @param results - Execution results
   * @returns Summary prompt
   */
  private build_summary_prompt(original_request: unknown, results: unknown): string {
    return `You are a summarizer agent. Create a comprehensive response based on the execution results.
    
    Original request: ${original_request}
    Execution results: ${JSON.stringify(results)}
    
    Provide a helpful summary of what was accomplished.`;
  }
}