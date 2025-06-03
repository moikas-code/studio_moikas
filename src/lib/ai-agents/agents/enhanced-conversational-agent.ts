import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { agent_state, structured_ai_response } from "../types";
import { extract_message_content } from "../utils/message-utils";

/**
 * Enhanced conversational agent that produces structured responses
 * for better logging, debugging, and user experience
 */
export class enhanced_conversational_agent {
  private model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>;

  constructor(model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>) {
    this.model = model;
  }

  /**
   * Generate a structured conversational response
   * @param state - Current agent state
   * @returns Structured AI response with thinking and objectives
   */
  async generate_structured_response(state: agent_state): Promise<structured_ai_response> {
    const conversation_history = this.extract_conversation_history(state.messages);
    const latest_message = state.messages[state.messages.length - 1];
    const user_input = extract_message_content(latest_message.content);

    const personality = (typeof state.variables.personality === 'string' ? state.variables.personality : null) || "friendly and helpful";
    const context = (typeof state.variables.context === 'string' ? state.variables.context : null) || "";

    // Create a detailed system prompt for structured thinking
    const system_prompt = this.build_structured_prompt(personality, context, conversation_history);
    
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(user_input)
    ];

    try {
      const response = await this.model.invoke(messages);
      const response_content = extract_message_content(response.content);
      
      // Parse the structured response from the AI
      const structured_response = this.parse_structured_response(response_content, user_input);
      
      return structured_response;
    } catch (error) {
      console.error("Enhanced conversational agent error:", error);
      
      // Fallback structured response
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Could you try rephrasing it?",
        thinking: `Error occurred while processing: ${error instanceof Error ? error.message : String(error)}`,
        objectives: ["Handle error gracefully", "Maintain conversation flow"],
        summary: "Encountered an error and provided a fallback response",
        confidence: 0.3,
        metadata: {
          response_type: "error",
          requires_followup: true,
          suggested_actions: ["Try rephrasing the request", "Check system status"]
        }
      };
    }
  }

  /**
   * Build system prompt for structured thinking
   */
  private build_structured_prompt(personality: string, context: string, conversation_history: string): string {
    return `You are an AI assistant with a ${personality} personality. ${context}

IMPORTANT: You must respond in this EXACT structured format:

<thinking>
[Your internal reasoning and analysis of the user's request. Consider: what they want, why they might want it, what information you need to provide, and how to best help them. This section is for logging and debugging purposes.]
</thinking>

<objectives>
[List the specific objectives or goals you've identified from the user's request, separated by semicolons]
</objectives>

<response>
[Your actual response to the user - this is what they will see. Be natural, helpful, and conversational.]
</response>

<summary>
[Brief summary of what you accomplished or provided in this response]
</summary>

<confidence>
[Your confidence level in this response, as a number between 0 and 1]
</confidence>

<metadata>
response_type: [greeting|question|task|conversation|error]
requires_followup: [true|false]
suggested_actions: [comma-separated list of suggested follow-up actions, if any]
</metadata>

Previous conversation:
${conversation_history}

Remember to:
1. Be natural and conversational in your <response> section
2. Show your reasoning in the <thinking> section
3. Clearly identify what the user wants in <objectives>
4. Provide helpful follow-up suggestions when appropriate
5. Be honest about your confidence level`;
  }

  /**
   * Parse structured response from AI output
   */
  private parse_structured_response(ai_output: string, user_input: string): structured_ai_response {
    try {
      // Extract sections using regex (without 's' flag for compatibility)
      const thinking_match = ai_output.match(/<thinking>([\s\S]*?)<\/thinking>/);
      const objectives_match = ai_output.match(/<objectives>([\s\S]*?)<\/objectives>/);
      const response_match = ai_output.match(/<response>([\s\S]*?)<\/response>/);
      const summary_match = ai_output.match(/<summary>([\s\S]*?)<\/summary>/);
      const confidence_match = ai_output.match(/<confidence>([\s\S]*?)<\/confidence>/);
      const metadata_match = ai_output.match(/<metadata>([\s\S]*?)<\/metadata>/);

      // Parse metadata
      let metadata: {
        response_type?: "greeting" | "question" | "task" | "conversation" | "error";
        requires_followup?: boolean;
        suggested_actions?: string[];
      } = {};
      if (metadata_match) {
        const metadata_text = metadata_match[1];
        const response_type_match = metadata_text.match(/response_type:\s*(\w+)/);
        const requires_followup_match = metadata_text.match(/requires_followup:\s*(true|false)/);
        const suggested_actions_match = metadata_text.match(/suggested_actions:\s*(.+)/);

        const response_type = response_type_match ? response_type_match[1] as "greeting" | "question" | "task" | "conversation" | "error" : this.classify_response_type(user_input);
        metadata = {
          response_type: ["greeting", "question", "task", "conversation", "error"].includes(response_type) 
            ? response_type 
            : this.classify_response_type(user_input),
          requires_followup: requires_followup_match ? requires_followup_match[1] === 'true' : false,
          suggested_actions: suggested_actions_match 
            ? suggested_actions_match[1].split(',').map(s => s.trim())
            : []
        };
      }

      return {
        response: response_match ? response_match[1].trim() : ai_output,
        thinking: thinking_match ? thinking_match[1].trim() : undefined,
        objectives: objectives_match 
          ? objectives_match[1].split(';').map(obj => obj.trim()).filter(obj => obj.length > 0)
          : undefined,
        summary: summary_match ? summary_match[1].trim() : undefined,
        confidence: confidence_match ? parseFloat(confidence_match[1].trim()) : undefined,
        metadata: metadata
      };
    } catch (error) {
      console.error("Error parsing structured response:", error);
      
      // Fallback to simple response
      return {
        response: ai_output,
        thinking: "Failed to parse structured response",
        objectives: ["Provide response to user"],
        summary: "Provided unstructured response due to parsing error",
        confidence: 0.5,
        metadata: {
          response_type: this.classify_response_type(user_input),
          requires_followup: false,
          suggested_actions: []
        }
      };
    }
  }

  /**
   * Classify the type of response based on user input
   */
  private classify_response_type(user_input: string): "greeting" | "question" | "task" | "conversation" | "error" {
    const input_lower = user_input.toLowerCase();
    
    if (input_lower.match(/^(hi|hello|hey|howdy|sup|what's up|good morning|good afternoon|good evening)/)) {
      return "greeting";
    }
    
    if (input_lower.includes('?') || input_lower.startsWith('what') || input_lower.startsWith('how') || 
        input_lower.startsWith('why') || input_lower.startsWith('where') || input_lower.startsWith('when') ||
        input_lower.startsWith('who')) {
      return "question";
    }
    
    if (input_lower.match(/^(can you|could you|please|help me|i need|i want|create|make|generate|write|build)/)) {
      return "task";
    }
    
    return "conversation";
  }

  /**
   * Extract conversation history for context
   */
  private extract_conversation_history(messages: BaseMessage[]): string {
    if (messages.length <= 1) return "No previous conversation.";
    
    const recent_messages = messages.slice(-6, -1); // Last 5 messages before current
    return recent_messages
      .map(msg => `${msg.constructor.name === 'HumanMessage' ? 'User' : 'AI'}: ${extract_message_content(msg.content)}`)
      .join('\n');
  }
}