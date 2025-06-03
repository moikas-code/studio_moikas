# AI Agents Architecture

This directory contains a modular multi-agent workflow system powered by xAI and LangGraph. The architecture is designed for maintainability, reusability, and extensibility.

## Directory Structure

```
ai-agents/
├── types.ts              # All TypeScript type definitions
├── index.ts              # Main entry point and exports
├── workflow-xai-agent.ts # Backward compatibility wrapper
├── agents/               # Individual agent implementations
│   ├── planner-agent.ts    # Plans execution strategy
│   ├── executor-agent.ts   # Executes tools
│   ├── coordinator-agent.ts # Coordinates workflow
│   └── summarizer-agent.ts # Summarizes results
├── tools/                # Tool-related functionality
│   ├── tool-factory.ts     # Creates tools from nodes
│   ├── image-generation-tool.ts
│   ├── text-analysis-tool.ts
│   └── llm-tool.ts
├── workflow/             # Workflow management
│   ├── workflow-graph.ts   # LangGraph workflow setup
│   └── workflow-executor.ts # Main workflow executor
├── utils/                # Utility functions
│   ├── model-factory.ts    # Creates model instances
│   └── message-utils.ts    # Message handling utilities
└── legacy/               # Legacy compatibility
    └── xai-legacy.ts       # Legacy function support
```

## Core Components

### 1. Workflow Executor
The main entry point for executing multi-agent workflows. It orchestrates the entire process:
- Registers workflow nodes as tools
- Manages the execution state
- Returns structured results with token usage and costs

### 2. Agent System
Four specialized agents work together:
- **Planner Agent**: Analyzes requests and creates execution plans
- **Executor Agent**: Executes tools based on the plan
- **Coordinator Agent**: Decides if retry/recovery is needed
- **Summarizer Agent**: Creates final user-facing responses

### 3. Tool System
Dynamic tool creation from workflow nodes:
- **Image Generation Tool**: Handles image creation requests
- **Text Analysis Tool**: Performs text analysis operations
- **LLM Tool**: General language model processing

### 4. Workflow Graph
Uses LangGraph to define the agent execution flow:
```
START → Planner → Executor → Coordinator → Summarizer → END
                    ↑            ↓
                    └────────────┘ (retry loop)
```

## Usage Examples

### Basic Workflow Execution
```typescript
import { workflow_executor } from '@/lib/ai-agents';
import { HumanMessage } from '@langchain/core/messages';

const executor = new workflow_executor();
const result = await executor.execute(
  [new HumanMessage("Generate an image of a cat")],
  "workflow-123",
  "session-456",
  "user-789",
  workflowNodes
);

console.log(result.response);
console.log(`Tokens used: ${result.token_usage.input + result.token_usage.output}`);
```

### Using Legacy Functions
```typescript
import { invoke_xai_agent_with_tools } from '@/lib/ai-agents';

const response = await invoke_xai_agent_with_tools({
  prompt: new HumanMessage("What is the weather?"),
  tools: [weatherTool]
});
```

### Creating Custom Tools
```typescript
import { workflow_node_tool } from '@/lib/ai-agents/types';
import { z } from 'zod';

const custom_tool: workflow_node_tool = {
  id: "custom-1",
  type: "custom",
  name: "custom_tool",
  description: "Does something custom",
  parameters: z.object({
    input: z.string()
  }),
  execute: async (input) => {
    // Tool implementation
    return { result: "success" };
  }
};
```

## Key Features

1. **Modular Design**: Each component has a single responsibility
2. **Type Safety**: Comprehensive TypeScript types throughout
3. **Token Tracking**: Automatic token usage and cost calculation
4. **Error Recovery**: Coordinator agent handles failures gracefully
5. **Extensibility**: Easy to add new tools and agents
6. **Backward Compatibility**: Legacy functions still work

## Adding New Components

### Adding a New Tool
1. Create a new file in `tools/` directory
2. Implement the tool class with `create()` and `execute()` methods
3. Add the tool type to `workflow_node_type` in `types.ts`
4. Update `tool-factory.ts` to handle the new tool type
5. Export from `index.ts`

### Adding a New Agent
1. Create a new file in `agents/` directory
2. Implement the agent class with its specific logic
3. Add the agent to the workflow graph if needed
4. Export from `index.ts`

## Testing

Test files should be created for critical components:
- Agent logic tests
- Tool execution tests
- Workflow integration tests
- Utility function tests

## Environment Variables

Required environment variables:
- `XAI_API_KEY`: API key for xAI services

## Best Practices

1. Keep each module under 60 lines when possible
2. Use JSDoc comments for all public methods
3. Follow snake_case naming convention
4. Implement proper error handling
5. Track token usage for all LLM operations
6. Use dependency injection for better testability