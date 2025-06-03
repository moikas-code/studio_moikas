/**
 * Example showing backward compatibility with legacy functions
 */

import { invoke_xai_agent_with_tools, build_xai_chain } from "../legacy/xai-legacy";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

async function use_legacy_functions() {
  // Example 1: Simple agent invocation
  const response1 = await invoke_xai_agent_with_tools({
    system_message: new SystemMessage("You are a helpful assistant."),
    prompt: new HumanMessage("What is the capital of France?")
  });
  console.log("Response 1:", response1);

  // Example 2: Agent with custom messages
  const response2 = await invoke_xai_agent_with_tools({
    messages: [
      new SystemMessage("You are a translation expert."),
      new HumanMessage("Translate 'Hello' to Spanish")
    ],
    prompt: new HumanMessage("Please provide the translation.")
  });
  console.log("Response 2:", response2);

  // Example 3: Using chain builder
  const prompt_template = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant that translates {input_language} to {output_language}."],
    ["human", "{input}"],
  ]);
  
  const chain = build_xai_chain({ prompt_template });
  const response3 = await chain.invoke({
    input_language: "English",
    output_language: "French",
    input: "Good morning!",
  });
  console.log("Response 3:", response3);
}

// Run if executed directly
if (require.main === module) {
  use_legacy_functions();
}