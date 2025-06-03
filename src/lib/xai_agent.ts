import { ChatXAI } from "@langchain/xai";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage
} from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { StateGraph, END, START } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Types for workflow integration
export interface workflow_node_tool {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (input: any) => Promise<any>;
}

export interface agent_state {
  messages: BaseMessage[];
  workflow_id?: string;
  session_id: string;
  user_id: string;
  variables: Record<string, any>;
  current_step: string;
  execution_history: any[];
  available_tools: workflow_node_tool[];
  token_usage: { input: number; output: number };
  model_costs: number;
}

/**
 * Enhanced xAI agent with LangGraph support for workflow integration
 */
export class workflow_xai_agent {
  private model: ChatXAI;
  private workflow_graph: StateGraph<agent_state>;
  private tools_registry: Map<string, workflow_node_tool> = new Map();

  constructor(model_options: Record<string, unknown> = {}) {
    this.model = new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: "grok-3-mini-latest",
      ...model_options,
    });
    
    this.workflow_graph = new StateGraph<agent_state>({
      messages: [],
      session_id: "",
      user_id: "",
      variables: {},
      current_step: "start",
      execution_history: [],
      available_tools: [],
      token_usage: { input: 0, output: 0 },
      model_costs: 0
    });
    
    this.setup_graph();
  }

  /**
   * Register workflow nodes as tools
   */
  register_workflow_nodes_as_tools(nodes: any[]) {
    for (const node of nodes) {
      const tool_def = this.create_tool_from_node(node);
      if (tool_def) {
        this.tools_registry.set(node.id, tool_def);
      }
    }
  }

  /**
   * Create a LangChain tool from a workflow node
   */
  private create_tool_from_node(node: any): workflow_node_tool | null {
    switch (node.type) {
      case "image_generator":
        return {
          id: node.id,
          type: node.type,
          name: `generate_image_${node.id}`,
          description: `Generate an image using ${node.data.model || 'default model'}. ${node.data.description || ''}`,
          parameters: z.object({
            prompt: z.string().describe("The prompt for image generation"),
            style: z.string().optional().describe("Style parameters"),
            size: z.string().optional().describe("Image size"),
          }),
          execute: async (input) => {
            return await this.execute_image_generation_node(node, input);
          }
        };

      case "text_analyzer":
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
            return await this.execute_text_analysis_node(node, input);
          }
        };

      case "llm":
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
            return await this.execute_llm_node(node, input);
          }
        };

      default:
        return null;
    }
  }

  /**
   * Setup the LangGraph workflow
   */
  private setup_graph() {
    // Define graph nodes
    this.workflow_graph.addNode("planner", this.planner_agent.bind(this));
    this.workflow_graph.addNode("executor", this.executor_agent.bind(this));
    this.workflow_graph.addNode("coordinator", this.coordinator_agent.bind(this));
    this.workflow_graph.addNode("summarizer", this.summarizer_agent.bind(this));

    // Define edges
    this.workflow_graph.addEdge(START, "planner");
    this.workflow_graph.addEdge("planner", "executor");
    this.workflow_graph.addEdge("executor", "coordinator");
    
    // Conditional edge for continuing or finishing
    this.workflow_graph.addConditionalEdges(
      "coordinator",
      this.should_continue.bind(this),
      {
        continue: "executor",
        finish: "summarizer"
      }
    );
    
    this.workflow_graph.addEdge("summarizer", END);
  }

  /**
   * Planner agent - analyzes user request and creates execution plan
   */
  private async planner_agent(state: agent_state): Promise<Partial<agent_state>> {
    const last_message = state.messages[state.messages.length - 1];
    const user_input = last_message.content;

    const system_prompt = `You are a workflow planner agent. Analyze the user's request and create an execution plan.
    
Available tools: ${Array.from(this.tools_registry.values()).map(t => `${t.name}: ${t.description}`).join(', ')}

Break down the user's request into steps that can be executed using the available tools.
Respond with a JSON plan containing:
- steps: array of steps with tool_name and parameters
- reasoning: explanation of the plan`;

    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(`Plan execution for: ${user_input}`)
    ];

    const response = await this.model.invoke(messages);
    let plan;
    
    try {
      // Try to extract JSON from response
      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const json_match = content.match(/\{[\s\S]*\}/);
      plan = json_match ? JSON.parse(json_match[0]) : { steps: [], reasoning: content };
    } catch {
      plan = { steps: [], reasoning: response.content };
    }

    return {
      variables: { ...state.variables, execution_plan: plan },
      current_step: "planned",
      messages: [...state.messages, response]
    };
  }

  /**
   * Executor agent - executes individual steps using tools
   */
  private async executor_agent(state: agent_state): Promise<Partial<agent_state>> {
    const plan = state.variables.execution_plan;
    if (!plan?.steps?.length) {
      return {
        current_step: "executed",
        variables: { ...state.variables, execution_results: [] }
      };
    }

    const results = [];
    
    for (const step of plan.steps) {
      const tool = this.tools_registry.get(step.tool_name?.replace(/^.*_/, ''));
      
      if (tool) {
        try {
          const result = await tool.execute(step.parameters);
          results.push({
            step: step,
            result: result,
            status: "success"
          });
          
          // Update token usage and costs
          if (result.token_usage) {
            state.token_usage.input += result.token_usage.input || 0;
            state.token_usage.output += result.token_usage.output || 0;
          }
          if (result.model_costs) {
            state.model_costs += result.model_costs || 0;
          }
        } catch (error) {
          results.push({
            step: step,
            error: error.message,
            status: "failed"
          });
        }
      } else {
        results.push({
          step: step,
          error: "Tool not found",
          status: "failed"
        });
      }
    }

    return {
      current_step: "executed",
      variables: { ...state.variables, execution_results: results },
      execution_history: [...state.execution_history, ...results]
    };
  }

  /**
   * Coordinator agent - decides if more execution is needed
   */
  private async coordinator_agent(state: agent_state): Promise<Partial<agent_state>> {
    const results = state.variables.execution_results;
    const failed_steps = results?.filter(r => r.status === "failed") || [];
    
    if (failed_steps.length > 0) {
      // Try to recover from failures
      const system_prompt = `You are a coordinator agent. Some steps failed during execution. 
      Analyze the failures and determine if they can be recovered or if the task is complete.
      
      Failed steps: ${JSON.stringify(failed_steps)}
      
      Respond with either "continue" to retry/modify approach or "finish" to complete.`;

      const messages = [
        new SystemMessage(system_prompt),
        new HumanMessage("Should we continue or finish?")
      ];

      const response = await this.model.invoke(messages);
      const decision = response.content.toString().toLowerCase().includes("continue") ? "continue" : "finish";
      
      return {
        current_step: decision,
        messages: [...state.messages, response]
      };
    }

    return {
      current_step: "finish"
    };
  }

  /**
   * Summarizer agent - creates final response
   */
  private async summarizer_agent(state: agent_state): Promise<Partial<agent_state>> {
    const results = state.variables.execution_results;
    const original_request = state.messages[0].content;

    const system_prompt = `You are a summarizer agent. Create a comprehensive response based on the execution results.
    
    Original request: ${original_request}
    Execution results: ${JSON.stringify(results)}
    
    Provide a helpful summary of what was accomplished.`;

    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage("Summarize the execution results")
    ];

    const response = await this.model.invoke(messages);

    return {
      current_step: "completed",
      messages: [...state.messages, response]
    };
  }

  /**
   * Decision function for conditional edges
   */
  private should_continue(state: agent_state): string {
    return state.current_step === "continue" ? "continue" : "finish";
  }

  /**
   * Execute the multi-agent workflow
   */
  async execute_workflow(
    messages: BaseMessage[],
    workflow_id: string,
    session_id: string,
    user_id: string,
    workflow_nodes: any[] = []
  ): Promise<{
    response: string;
    token_usage: { input: number; output: number };
    model_costs: number;
    execution_history: any[];
  }> {
    // Register workflow nodes as tools
    this.register_workflow_nodes_as_tools(workflow_nodes);

    const initial_state: agent_state = {
      messages,
      workflow_id,
      session_id,
      user_id,
      variables: {},
      current_step: "start",
      execution_history: [],
      available_tools: Array.from(this.tools_registry.values()),
      token_usage: { input: 0, output: 0 },
      model_costs: 0
    };

    const compiled_graph = this.workflow_graph.compile();
    const final_state = await compiled_graph.invoke(initial_state);

    const last_message = final_state.messages[final_state.messages.length - 1];
    const response = typeof last_message.content === 'string' 
      ? last_message.content 
      : JSON.stringify(last_message.content);

    return {
      response,
      token_usage: final_state.token_usage,
      model_costs: final_state.model_costs,
      execution_history: final_state.execution_history
    };
  }

  // Node execution methods
  private async execute_image_generation_node(node: any, input: any): Promise<any> {
    // Implementation for image generation
    const model_costs = {
      "fal-ai/recraft-v3": 6,
      "fal-ai/flux-lora": 6,
      "fal-ai/flux/schnell": 4,
      "fal-ai/flux-realism": 6,
      "fal-ai/flux-pro": 12,
      "fal-ai/flux/dev": 10,
      "fal-ai/stable-diffusion-v3-medium": 3,
      "fal-ai/aura-flow": 3,
      "fal-ai/kolors": 3,
      "fal-ai/stable-cascade": 5,
    };

    const model = node.data.model || "fal-ai/flux/schnell";
    const cost = model_costs[model] || 4;

    // Placeholder for actual image generation
    return {
      image_url: "placeholder_generated_image_url",
      prompt: input.prompt,
      model: model,
      model_costs: cost,
      status: "success"
    };
  }

  private async execute_text_analysis_node(node: any, input: any): Promise<any> {
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

    const response = await this.model.invoke(messages);
    
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

  private async execute_llm_node(node: any, input: any): Promise<any> {
    const prompt = node.data.prompt || input.instructions || input.input_text;
    const system_prompt = node.data.system_prompt || "You are a helpful assistant.";

    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(prompt)
    ];

    const response = await this.model.invoke(messages);

    return {
      response: response.content,
      prompt: prompt,
      token_usage: {
        input: response.usage_metadata?.input_tokens || 0,
        output: response.usage_metadata?.output_tokens || 0
      },
      status: "success"
    };
  }
}

/**
 * Legacy functions for backward compatibility
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
  const model = new ChatXAI({
    apiKey: process.env.XAI_API_KEY,
    model: "grok-3-mini-latest",
    ...model_options,
  });
  
  const _messages = [system_message, ...(messages || []), prompt];
  
  let response;
  if (tools && Array.isArray(tools) && tools.length > 0) {
    const runnable = model.bindTools(tools as any[]);
    response = await runnable.invoke(_messages);
  } else {
    response = await model.invoke(_messages);
  }

  if (typeof response.content === "string") {
    return response.content;
  } else if (Array.isArray(response.content)) {
    return response.content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "text" in item)
          return String(item.text);
        return "";
      })
      .join("");
  }
  return "";
}

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
