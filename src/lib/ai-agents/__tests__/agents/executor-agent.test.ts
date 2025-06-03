import { describe, it, expect, mock } from "bun:test";
import { executor_agent } from "../../agents/executor-agent";
import { agent_state, workflow_node_tool } from "../../types";
import { HumanMessage } from "@langchain/core/messages";

describe("executor-agent", () => {
  const create_mock_tool = (id: string): workflow_node_tool => ({
    id,
    type: "test",
    name: `test_tool_${id}`,
    description: "Test tool",
    parameters: {} as Record<string, unknown>,
    execute: mock(() => Promise.resolve({
      result: "success",
      token_usage: { input: 10, output: 20 },
      model_costs: 5
    }))
  });

  const create_initial_state = (): agent_state => ({
    messages: [new HumanMessage("Test")],
    session_id: "test-session",
    user_id: "test-user",
    variables: {},
    current_step: "execute",
    execution_history: [],
    available_tools: [],
    token_usage: { input: 0, output: 0 },
    model_costs: 0
  });

  describe("execute", () => {
    it("should handle empty execution plan", async () => {
      const tools_registry = new Map();
      const executor = new executor_agent(tools_registry);
      const state = create_initial_state();

      const result = await executor.execute(state);

      expect(result.current_step).toBe("executed");
      expect(result.variables?.execution_results).toEqual([]);
    });

    it("should execute steps successfully", async () => {
      const tool = create_mock_tool("1");
      const tools_registry = new Map([["1", tool]]);
      const executor = new executor_agent(tools_registry);
      
      const state = create_initial_state();
      state.variables.execution_plan = {
        steps: [{ tool_name: "test_tool_1", parameters: { test: true } }],
        reasoning: "Test plan"
      };

      const result = await executor.execute(state);

      expect(result.current_step).toBe("executed");
      expect(result.variables?.execution_results).toHaveLength(1);
      expect(result.variables?.execution_results[0].status).toBe("success");
      expect(tool.execute).toHaveBeenCalledWith({ test: true });
    });

    it("should handle tool not found", async () => {
      const tools_registry = new Map();
      const executor = new executor_agent(tools_registry);
      
      const state = create_initial_state();
      state.variables.execution_plan = {
        steps: [{ tool_name: "nonexistent_tool", parameters: {} }],
        reasoning: "Test plan"
      };

      const result = await executor.execute(state);

      expect(result.variables?.execution_results[0].status).toBe("failed");
      expect(result.variables?.execution_results[0].error).toBe("Tool not found");
    });

    it("should handle tool execution failure", async () => {
      const failing_tool: workflow_node_tool = {
        ...create_mock_tool("1"),
        execute: mock(() => Promise.reject(new Error("Tool failed")))
      };
      const tools_registry = new Map([["1", failing_tool]]);
      const executor = new executor_agent(tools_registry);
      
      const state = create_initial_state();
      state.variables.execution_plan = {
        steps: [{ tool_name: "test_tool_1", parameters: {} }],
        reasoning: "Test plan"
      };

      const result = await executor.execute(state);

      expect(result.variables?.execution_results[0].status).toBe("failed");
      expect(result.variables?.execution_results[0].error).toBe("Tool failed");
    });

    it("should update token usage and costs", async () => {
      const tool = create_mock_tool("1");
      const tools_registry = new Map([["1", tool]]);
      const executor = new executor_agent(tools_registry);
      
      const state = create_initial_state();
      state.variables.execution_plan = {
        steps: [{ tool_name: "test_tool_1", parameters: {} }],
        reasoning: "Test plan"
      };

      await executor.execute(state);

      // Token usage should be updated in the state object
      expect(state.token_usage.input).toBe(10);
      expect(state.token_usage.output).toBe(20);
      expect(state.model_costs).toBe(5);
    });
  });
});