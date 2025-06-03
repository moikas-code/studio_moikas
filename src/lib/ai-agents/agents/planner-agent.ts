import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { agent_state, execution_plan } from "../types";
import { extract_json_from_message, extract_message_content } from "../utils/message-utils";

/**
 * Planner agent responsible for analyzing user requests and creating execution plans
 */
export class planner_agent {
  private model: any;

  constructor(model: any) {
    this.model = model;
  }

  /**
   * Analyzes user request and creates an execution plan
   * @param state - Current agent state
   * @returns Updated state with execution plan
   */
  async plan(state: agent_state): Promise<Partial<agent_state>> {
    const last_message = state.messages[state.messages.length - 1];
    const user_input = last_message.content;

    const system_prompt = this.build_system_prompt(state);
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(`Plan execution for: ${user_input}`)
    ];

    const response = await this.model.invoke(messages);
    const plan = this.extract_plan(response);

    return {
      variables: { ...state.variables, execution_plan: plan },
      current_step: "planned",
      messages: [...state.messages, response]
    };
  }

  /**
   * Builds the system prompt for the planner
   * @param state - Current agent state
   * @returns System prompt string
   */
  private build_system_prompt(state: agent_state): string {
    const available_tools = Array.from(state.available_tools)
      .map(t => `${t.name}: ${t.description}`)
      .join(', ');

    return `You are a workflow planner agent. Analyze the user's request and create an execution plan.
    
Available tools: ${available_tools}

Break down the user's request into steps that can be executed using the available tools.
Respond with a JSON plan containing:
- steps: array of steps with tool_name and parameters
- reasoning: explanation of the plan`;
  }

  /**
   * Extracts execution plan from model response
   * @param response - Model response
   * @returns Execution plan
   */
  private extract_plan(response: any): execution_plan {
    const content = extract_message_content(response.content);
    const json_plan = extract_json_from_message(content);
    
    if (json_plan && json_plan.steps) {
      return json_plan;
    }
    
    // Fallback if JSON extraction fails
    return { 
      steps: [], 
      reasoning: content 
    };
  }
}