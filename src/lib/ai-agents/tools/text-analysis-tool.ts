import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { workflow_node_tool, workflow_node } from "../types";

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
  static create(node: workflow_node, model: any): workflow_node_tool {
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
        return await this.execute_text_analysis(node, input, model);
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
    input: any, 
    model: any
  ): Promise<any> {
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
    
    return {
      analysis: response.content,
      input_text: input.text,
      analysis_type: input.analysis_type,
      token_usage: {
        input: response.usage_metadata?.input_tokens || 0,
        output: response.usage_metadata?.output_tokens || 0
      },
      status: "success"
    };
  }
}