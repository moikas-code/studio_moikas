/**
 * Example of using the chat tool and conversational agent for basic chat interactions
 */

import { workflow_executor } from "../workflow/workflow-executor";
import { conversational_agent } from "../agents/conversational-agent";
import { model_factory } from "../utils/model-factory";
import { HumanMessage } from "@langchain/core/messages";
import { workflow_node, agent_state } from "../types";

/**
 * Basic chat example using the workflow system
 */
async function run_basic_chat_workflow() {
  console.log("Starting basic chat workflow...");

  // Create workflow executor
  const executor = new workflow_executor();

  // Define a chat workflow node
  const chat_node: workflow_node = {
    id: "chat-1",
    type: "chat",
    data: {
      personality: "friendly and knowledgeable",
      description: "A helpful assistant for general conversations",
      context: "You are helping users with general questions and conversations"
    }
  };

  try {
    const result = await executor.execute(
      [new HumanMessage("Hi! Can you tell me about the benefits of exercise?")],
      "chat-workflow-123",
      "session-456", 
      "user-789",
      [chat_node]
    );

    console.log("Chat Response:", result.response);
    console.log("Tokens used:", result.token_usage);
    console.log("Model costs:", result.model_costs);
  } catch (error) {
    console.error("Chat workflow failed:", error);
  }
}

/**
 * Direct conversational agent example
 */
async function run_direct_conversational_agent() {
  console.log("Starting direct conversational agent...");

  // Create model and agent
  const model = model_factory.create_xai_model();
  const conv_agent = new conversational_agent(model);

  // Set up initial state for conversation
  const initial_state: agent_state = {
    messages: [
      new HumanMessage("Hello! I'm feeling a bit stressed about work lately. Any advice?")
    ],
    session_id: "conv-session-123",
    user_id: "user-456",
    variables: {
      personality: "empathetic and supportive",
      context: "Provide wellness and stress management advice",
      conversation_turn: 0
    },
    current_step: "start",
    execution_history: [],
    available_tools: [],
    token_usage: { input: 0, output: 0 },
    model_costs: 0
  };

  try {
    const result = await conv_agent.converse(initial_state);
    console.log("Conversational Response:", result.variables?.last_response);
    console.log("Conversation turn:", result.variables?.conversation_turn);
    console.log("Token usage:", result.token_usage);
  } catch (error) {
    console.error("Conversational agent failed:", error);
  }
}

/**
 * Multi-turn conversation example
 */
async function run_multi_turn_conversation() {
  console.log("Starting multi-turn conversation...");

  const model = model_factory.create_xai_model();
  const conv_agent = new conversational_agent(model);

  // Simulate a multi-turn conversation
  const conversation_messages = [
    "Hi there! I'm new to cooking. Where should I start?",
    "That sounds great! What are some essential kitchen tools I should get first?",
    "Perfect! Can you suggest a simple recipe I could try as a beginner?"
  ];

  let conversation_state: agent_state = {
    messages: [],
    session_id: "multi-turn-123",
    user_id: "user-789",
    variables: {
      personality: "enthusiastic and encouraging",
      context: "Help with cooking advice for beginners",
      conversation_turn: 0,
      max_conversation_turns: 10
    },
    current_step: "start",
    execution_history: [],
    available_tools: [],
    token_usage: { input: 0, output: 0 },
    model_costs: 0
  };

  try {
    for (const message of conversation_messages) {
      console.log(`\nUser: ${message}`);
      
      // Add user message to conversation
      conversation_state.messages.push(new HumanMessage(message));
      
      // Get agent response
      const result = await conv_agent.converse(conversation_state);
      
      // Update state with response
      conversation_state = { ...conversation_state, ...result };
      
      console.log(`Assistant: ${result.variables?.last_response}`);
      console.log(`Turn: ${result.variables?.conversation_turn}, Tokens: ${(result.token_usage?.input || 0) + (result.token_usage?.output || 0)}`);
      
      // Check if we should continue
      if (!conv_agent.should_continue_conversation(conversation_state)) {
        console.log("Conversation limit reached");
        break;
      }
    }
    
    console.log(`\nTotal conversation cost: $${conversation_state.model_costs?.toFixed(4)}`);
  } catch (error) {
    console.error("Multi-turn conversation failed:", error);
  }
}

/**
 * Example for default template usage
 */
export async function create_default_chat_template() {
  return {
    id: "default-chat",
    name: "Default Chat Template",
    description: "Basic conversational template for general chat interactions",
    nodes: [
      {
        id: "default-chat-node",
        type: "chat" as const,
        data: {
          personality: "helpful and engaging", 
          description: "General purpose chat assistant",
          context: "You are a helpful assistant ready to chat about anything"
        }
      }
    ],
    usage_example: {
      messages: [new HumanMessage("Hello! How are you today?")],
      expected_behavior: "Natural, friendly conversation with context awareness"
    }
  };
}

// Run examples if executed directly
if (require.main === module) {
  (async () => {
    await run_basic_chat_workflow();
    console.log("\n" + "=".repeat(50) + "\n");
    await run_direct_conversational_agent();
    console.log("\n" + "=".repeat(50) + "\n");
    await run_multi_turn_conversation();
  })();
} 