import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { model_factory } from "../utils/model-factory";
import { extract_message_content } from "../utils/message-utils";

/**
 * Legacy function for invoking xAI agent with tools
 * @deprecated Use workflow_executor instead for new implementations
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
  tools?: unknown[];
  model_options?: Record<string, unknown>;
}): Promise<string> {
  const model = model_factory.create_xai_model(model_options);
  
  const _messages = [system_message, ...(messages || []), prompt];
  
  let response;
  if (tools && Array.isArray(tools) && tools.length > 0) {
    const runnable = model.bindTools(tools as unknown[]);
    response = await runnable.invoke(_messages);
  } else {
    response = await model.invoke(_messages);
  }

  return extract_message_content(response.content);
}

/**
 * Legacy function for building xAI chain
 * @deprecated Use workflow_executor instead for new implementations
 */
export function build_xai_chain({
  prompt_template,
  model_options = {},
}: {
  prompt_template: ChatPromptTemplate;
  model_options?: Record<string, unknown>;
}) {
  const model = model_factory.create_legacy_xai_model(model_options);
  const output_parser = new StringOutputParser();
  return prompt_template.pipe(model).pipe(output_parser);
}