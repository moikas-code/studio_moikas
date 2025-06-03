# Migration Guide: xai_agent.ts to ai-agents/

This document explains how to migrate from the old `xai_agent.ts` to the new modular structure.

## Import Changes

### Old imports:
```typescript
import { workflow_xai_agent, invoke_xai_agent_with_tools, build_xai_chain } from "@/lib/xai_agent";
```

### New imports:
```typescript
// For workflow usage
import { workflow_xai_agent, workflow_executor } from "@/lib/ai-agents";

// For legacy functions
import { invoke_xai_agent_with_tools, build_xai_chain } from "@/lib/ai-agents";

// For specific components
import { planner_agent, executor_agent } from "@/lib/ai-agents";
import type { workflow_node_tool, agent_state } from "@/lib/ai-agents";
```

## Usage Changes

### Using workflow_xai_agent (No changes needed)
The `workflow_xai_agent` class maintains the same API:

```typescript
const agent = new workflow_xai_agent();
const result = await agent.execute_workflow(messages, workflow_id, session_id, user_id, nodes);
```

### Using the new workflow_executor (Recommended)
For new code, use the more modular `workflow_executor`:

```typescript
import { workflow_executor } from "@/lib/ai-agents";

const executor = new workflow_executor();
const result = await executor.execute(messages, workflow_id, session_id, user_id, nodes);
```

## Benefits of the New Structure

1. **Better Organization**: Code is split into logical modules
2. **Easier Testing**: Each component can be tested independently
3. **Type Safety**: All types are centralized in `types.ts`
4. **Extensibility**: Easy to add new tools and agents
5. **Maintainability**: Each file has a single responsibility

## File Mapping

| Old Location | New Location |
|--------------|--------------|
| `xai_agent.ts` (workflow_xai_agent class) | `workflow-xai-agent.ts` |
| `xai_agent.ts` (types) | `types.ts` |
| `xai_agent.ts` (tool creation) | `tools/tool-factory.ts` |
| `xai_agent.ts` (agents) | `agents/*.ts` |
| `xai_agent.ts` (legacy functions) | `legacy/xai-legacy.ts` |

## Adding New Features

### Adding a New Tool
1. Create a new file in `tools/` (e.g., `tools/video-generation-tool.ts`)
2. Add the tool type to `types.ts`
3. Update `tool-factory.ts` to handle the new tool
4. Export from `index.ts`

### Adding a New Agent
1. Create a new file in `agents/` (e.g., `agents/validator-agent.ts`)
2. Add the agent to the workflow graph if needed
3. Export from `index.ts`

## Testing

Run tests with:
```bash
bun test src/lib/ai-agents/__tests__
```