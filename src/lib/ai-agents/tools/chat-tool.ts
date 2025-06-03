import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { workflow_node_tool, workflow_node } from "../types";
import { extract_message_content } from "../utils/message-utils";

/**
 * Chat tool implementation for basic conversational interactions
 */
export class chat_tool {
  /**
   * Creates a chat tool from a workflow node
   * @param node - Workflow node configuration
   * @param model - ChatXAI model instance
   * @returns Configured chat tool
   */
  static create(node: workflow_node, model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>): workflow_node_tool {
    return {
      id: node.id,
      type: node.type,
      name: `chat_${node.id}`,
      description: `Handle conversational interactions and provide human-like responses. ${node.data.description || ''}`,
      parameters: z.object({
        user_message: z.string().describe("The user's message to respond to"),
        context: z.string().optional().describe("Additional context for the conversation"),
        personality: z.string().optional().describe("Personality style for the response"),
      }),
      execute: async (input) => {
        return await this.execute_chat(node, input as { user_message: string; context?: string; personality?: string }, model);
      }
    };
  }

  /**
   * Executes chat interaction
   * @param node - Node configuration
   * @param input - Input parameters
   * @param model - ChatXAI model instance
   * @returns Chat response result
   */
  private static async execute_chat(
    node: workflow_node, 
    input: { user_message: string; context?: string; personality?: string }, 
    model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>
  ): Promise<{ response: string; personality_used: string; context_used: string; token_usage?: { input: number; output: number } }> {
    const personality = input.personality || (node.data.personality as string) || "friendly and helpful";
    const context = input.context || (node.data.context as string) || "";
    
    const system_prompt = this.build_system_prompt(personality, context);
    
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(input.user_message)
    ];

    const response = await model.invoke(messages);

    return {
      response: extract_message_content(response.content),
      personality_used: personality,
      context_used: context,
      token_usage: {
        input: response.usage_metadata?.input_tokens || 0,
        output: response.usage_metadata?.output_tokens || 0
      }
    };
  }

  /**
   * Builds the system prompt for conversational interactions
   * @param personality - Personality style to use
   * @param context - Additional context
   * @returns System prompt string
   */
  private static build_system_prompt(personality: string, context: string): string {
    const base_prompt = `You are a conversational AI assistant with a ${personality} personality. 
    Provide natural, engaging, and helpful responses to user messages.
    
    Guidelines:
    - Be conversational and human-like in your responses
    - Show empathy and understanding when appropriate
    - Ask follow-up questions to keep the conversation flowing
    - Provide helpful information when requested
    - Match the tone and energy of the user's message
    - Be concise but thorough in your responses`;

    return context ? `${base_prompt}\n\nAdditional context: ${context}` : base_prompt;
  }

  /**
   * Calculates model costs based on token usage
   * @param usage_metadata - Token usage metadata
   * @returns Estimated cost
   */
  private static calculate_model_costs(usage_metadata: { input_tokens?: number; output_tokens?: number }): number {
    if (!usage_metadata) return 0;
    
    const input_tokens = usage_metadata.input_tokens || 0;
    const output_tokens = usage_metadata.output_tokens || 0;
    
    // Approximate cost calculation (adjust based on actual pricing)
    const cost_per_1k_input = 0.002;
    const cost_per_1k_output = 0.006;
    
    return ((input_tokens * cost_per_1k_input) + (output_tokens * cost_per_1k_output)) / 1000;
  }
} 