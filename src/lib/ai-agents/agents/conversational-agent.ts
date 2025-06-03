import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { agent_state } from "../types";
import { extract_message_content } from "../utils/message-utils";

/**
 * Conversational agent specialized for human-like chat interactions
 */
export class conversational_agent {
  private model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>;

  constructor(model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>) {
    this.model = model;
  }

  /**
   * Handles conversational interactions with context awareness
   * @param state - Current agent state
   * @returns Updated state with conversational response
   */
  async converse(state: agent_state): Promise<Partial<agent_state>> {
    const conversation_history = this.extract_conversation_history(state.messages);
    const latest_message = state.messages[state.messages.length - 1];
    const user_input = extract_message_content(latest_message.content);

    const personality = state.variables.personality || "friendly and helpful";
    const context = state.variables.context || "";

    const system_prompt = this.build_conversational_prompt(personality, context, conversation_history);
    
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(user_input)
    ];

    const response = await this.model.invoke(messages);

    // Update token usage and costs
    if (response.usage_metadata) {
      state.token_usage.input += response.usage_metadata.input_tokens || 0;
      state.token_usage.output += response.usage_metadata.output_tokens || 0;
      state.model_costs += this.calculate_conversation_costs(response.usage_metadata);
    }

    return {
      current_step: "responded",
      messages: [...state.messages, response],
      variables: {
        ...state.variables,
        last_response: extract_message_content(response.content),
        conversation_turn: (state.variables.conversation_turn || 0) + 1
      },
      token_usage: state.token_usage,
      model_costs: state.model_costs
    };
  }

  /**
   * Builds a conversational system prompt
   * @param personality - Personality style to use
   * @param context - Additional context
   * @param conversation_history - Previous conversation turns
   * @returns System prompt for conversation
   */
  private build_conversational_prompt(
    personality: string, 
    context: string, 
    conversation_history: string
  ): string {
    const base_prompt = `You are a conversational AI assistant with a ${personality} personality.
    Your goal is to have natural, engaging conversations with users.
    
    Conversation Guidelines:
    - Maintain a consistent personality throughout the conversation
    - Reference previous parts of the conversation when relevant
    - Ask thoughtful follow-up questions to keep the conversation flowing
    - Show genuine interest in what the user is sharing
    - Provide helpful information and insights when appropriate
    - Be empathetic and supportive when the user shares personal experiences
    - Keep responses conversational and avoid being overly formal
    - Match the user's energy level and communication style`;

    let full_prompt = base_prompt;

    if (context) {
      full_prompt += `\n\nAdditional Context: ${context}`;
    }

    if (conversation_history) {
      full_prompt += `\n\nConversation History:\n${conversation_history}`;
    }

    full_prompt += `\n\nRemember to be natural and human-like in your response.`;

    return full_prompt;
  }

  /**
   * Extracts conversation history from messages
   * @param messages - Array of conversation messages
   * @returns Formatted conversation history
   */
  private extract_conversation_history(messages: BaseMessage[]): string {
    if (messages.length <= 1) return "";

    const history_messages = messages.slice(0, -1); // Exclude the current message
    const formatted_history = history_messages
      .map((msg, index) => {
        const content = extract_message_content(msg.content);
        const role = msg.constructor.name === "HumanMessage" ? "User" : "Assistant";
        return `${role}: ${content}`;
      })
      .join("\n");

    return formatted_history;
  }

  /**
   * Calculates conversation costs
   * @param usage_metadata - Token usage metadata
   * @returns Estimated cost
   */
  private calculate_conversation_costs(usage_metadata: { input_tokens?: number; output_tokens?: number }): number {
    if (!usage_metadata) return 0;
    
    const input_tokens = usage_metadata.input_tokens || 0;
    const output_tokens = usage_metadata.output_tokens || 0;
    
    // Standard pricing for conversational model
    const cost_per_1k_input = 0.002;
    const cost_per_1k_output = 0.006;
    
    return ((input_tokens * cost_per_1k_input) + (output_tokens * cost_per_1k_output)) / 1000;
  }

  /**
   * Checks if the conversation should continue
   * @param state - Current agent state
   * @returns Whether to continue the conversation
   */
  should_continue_conversation(state: agent_state): boolean {
    const max_turns = state.variables.max_conversation_turns || 50;
    const current_turn = state.variables.conversation_turn || 0;
    
    return current_turn < max_turns;
  }
} 