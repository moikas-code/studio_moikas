# Chat Tool and Conversational Agent Implementation

This document describes the new chat capabilities added to the ai-agents library for handling basic conversational interactions in default templates.

## Overview

The implementation consists of two main components:
1. **Chat Tool** - A workflow tool for handling conversational interactions
2. **Conversational Agent** - A specialized agent for direct chat management

These components enable default templates to handle human-like conversations without requiring complex workflow setups.

## Components

### 1. Chat Tool (`src/lib/ai-agents/tools/chat-tool.ts`)

A workflow tool that provides natural conversational capabilities:

**Features:**
- Configurable personality styles
- Context-aware responses
- Token usage tracking
- Cost calculation
- Human-like conversation flow

**Usage:**
```typescript
import { chat_tool } from "@/lib/ai-agents";

const chat_node = {
  id: "chat-1",
  type: "chat",
  data: {
    personality: "friendly and helpful",
    context: "You are a helpful assistant"
  }
};

const tool = chat_tool.create(chat_node, model);
const result = await tool.execute({
  user_message: "Hello! How can you help me?",
  personality: "enthusiastic" // Optional override
});
```

### 2. Conversational Agent (`src/lib/ai-agents/agents/conversational-agent.ts`)

A specialized agent for direct conversation management:

**Features:**
- Multi-turn conversation support
- Conversation history tracking
- Context preservation across turns
- Automatic token and cost tracking
- Conversation limit management

**Usage:**
```typescript
import { conversational_agent, model_factory } from "@/lib/ai-agents";

const model = model_factory.create_xai_model();
const agent = new conversational_agent(model);

const state = {
  messages: [new HumanMessage("Hi there!")],
  session_id: "session-123",
  user_id: "user-456",
  variables: { personality: "friendly" },
  // ... other state properties
};

const result = await agent.converse(state);
```

## Configuration Options

### Chat Tool Configuration

```typescript
{
  id: "chat-node-id",
  type: "chat",
  data: {
    personality: "friendly and helpful",        // Personality style
    description: "Chat tool description",       // Tool description
    context: "Additional context for the AI"   // System context
  }
}
```

### Personality Styles

Predefined personality options:
- `"friendly and helpful"` (default)
- `"enthusiastic and encouraging"`
- `"patient and supportive"`
- `"professional and concise"`
- `"creative and inspiring"`
- `"technical and precise"`

### Context Examples

- General: `"You are a helpful assistant ready to chat about anything"`
- Support: `"You are providing customer support. Be empathetic and focus on problem-solving."`
- Education: `"You are helping someone learn. Break down complex topics and encourage questions."`
- Technical: `"You are helping with technical questions. Provide accurate information and practical solutions."`

## Default Template Usage

### Basic Implementation

```typescript
import { execute_default_chat } from "@/lib/ai-agents/examples/default-template";

const result = await execute_default_chat(
  "Hello! How are you today?",
  "session-123",
  "user-456"
);

console.log(result.response);
```

### Template Variations

```typescript
import { default_template_variations } from "@/lib/ai-agents/examples/default-template";

// Customer support template
const support_template = default_template_variations.support();

// Educational tutor template  
const tutor_template = default_template_variations.tutor();

// Creative assistant template
const creative_template = default_template_variations.creative();
```

## Integration with Workflow System

### Using with workflow_executor

```typescript
import { workflow_executor } from "@/lib/ai-agents";

const executor = new workflow_executor();
const chat_nodes = [{
  id: "default-chat",
  type: "chat",
  data: { personality: "helpful" }
}];

const result = await executor.execute(
  [new HumanMessage("Hi!")],
  "workflow-123",
  "session-456", 
  "user-789",
  chat_nodes
);
```

### Multi-turn Conversations

```typescript
const conversation_state = {
  messages: [],
  session_id: "chat-session",
  user_id: "user-123",
  variables: {
    personality: "friendly",
    max_conversation_turns: 10
  },
  // ... other state
};

// Continue conversation
for (const user_input of user_messages) {
  conversation_state.messages.push(new HumanMessage(user_input));
  const result = await agent.converse(conversation_state);
  
  // Update state with response
  conversation_state = { ...conversation_state, ...result };
  
  // Check if should continue
  if (!agent.should_continue_conversation(conversation_state)) {
    break;
  }
}
```

## Cost and Token Management

Both components automatically track:
- Input/output token usage
- Model costs (approximately $0.002/1K input tokens, $0.006/1K output tokens)
- Conversation turn counts

**Example response:**
```typescript
{
  response: "Hello! I'm doing great, thanks for asking!",
  token_usage: { input: 15, output: 25 },
  model_costs: 0.00018,
  status: "success"
}
```

## Testing

Comprehensive test coverage includes:
- Tool creation and execution
- Agent conversation handling
- Token usage tracking
- Error handling
- Multi-turn conversations
- Template variations

Run tests:
```bash
bun test src/lib/ai-agents/__tests__/tools/chat-tool.test.ts
bun test src/lib/ai-agents/__tests__/agents/conversational-agent.test.ts
```

## Best Practices

1. **Choose appropriate personality** for your use case
2. **Provide clear context** to guide the AI's responses
3. **Set conversation limits** to prevent runaway costs
4. **Monitor token usage** for cost management
5. **Use template variations** for common scenarios

## Examples

See `src/lib/ai-agents/examples/` for complete usage examples:
- `chat-example.ts` - Basic chat interactions
- `default-template.ts` - Default template implementations

## Type Definitions

All types are defined in `src/lib/ai-agents/types.ts`:
- `workflow_node_type` includes `"chat"`
- `agent_state` supports conversation variables
- `workflow_node` supports chat configuration

This implementation provides a solid foundation for conversational capabilities in default templates while maintaining the modular architecture of the ai-agents system. 