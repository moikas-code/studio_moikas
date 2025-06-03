import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { workflow_node_tool, workflow_node } from "../types";
import { extract_message_content } from "../utils/message-utils";

/**
 * LLM (Language Model) tool implementation
 */
export class llm_tool {
  /**
   * Creates an LLM tool from a workflow node
   * @param node - Workflow node configuration
   * @param model - ChatXAI model instance
   * @returns Configured LLM tool
   */
  static create(node: workflow_node, model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>): workflow_node_tool {
    return {
      id: node.id,
      type: node.type,
      name: `llm_process_${node.id}`,
      description: `Process text using LLM. ${node.data.description || ''}`,
      parameters: z.object({
        input_text: z.string().describe("Input text to process"),
        instructions: z.string().optional().describe("Additional instructions"),
      }),
      execute: async (input) => {
        return await this.execute_llm(node, input as { input_text: string; instructions?: string }, model);
      }
    };
  }

  /**
   * Executes LLM processing
   * @param node - Node configuration
   * @param input - Input parameters
   * @param model - ChatXAI model instance
   * @returns Processing result
   */
  private static async execute_llm(
    node: workflow_node, 
    input: { input_text: string; instructions?: string }, 
    model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>
  ): Promise<{ response: string; token_usage?: { input: number; output: number } }> {
    const prompt = (node.data.prompt as string) || input.instructions || input.input_text;
    const system_prompt = (node.data.system_prompt as string) || "You are a helpful assistant.";

    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(prompt)
    ];

    const response = await model.invoke(messages);

    return {
      response: extract_message_content(response.content),
      token_usage: {
        input: response.usage_metadata?.input_tokens || 0,
        output: response.usage_metadata?.output_tokens || 0
      }
    };
  }
}