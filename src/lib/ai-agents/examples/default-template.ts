/**
 * Default template example for basic chat interactions
 * This template can be used as a starting point for general conversational workflows
 */

import { workflow_executor } from "../workflow/workflow-executor";
import { HumanMessage } from "@langchain/core/messages";
import { workflow_node } from "../types";

/**
 * Creates a default chat template configuration
 * @param personality - Optional personality override
 * @param context - Optional context for the conversation
 * @returns Default template configuration
 */
export function create_default_chat_template(
  personality: string = "helpful and engaging",
  context: string = "You are a helpful assistant ready to chat about anything"
) {
  const default_chat_node: workflow_node = {
    id: "default-chat",
    type: "chat",
    data: {
      personality,
      description: "General purpose conversational assistant",
      context
    }
  };

  return {
    template_id: "default-chat-template",
    name: "Default Chat Template", 
    description: "Basic conversational template for general chat interactions",
    nodes: [default_chat_node],
    
    // Template metadata
    metadata: {
      category: "conversational",
      difficulty: "beginner",
      use_cases: [
        "General conversation",
        "Q&A sessions", 
        "Casual chat",
        "Information requests",
        "Getting started interactions"
      ]
    }
  };
}

/**
 * Executes a default chat workflow
 * @param user_message - The user's message
 * @param session_id - Session ID for conversation tracking
 * @param user_id - User ID
 * @param options - Optional configuration
 * @returns Chat response
 */
export async function execute_default_chat(
  user_message: string,
  session_id: string,
  user_id: string,
  options: {
    personality?: string;
    context?: string;
    workflow_id?: string;
  } = {}
) {
  const template = create_default_chat_template(
    options.personality,
    options.context
  );

  const executor = new workflow_executor();
  
  const result = await executor.execute(
    [new HumanMessage(user_message)],
    options.workflow_id || `default-chat-${Date.now()}`,
    session_id,
    user_id,
    template.nodes
  );

  return {
    response: result.response,
    token_usage: result.token_usage,
    model_costs: result.model_costs,
    session_id,
    template_used: template.template_id
  };
}

/**
 * Example usage demonstrations
 */
export async function demonstrate_default_templates() {
  console.log("=== Default Chat Template Examples ===\n");

  // Example 1: Basic chat
  console.log("1. Basic Chat:");
  try {
    const result1 = await execute_default_chat(
      "Hello! Can you tell me about yourself?",
      "demo-session-1",
      "demo-user"
    );
    console.log(`Response: ${result1.response}`);
    console.log(`Tokens: ${result1.token_usage.input + result1.token_usage.output}`);
    console.log(`Cost: $${result1.model_costs.toFixed(4)}\n`);
  } catch (error) {
    console.error("Basic chat failed:", error);
  }

  // Example 2: Specialized personality
  console.log("2. Specialized Personality (Enthusiastic Tutor):");
  try {
    const result2 = await execute_default_chat(
      "I want to learn about machine learning. Where should I start?",
      "demo-session-2", 
      "demo-user",
      {
        personality: "enthusiastic and encouraging tutor",
        context: "You are helping someone learn new technical concepts"
      }
    );
    console.log(`Response: ${result2.response}`);
    console.log(`Cost: $${result2.model_costs.toFixed(4)}\n`);
  } catch (error) {
    console.error("Specialized personality chat failed:", error);
  }

  // Example 3: Support context
  console.log("3. Customer Support Context:");
  try {
    const result3 = await execute_default_chat(
      "I'm having trouble with my account login. Can you help?",
      "demo-session-3",
      "demo-user",
      {
        personality: "patient and helpful support agent",
        context: "You are providing customer support. Be empathetic and focus on problem-solving."
      }
    );
    console.log(`Response: ${result3.response}`);
    console.log(`Cost: $${result3.model_costs.toFixed(4)}\n`);
  } catch (error) {
    console.error("Support context chat failed:", error);
  }
}

/**
 * Template variations for different use cases
 */
export const default_template_variations = {
  // General conversation
  general: () => create_default_chat_template(),
  
  // Customer support
  support: () => create_default_chat_template(
    "patient and helpful support agent",
    "You are providing customer support. Be empathetic, ask clarifying questions, and focus on problem-solving."
  ),
  
  // Educational tutor
  tutor: () => create_default_chat_template(
    "enthusiastic and encouraging tutor",
    "You are helping someone learn. Break down complex topics, provide examples, and encourage questions."
  ),
  
  // Creative assistant
  creative: () => create_default_chat_template(
    "creative and inspiring",
    "You are a creative assistant helping with brainstorming, writing, and artistic projects."
  ),
  
  // Technical assistant
  technical: () => create_default_chat_template(
    "knowledgeable and precise technical expert",
    "You are helping with technical questions. Provide accurate information and practical solutions."
  )
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstrate_default_templates();
} 