import { ChatXAI } from "@langchain/xai";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAIToolType } from "@langchain/core/experimental/openai_types";

/**
 * Centralized function to handle xAI agent requests with tool support and dynamic system prompt.
 * @param system_message - Optional system message (defaults to a helpful assistant)
 * @param prompt - The main human message (user prompt)
 * @param messages - Optional additional messages (e.g., chat history)
 * @param tools - Optional array of tools (LangChain tools, schemas, or functions)
 * @param model_options - Optional model options (e.g., temperature, maxTokens)
 * @returns The agent's response as a string
 */
export async function invoke_xai_agent_with_tools({
  system_message = new SystemMessage("You are a helpful assistant."),
  prompt,
  messages,
  tools = undefined,
  model_options = {},
}: {
  system_message?: SystemMessage;
  prompt: HumanMessage;
  messages?: BaseMessage[];
  tools?: ChatOpenAIToolType[];
  model_options?: Record<string, unknown>;
}): Promise<string> {
  // Instantiate the xAI model with API key and any additional options
  const model = new ChatXAI({
    apiKey: process.env.XAI_API_KEY,
    model: "grok-3-mini",
    ...model_options,
  });
  const _messages = [system_message, ...(messages || []), prompt];
  // If tools are provided, bind them and use the returned runnable
  let response;
  if (tools && Array.isArray(tools) && tools.length > 0) {
    // TODO: Replace with correct type if not ChatOpenAIToolType
    const runnable = model.bindTools(tools as ChatOpenAIToolType[]);
    response = await runnable.invoke(_messages);
  } else {
    response = await model.invoke(_messages);
  }

  // Handle both string and array content types
  if (typeof response.content === "string") {
    return response.content;
  } else if (Array.isArray(response.content)) {
    // Join array elements into a single string
    return response.content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "text" in item)
          return String(item.text);
        return "";
      })
      .join("");
  }
  // Fallback: return empty string if content is not recognized
  return "";
}

/**
 * Build a chain using a prompt template, the xAI model, and an output parser.
 * This enables chaining as described in the LangChain JS docs:
 * https://js.langchain.com/docs/integrations/chat/xai/#chaining
 * @param prompt_template - A ChatPromptTemplate instance
 * @param model_options - Optional model options (e.g., temperature, maxTokens)
 * @returns A chain (runnable) that can be invoked with input variables
 */
export function build_xai_chain({
  prompt_template,
  model_options = {},
}: {
  prompt_template: ChatPromptTemplate;
  model_options?: Record<string, unknown>;
}) {
  const model = new ChatXAI({
    apiKey: process.env.XAI_API_KEY,
    model: "grok-3-mini",
    ...model_options,
  });
  const output_parser = new StringOutputParser();
  // Chain: prompt -> model -> output parser
  return prompt_template.pipe(model).pipe(output_parser);
}

// Example usage:
// const messages = [
//   new SystemMessage("You are a helpful assistant."),
//   new HumanMessage("What color is the sky?")
// ];
// const result = await invoke_xai_agent_with_tools({ messages, tools: [/* your tools here */] });

// Example usage for chaining:
// import { ChatPromptTemplate } from "@langchain/core/prompts";
// const prompt = ChatPromptTemplate.fromMessages([
//   ["system", "You are a helpful assistant that translates {input_language} to {output_language}."],
//   ["human", "{input}"],
// ]);
// const chain = build_xai_chain({ prompt_template: prompt });
// const response = await chain.invoke({
//   input_language: "English",
//   output_language: "German",
//   input: "I love programming.",
// });
// console.log(response);
