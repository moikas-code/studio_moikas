import { create_clerk_supabase_client_ssr } from "./supabase_server";

export interface workflow_node {
  id: string;
  type: "input" | "output" | "llm" | "image_generator" | "text_analyzer" | "conditional" | "loop";
  data: Record<string, unknown>;
  position: { x: number; y: number };
  connections: {
    source?: string[];
    target?: string[];
  };
}

export interface workflow_execution_context {
  session_id: string;
  user_id: string;
  variables: Record<string, unknown>;
  history: Record<string, unknown>[];
  current_node?: string;
  token_usage?: { input: number; output: number };
  model_costs?: number;
}

export interface workflow_definition {
  id: string;
  name: string;
  nodes: workflow_node[];
  settings: Record<string, unknown>;
}

export class workflow_engine {
  private workflow: workflow_definition;
  private context: workflow_execution_context;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any = null;

  constructor(workflow: workflow_definition, context: workflow_execution_context) {
    this.workflow = workflow;
    this.context = context;
  }

  async initialize() {
    this.supabase = await create_clerk_supabase_client_ssr();
  }

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const start_node = this.find_start_node();
    if (!start_node) {
      throw new Error("No input node found in workflow");
    }

    const execution_id = await this.create_execution_record(input);
    
    // Initialize token tracking
    this.context.token_usage = { input: 0, output: 0 };
    this.context.model_costs = 0;
    
    try {
      const result = await this.execute_node(start_node, input, execution_id);
      await this.complete_execution(execution_id, result);
      
      // Include token usage in result
      return {
        ...result,
        token_usage: this.context.token_usage,
        model_costs: this.context.model_costs
      };
    } catch (error) {
      await this.fail_execution(execution_id, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private find_start_node(): workflow_node | undefined {
    return this.workflow.nodes.find(node => node.type === "input");
  }

  private async execute_node(node: workflow_node, input: Record<string, unknown>, execution_id: string): Promise<Record<string, unknown>> {
    await this.log_node_execution(execution_id, node.id, "started");

    let result: Record<string, unknown>;
    
    switch (node.type) {
      case "input":
        result = input;
        break;
      
      case "llm":
        result = await this.execute_llm_node(node, input);
        break;
      
      case "image_generator":
        result = await this.execute_image_node(node, input);
        break;
      
      case "text_analyzer":
        result = await this.execute_text_analyzer_node(node, input);
        break;
      
      case "conditional":
        result = await this.execute_conditional_node(node, input, execution_id);
        break;
      
      case "output":
        result = input;
        break;
      
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    await this.log_node_execution(execution_id, node.id, "completed", result);

    // Execute next nodes
    const next_nodes = this.get_next_nodes(node);
    for (const next_node of next_nodes) {
      result = await this.execute_node(next_node, result, execution_id);
    }

    return result;
  }

  private async execute_llm_node(node: workflow_node, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const prompt = this.interpolate_template((node.data.prompt as string) || "", input);
    const system_prompt = (node.data.system_prompt as string) || "You are a helpful assistant.";
    
    const { ChatXAI } = await import("@langchain/xai");
    const { HumanMessage, SystemMessage } = await import("@langchain/core/messages");
    
    const model = new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: (node.data.model as string) || "grok-3-mini-latest",
    });
    
    const messages = [
      new SystemMessage(system_prompt),
      new HumanMessage(prompt)
    ];
    
    const ai_response = await model.invoke(messages);
    
    // Extract response content
    let result = "";
    if (typeof ai_response.content === "string") {
      result = ai_response.content;
    } else if (Array.isArray(ai_response.content)) {
      result = ai_response.content
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && "text" in item)
            return String(item.text);
          return "";
        })
        .join("");
    }
    
    // Track token usage
    if (ai_response.usage_metadata && this.context.token_usage) {
      this.context.token_usage.input += ai_response.usage_metadata.input_tokens || 0;
      this.context.token_usage.output += ai_response.usage_metadata.output_tokens || 0;
    }
    
    return {
      ...input,
      [(node.data.output_key as string) || "llm_response"]: result
    };
  }

  private async execute_image_node(node: workflow_node, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const model = (node.data.model as string) || "fal-ai/flux/schnell";
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
    
    // Track model cost
    if (this.context.model_costs !== undefined) {
      this.context.model_costs += model_costs[model as keyof typeof model_costs] || 4;
    }
    
    // TODO: Implement actual image generation call
    return {
      ...input,
      [(node.data.output_key as string) || "generated_image"]: {
        url: "placeholder_image_url",
        prompt: node.data.prompt,
        model: model,
        cost: model_costs[model as keyof typeof model_costs] || 4
      }
    };
  }

  private async execute_text_analyzer_node(node: workflow_node, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    // This would call the text analyzer API
    return {
      ...input,
      [(node.data.output_key as string) || "analysis"]: {
        summary: "Text analysis placeholder"
      }
    };
  }

  private async execute_conditional_node(node: workflow_node, input: Record<string, unknown>, execution_id: string): Promise<Record<string, unknown>> {
    const condition = node.data.condition as string;
    const value = this.evaluate_condition(condition, input);
    
    const branch_id = value ? (node.data.true_branch as string) : (node.data.false_branch as string);
    const branch_node = this.workflow.nodes.find(n => n.id === branch_id);
    
    if (branch_node) {
      return await this.execute_node(branch_node, input, execution_id);
    }
    
    return input;
  }

  private get_next_nodes(node: workflow_node): workflow_node[] {
    const target_ids = node.connections.target || [];
    return this.workflow.nodes.filter(n => target_ids.includes(n.id));
  }

  private interpolate_template(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(data[key] || match);
    });
  }

  private evaluate_condition(condition: string, data: Record<string, unknown>): boolean {
    // Simple condition evaluator
    // In production, use a proper expression evaluator
    try {
      // Using a safer evaluation approach
      // In production, use a proper expression evaluator library
      const evaluator = (data: Record<string, unknown>) => {
        // Simple property-based check for now
        // This checks if the condition is a simple property reference
        if (condition in data) {
          return Boolean(data[condition]);
        }
        // For more complex conditions, you would use a proper expression parser
        return false;
      };
      return evaluator(data);
    } catch {
      return false;
    }
  }

  private async create_execution_record(input: Record<string, unknown>): Promise<string> {
    const { data, error } = await this.supabase
      .from("workflow_executions")
      .insert({
        session_id: this.context.session_id,
        workflow_id: this.workflow.id,
        status: "running",
        input_data: input,
        started_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  private async complete_execution(execution_id: string, output: Record<string, unknown>) {
    await this.supabase
      .from("workflow_executions")
      .update({
        status: "completed",
        output_data: output,
        completed_at: new Date().toISOString()
      })
      .eq("id", execution_id);
  }

  private async fail_execution(execution_id: string, error: Error) {
    await this.supabase
      .from("workflow_executions")
      .update({
        status: "failed",
        error: error.message || "Unknown error",
        completed_at: new Date().toISOString()
      })
      .eq("id", execution_id);
  }

  private async log_node_execution(execution_id: string, node_id: string, status: string, data?: Record<string, unknown>) {
    // Log node execution for debugging and visualization
    console.log(`Node ${node_id} ${status}`, data);
  }
}