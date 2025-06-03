import { describe, it, expect, mock } from "bun:test";
import { conversational_agent } from "../../agents/conversational-agent";
import { agent_state } from "../../types";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

describe("conversational-agent", () => {
  const mock_model = {
    invoke: mock(() => Promise.resolve({
      content: "That's great to hear! I'm doing well too. What brings you here today?",
      usage_metadata: {
        input_tokens: 20,
        output_tokens: 30
      }
    }))
  };

  const create_initial_state = (): agent_state => ({
    messages: [new HumanMessage("Hi there! How are you doing?")],
    session_id: "test-session",
    user_id: "test-user",
    variables: {},
    current_step: "start",
    execution_history: [],
    available_tools: [],
    token_usage: { input: 0, output: 0 },
    model_costs: 0
  });

  describe("converse", () => {
    it("should handle basic conversation", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.variables.personality = "friendly";

      const result = await agent.converse(state);

      expect(result.current_step).toBe("responded");
      expect(result.variables?.last_response).toBe("That's great to hear! I'm doing well too. What brings you here today?");
      expect(result.variables?.conversation_turn).toBe(1);
      expect(result.messages?.length).toBe(2); // Original + response
    });

    it("should use default personality when none provided", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();

      await agent.converse(state);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("friendly and helpful")
        }),
        expect.any(Object)
      ]);
    });

    it("should include conversation history", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      
      // Add previous conversation
      state.messages = [
        new HumanMessage("Hello"),
        new AIMessage("Hi there!"),
        new HumanMessage("How are you?")
      ];

      await agent.converse(state);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("User: Hello\nAssistant: Hi there!")
        }),
        expect.any(Object)
      ]);
    });

    it("should include context when provided", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.variables.context = "User needs help with cooking";

      await agent.converse(state);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("User needs help with cooking")
        }),
        expect.any(Object)
      ]);
    });

    it("should update token usage and costs", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.token_usage = { input: 10, output: 15 };
      state.model_costs = 0.001;

      const result = await agent.converse(state);

      expect(result.token_usage?.input).toBe(30); // 10 + 20
      expect(result.token_usage?.output).toBe(45); // 15 + 30
      expect(result.model_costs).toBeGreaterThan(0.001);
    });

    it("should handle missing usage metadata", async () => {
      const no_usage_model = {
        invoke: mock(() => Promise.resolve({
          content: "Response without usage metadata"
        }))
      };

      const agent = new conversational_agent(no_usage_model);
      const state = create_initial_state();

      const result = await agent.converse(state);

      expect(result.variables?.last_response).toBe("Response without usage metadata");
      expect(result.token_usage?.input).toBe(0);
      expect(result.token_usage?.output).toBe(0);
    });
  });

  describe("should_continue_conversation", () => {
    it("should allow conversation to continue under limit", () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.variables.max_conversation_turns = 10;
      state.variables.conversation_turn = 5;

      const should_continue = agent.should_continue_conversation(state);

      expect(should_continue).toBe(true);
    });

    it("should stop conversation at limit", () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.variables.max_conversation_turns = 10;
      state.variables.conversation_turn = 10;

      const should_continue = agent.should_continue_conversation(state);

      expect(should_continue).toBe(false);
    });

    it("should use default limit when none provided", () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      state.variables.conversation_turn = 25;

      const should_continue = agent.should_continue_conversation(state);

      expect(should_continue).toBe(true); // Default is 50
    });

    it("should handle missing conversation turn", () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();

      const should_continue = agent.should_continue_conversation(state);

      expect(should_continue).toBe(true); // 0 < 50
    });
  });

  describe("extract_conversation_history", () => {
    it("should format conversation history correctly", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      
      state.messages = [
        new HumanMessage("Hello"),
        new AIMessage("Hi there!"),
        new HumanMessage("How are you?"),
        new AIMessage("I'm doing great!"),
        new HumanMessage("What can you help me with?")
      ];

      await agent.converse(state);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.stringContaining("User: Hello\nAssistant: Hi there!\nUser: How are you?\nAssistant: I'm doing great!")
        }),
        expect.objectContaining({
          content: "What can you help me with?"
        })
      ]);
    });

    it("should handle single message conversations", async () => {
      const agent = new conversational_agent(mock_model);
      const state = create_initial_state();
      // Only has the initial message

      await agent.converse(state);

      expect(mock_model.invoke).toHaveBeenCalledWith([
        expect.objectContaining({
          content: expect.not.stringContaining("Conversation History:")
        }),
        expect.any(Object)
      ]);
    });
  });
}); 