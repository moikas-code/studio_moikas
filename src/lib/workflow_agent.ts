import { ChatXAI } from "@langchain/xai";
import { HumanMessage, SystemMessage, BaseMessage, AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { DynamicTool, Tool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { createClient } from "@supabase/supabase-js";

// Types for workflow nodes and execution
interface WorkflowNode {
  id: string;
  node_id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
  connections: Record<string, unknown>[];
}

// Define state schema using Annotation
const agent_state_schema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
    default: () => []
  }),
  current_node: Annotation<string>(),
  workflow_data: Annotation<Record<string, unknown>>(),
  execution_context: Annotation<Record<string, unknown>>(),
  next_action: Annotation<string>()
});

type AgentState = typeof agent_state_schema.State;

/**
 * Workflow Agent that can execute workflow nodes as tools and coordinate with other agents
 */
export class WorkflowAgent {
  private model: ChatXAI;
  private supabase: ReturnType<typeof createClient>;
  private tools: Tool[] = [];
  private workflow_graph?: StateGraph<AgentState>;

  constructor() {
    this.model = new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: "grok-3-mini-latest",
      temperature: 0.1,
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initialize_base_tools();
  }

  /**
   * Initialize base tools for workflow execution
   */
  private initialize_base_tools() {
    // Text Processing Tool
    const text_processor_tool = new DynamicTool({
      name: "text_processor",
      description: "Process and analyze text content using AI",
      func: async (input: string) => {
        const parsed_input = JSON.parse(input);
        const { text, operation } = parsed_input;

        const prompt = ChatPromptTemplate.fromMessages([
          ["system", `You are a text processing assistant. Perform the following operation: ${operation}`],
          ["human", "{text}"]
        ]);

        const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
        const result = await chain.invoke({ text });
        
        return JSON.stringify({ result, operation });
      }
    });

    // Image Generation Tool
    const image_generator_tool = new DynamicTool({
      name: "image_generator",
      description: "Generate images based on prompts using AI",
      func: async (input: string) => {
        const parsed_input = JSON.parse(input);
        const { prompt, style, size } = parsed_input;

        // Call your existing image generation API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, style, size })
        });

        const result = await response.json();
        return JSON.stringify(result);
      }
    });

    // Video Effects Tool
    const video_effects_tool = new DynamicTool({
      name: "video_effects",
      description: "Apply effects to videos or generate video content",
      func: async (input: string) => {
        const parsed_input = JSON.parse(input);
        const { video_url, effects, duration } = parsed_input;

        // Call your existing video effects API
        const response = await fetch('/api/video-effects/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url, effects, duration })
        });

        const result = await response.json();
        return JSON.stringify(result);
      }
    });

    // Workflow Execution Tool
    const workflow_executor_tool = new DynamicTool({
      name: "workflow_executor",
      description: "Execute a specific workflow with given inputs",
      func: async (input: string) => {
        const parsed_input = JSON.parse(input);
        const { workflow_id, session_id, input_data } = parsed_input;

        const execution_result = await this.execute_workflow_node(
          workflow_id,
          session_id,
          input_data
        );

        return JSON.stringify(execution_result);
      }
    });

    // Database Query Tool
    const database_query_tool = new DynamicTool({
      name: "database_query",
      description: "Query the database for workflow data, sessions, or messages",
      func: async (input: string) => {
        const parsed_input = JSON.parse(input);
        const { table, query_params, operation } = parsed_input;

        try {
          let result;
          switch (operation) {
            case 'select':
              result = await this.supabase
                .from(table)
                .select(query_params.select || '*')
                .match(query_params.match || {});
              break;
            case 'insert':
              result = await this.supabase
                .from(table)
                .insert(query_params.data);
              break;
            case 'update':
              result = await this.supabase
                .from(table)
                .update(query_params.data)
                .match(query_params.match);
              break;
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }

          return JSON.stringify(result);
        } catch (error) {
          return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    });

    this.tools = [
      text_processor_tool,
      image_generator_tool,
      video_effects_tool,
      workflow_executor_tool,
      database_query_tool
    ];
  }

  /**
   * Load workflow nodes as tools
   */
  async load_workflow_as_tools(workflow_id: string): Promise<void> {
    const { data: nodes, error } = await this.supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', workflow_id);

    if (error || !nodes) {
      throw new Error(`Failed to load workflow nodes: ${error?.message}`);
    }

    // Convert each node to a tool
    const workflow_tools = (nodes as unknown as WorkflowNode[]).map((node) => {
      return new DynamicTool({
        name: `workflow_node_${node.node_id}`,
        description: `Execute workflow node: ${node.type} - ${(node.data.description as string) || 'No description'}`,
        func: async (input: string) => {
          const parsed_input = JSON.parse(input);
          return await this.execute_workflow_node(workflow_id, parsed_input.session_id, {
            node_id: node.node_id,
            input_data: parsed_input
          });
        }
      });
    });

    // Add workflow-specific tools to the base tools
    this.tools = [...this.tools, ...workflow_tools];
  }

  /**
   * Execute a specific workflow node
   */
  private async execute_workflow_node(
    workflow_id: string,
    session_id: string,
    input_data: Record<string, unknown>
  ): Promise<string> {
    try {
      // Create execution record
      const { data: execution, error: exec_error } = await this.supabase
        .from('workflow_executions')
        .insert({
          session_id,
          workflow_id,
          status: 'running',
          input_data,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (exec_error || !execution) {
        throw new Error(`Failed to create execution: ${exec_error?.message || 'No execution created'}`);
      }

      // Get the node details
      const { data: node, error: node_error } = await this.supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflow_id)
        .eq('node_id', input_data.node_id as string)
        .single();

      if (node_error || !node) {
        throw new Error(`Node not found: ${node_error?.message}`);
      }

      // Execute based on node type
      let output_data: Record<string, unknown> = {};
      const workflow_node = node as unknown as WorkflowNode;
      
      switch (workflow_node.type) {
        case 'llm':
          output_data = await this.execute_llm_node(workflow_node, input_data);
          break;
        case 'image_generator':
          output_data = await this.execute_image_node(workflow_node, input_data);
          break;
        case 'text_analyzer':
          output_data = await this.execute_text_analyzer_node(workflow_node, input_data);
          break;
        case 'video_generator':
          output_data = await this.execute_video_node(workflow_node, input_data);
          break;
        default:
          throw new Error(`Unsupported node type: ${workflow_node.type}`);
      }

      // Update execution with results
      await this.supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          output_data,
          completed_at: new Date().toISOString()
        })
        .eq('id', (execution as { id: string }).id);

      return JSON.stringify({
        success: true,
        node_id: workflow_node.node_id,
        output_data,
        execution_id: (execution as { id: string }).id
      });

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute LLM node
   */
  private async execute_llm_node(node: WorkflowNode, input_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { prompt, system_message, temperature = 0.7 } = node.data;
    
    const messages = [
      new SystemMessage((system_message as string) || "You are a helpful assistant."),
      new HumanMessage((prompt as string).replace(/\{(\w+)\}/g, (match: string, key: string) => input_data[key] as string || match))
    ];

    const model = new ChatXAI({
      apiKey: process.env.XAI_API_KEY,
      model: "grok-3-mini-latest",
      temperature: temperature as number
    });

    const response = await model.invoke(messages);
    
    return {
      response: typeof response.content === 'string' ? response.content : response.content.toString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tokens_used: (response as any).usage?.total_tokens || 0
    };
  }

  /**
   * Execute image generation node
   */
  private async execute_image_node(node: WorkflowNode, input_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { prompt_template, style, size } = node.data;
    const final_prompt = (prompt_template as string).replace(/\{(\w+)\}/g, (match: string, key: string) => input_data[key] as string || match);

    // Call your image generation API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: final_prompt, 
        style: (style as string) || 'realistic',
        size: (size as string) || '1024x1024'
      })
    });

    const result = await response.json();
    return result;
  }

  /**
   * Execute text analyzer node
   */
  private async execute_text_analyzer_node(node: WorkflowNode, input_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { analysis_type, text_input } = node.data;
    const text = input_data[text_input as string] || input_data.text;

    // Call your text analyzer API
    const response = await fetch('/api/text-analyzer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text,
        analysis_type: (analysis_type as string) || 'sentiment'
      })
    });

    const result = await response.json();
    return result;
  }

  /**
   * Execute video generation node
   */
  private async execute_video_node(node: WorkflowNode, input_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { video_prompt, effects, duration } = node.data;
    const final_prompt = (video_prompt as string).replace(/\{(\w+)\}/g, (match: string, key: string) => input_data[key] as string || match);

    // Call your video effects API
    const response = await fetch('/api/video-effects/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: final_prompt,
        effects: (effects as string[]) || [],
        duration: (duration as number) || 5
      })
    });

    const result = await response.json();
    return result;
  }

  /**
   * Create a LangGraph workflow for multi-agent coordination
   */
  create_langgraph_workflow(): StateGraph<AgentState> {
    const workflow = new StateGraph(agent_state_schema);

    // Planning Agent Node
    workflow.addNode("planner", async (state: AgentState) => {
      const planning_prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a workflow planning agent. Analyze the user's request and create an execution plan.
        Available tools: ${this.tools.map(t => t.name).join(', ')}
        
        Your job is to:
        1. Understand the user's goal
        2. Break it down into steps
        3. Determine which tools/nodes to use
        4. Set the execution order
        
        Return a JSON plan with steps and tools to use.`],
        ["human", "{input}"]
      ]);

      const chain = planning_prompt.pipe(this.model).pipe(new StringOutputParser());
      const last_message = state.messages[state.messages.length - 1];
      const plan = await chain.invoke({ input: last_message.content });

      return {
        ...state,
        messages: [...state.messages, new AIMessage(`Plan created: ${plan}`)],
        workflow_data: { ...state.workflow_data, plan },
        next_action: "executor"
      };
    });

    // Execution Agent Node
    workflow.addNode("executor", async (state: AgentState) => {
      const execution_prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a workflow execution agent. Execute the plan step by step using available tools.
        
        Plan: {plan}
        
        Execute each step and coordinate with other agents as needed.`],
        ["human", "Execute the next step in the plan."]
      ]);

      // Create agent executor with tools
      const agent = await createToolCallingAgent({
        llm: this.model,
        tools: this.tools,
        prompt: execution_prompt
      });

      const executor = new AgentExecutor({
        agent,
        tools: this.tools,
        verbose: true
      });

      const result = await executor.invoke({
        input: "Execute the next step",
        plan: state.workflow_data?.plan || ""
      });

      return {
        ...state,
        messages: [...state.messages, new AIMessage(result.output)],
        execution_context: { ...state.execution_context, last_result: result.output },
        next_action: "coordinator"
      };
    });

    // Coordination Agent Node
    workflow.addNode("coordinator", async (state: AgentState) => {
      const coordination_prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a workflow coordination agent. Determine if the workflow is complete or needs more steps.
        
        Execution context: {context}
        Plan: {plan}
        
        Decide if we should:
        - Continue to executor for next step
        - End the workflow
        - Go back to planner for replanning`],
        ["human", "What should be the next action?"]
      ]);

      const chain = coordination_prompt.pipe(this.model).pipe(new StringOutputParser());
      const decision = await chain.invoke({
        context: JSON.stringify(state.execution_context),
        plan: state.workflow_data?.plan || ""
      });

      let next_action = END;
      if (decision.toLowerCase().includes("continue") || decision.toLowerCase().includes("executor")) {
        next_action = "executor";
      } else if (decision.toLowerCase().includes("replan") || decision.toLowerCase().includes("planner")) {
        next_action = "planner";
      }

      return {
        ...state,
        messages: [...state.messages, new AIMessage(`Coordination decision: ${decision}`)],
        next_action
      };
    });

    // Define edges
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workflow.addEdge(START, "planner" as any);
    workflow.addConditionalEdges(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "planner" as any,
      (state: AgentState) => state.next_action || "executor",
      {
        executor: "executor",
        coordinator: "coordinator"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );
    workflow.addConditionalEdges(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "executor" as any,
      (state: AgentState) => state.next_action || "coordinator",
      {
        coordinator: "coordinator",
        planner: "planner"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );
    workflow.addConditionalEdges(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "coordinator" as any,
      (state: AgentState) => state.next_action || END,
      {
        executor: "executor",
        planner: "planner",
        [END]: END
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    );

    this.workflow_graph = workflow;
    return workflow;
  }

  /**
   * Execute a chat request using the workflow agent system
   */
  async execute_chat_request(
    session_id: string,
    workflow_id: string | null,
    user_message: string,
    chat_history: BaseMessage[] = []
  ): Promise<{
    response: string;
    execution_data?: Record<string, unknown>;
    tokens_used?: number;
  }> {
    try {
      // Load workflow tools if workflow is selected
      if (workflow_id) {
        await this.load_workflow_as_tools(workflow_id);
      }

      // Create or get the workflow graph
      const workflow = this.workflow_graph || this.create_langgraph_workflow();
      const compiled_workflow = workflow.compile();

      // Execute the workflow
      const initial_state: AgentState = {
        messages: [...chat_history, new HumanMessage(user_message)],
        current_node: "",
        workflow_data: { workflow_id, session_id },
        execution_context: {},
        next_action: ""
      };

      const result = await compiled_workflow.invoke(initial_state);

      // Extract the final response
      const final_message = result.messages[result.messages.length - 1];
      const response = typeof final_message.content === 'string' 
        ? final_message.content 
        : final_message.content.toString();

      // Save the conversation to database
      await this.save_conversation_to_database(session_id, user_message, response);

      return {
        response,
        execution_data: result.execution_context,
        tokens_used: this.calculate_tokens_used(result.messages)
      };

    } catch (error) {
      console.error('Workflow agent execution error:', error);
      const error_message = error instanceof Error ? error.message : 'Unknown error';
      return {
        response: `Sorry, I encountered an error while processing your request: ${error_message}`,
        execution_data: { error: error_message }
      };
    }
  }

  /**
   * Save conversation to database
   */
  private async save_conversation_to_database(
    session_id: string,
    user_message: string,
    agent_response: string
  ): Promise<void> {
    try {
      // Save user message
      await this.supabase
        .from('workflow_messages')
        .insert({
          session_id,
          role: 'user',
          content: user_message,
          created_at: new Date().toISOString()
        });

      // Save agent response
      await this.supabase
        .from('workflow_messages')
        .insert({
          session_id,
          role: 'assistant',
          content: agent_response,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  /**
   * Calculate tokens used (approximate)
   */
  private calculate_tokens_used(messages: BaseMessage[]): number {
    return messages.reduce((total, message) => {
      const content = typeof message.content === 'string' ? message.content : message.content.toString();
      return total + Math.ceil(content.length / 4); // Rough approximation
    }, 0);
  }

  /**
   * Get available tools
   */
  get_available_tools(): string[] {
    return this.tools.map(tool => tool.name);
  }

  /**
   * Add custom tool
   */
  add_custom_tool(tool: Tool): void {
    this.tools.push(tool);
  }
}

/**
 * Factory function to create a workflow agent instance
 */
export function create_workflow_agent(): WorkflowAgent {
  return new WorkflowAgent();
}

/**
 * Singleton instance for global use
 */
let workflow_agent_instance: WorkflowAgent | null = null;

export function get_workflow_agent(): WorkflowAgent {
  if (!workflow_agent_instance) {
    workflow_agent_instance = new WorkflowAgent();
  }
  return workflow_agent_instance;
}