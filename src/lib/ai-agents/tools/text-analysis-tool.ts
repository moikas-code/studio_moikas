import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { workflow_node_tool, workflow_node } from "../types";
import { extract_message_content } from "../utils/message-utils";

/**
 * Text analysis tool implementation
 */
export class text_analysis_tool {
  /**
   * Creates a text analysis tool from a workflow node
   * @param node - Workflow node configuration
   * @param model - ChatXAI model instance
   * @returns Configured text analysis tool
   */
  static create(node: workflow_node, model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>): workflow_node_tool {
    return {
      id: node.id,
      type: node.type,
      name: `analyze_text_${node.id}`,
      description: `Analyze text content. ${node.data.description || ''}`,
      parameters: z.object({
        text: z.string().describe("Text to analyze"),
        analysis_type: z.string().optional().describe("Type of analysis to perform"),
      }),
      execute: async (input) => {
        return await this.execute_text_analysis(node, input as { text: string; analysis_type?: string }, model);
      }
    };
  }

  /**
   * Executes text analysis
   * @param node - Node configuration
   * @param input - Input parameters
   * @param model - ChatXAI model instance
   * @returns Analysis result
   */
  private static async execute_text_analysis(
    node: workflow_node, 
    input: { text: string; analysis_type?: string }, 
    model: ReturnType<typeof import('../utils/model-factory').model_factory.create_xai_model>
  ): Promise<{ analysis: string; sentiment: string; key_themes: string[]; word_count: number; token_usage?: { input: number; output: number } }> {
    const analysis_prompt = `Analyze the following text: ${input.text}
    
    Analysis type: ${input.analysis_type || 'general'}
    
    Provide a detailed analysis including:
    - Sentiment
    - Key themes
    - Word count
    - Readability score`;

    const messages = [
      new SystemMessage("You are a text analysis expert."),
      new HumanMessage(analysis_prompt)
    ];

    const response = await model.invoke(messages);
    
    // Parse the analysis response to extract structured data
    const analysis_content = extract_message_content(response.content);
    
    return {
      analysis: analysis_content,
      sentiment: "neutral", // TODO: Extract from analysis
      key_themes: [], // TODO: Extract from analysis
      word_count: input.text.split(/\s+/).length,
      token_usage: {
        input: response.usage_metadata?.input_tokens || 0,
        output: response.usage_metadata?.output_tokens || 0
      }
    };
  }
}