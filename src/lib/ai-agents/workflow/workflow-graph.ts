import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { planner_agent } from "../agents/planner-agent";
import { executor_agent } from "../agents/executor-agent";
import { coordinator_agent } from "../agents/coordinator-agent";
import { summarizer_agent } from "../agents/summarizer-agent";

// Define state schema using Annotation
const state_schema = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
    default: () => []
  }),
  session_id: Annotation<string>({
    default: () => ""
  }),
  user_id: Annotation<string>({
    default: () => ""
  }),
  workflow_id: Annotation<string | undefined>({
    default: () => undefined
  }),
  variables: Annotation<Record<string, unknown>>({
    default: () => ({})
  }),
  current_step: Annotation<string>({
    default: () => "start"
  }),
  execution_history: Annotation<Record<string, unknown>[]>({
    reducer: (x: Record<string, unknown>[], y: Record<string, unknown>[]) => [...x, ...y],
    default: () => []
  }),
  available_tools: Annotation<Record<string, unknown>[]>({
    default: () => []
  }),
  token_usage: Annotation<{ input: number; output: number }>({
    default: () => ({ input: 0, output: 0 })
  }),
  model_costs: Annotation<number>({
    default: () => 0
  })
});

/**
 * Manages the workflow graph for multi-agent execution
 */
export class workflow_graph_manager {
  private workflow_graph: StateGraph<typeof state_schema.State>;
  private planner: planner_agent;
  private executor: executor_agent;
  private coordinator: coordinator_agent;
  private summarizer: summarizer_agent;

  constructor(
    model: Record<string, unknown>,
    tools_registry: Map<string, Record<string, unknown>>
  ) {
    // Initialize agents
    this.planner = new planner_agent(model);
    this.executor = new executor_agent(tools_registry);
    this.coordinator = new coordinator_agent(model);
    this.summarizer = new summarizer_agent(model);

    // Initialize workflow graph
    this.workflow_graph = new StateGraph(state_schema);

    this.setup_graph();
  }

  /**
   * Sets up the workflow graph with nodes and edges
   */
  private setup_graph(): void {
    // Add nodes
    this.workflow_graph.addNode("planner", this.planner.plan.bind(this.planner));
    this.workflow_graph.addNode("executor", this.executor.execute.bind(this.executor));
    this.workflow_graph.addNode("coordinator", this.coordinator.coordinate.bind(this.coordinator));
    this.workflow_graph.addNode("summarizer", this.summarizer.summarize.bind(this.summarizer));

    // Add edges
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
   * Decision function for conditional edges
   * @param state - Current agent state
   * @returns Next step to execute
   */
  private should_continue(state: typeof state_schema.State): string {
    return state.current_step === "continue" ? "continue" : "finish";
  }

  /**
   * Compiles and returns the workflow graph
   * @returns Compiled workflow graph
   */
  compile() {
    return this.workflow_graph.compile();
  }
}