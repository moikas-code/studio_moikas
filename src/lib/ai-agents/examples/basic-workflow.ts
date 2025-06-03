/**
 * Basic example of using the AI agents workflow system
 */

import { workflow_executor } from "../workflow/workflow-executor";
import { HumanMessage } from "@langchain/core/messages";
import { workflow_node } from "../types";

async function run_basic_workflow() {
  // Create workflow executor
  const executor = new workflow_executor();

  // Define some workflow nodes
  const workflow_nodes: workflow_node[] = [
    {
      id: "img-gen-1",
      type: "image_generator",
      data: {
        model: "fal-ai/flux/schnell",
        description: "Generate images based on prompts"
      }
    },
    {
      id: "text-analyze-1",
      type: "text_analyzer",
      data: {
        description: "Analyze text for sentiment and themes"
      }
    }
  ];

  // Execute workflow
  try {
    const result = await executor.execute(
      [new HumanMessage("Generate an image of a sunset and analyze its description")],
      "workflow-123",
      "session-456",
      "user-789",
      workflow_nodes
    );

    console.log("Workflow completed!");
    console.log("Response:", result.response);
    console.log("Tokens used:", result.token_usage);
    console.log("Model costs:", result.model_costs);
    console.log("Execution history:", result.execution_history);
  } catch (error) {
    console.error("Workflow failed:", error);
  }
}

// Run if executed directly
if (require.main === module) {
  run_basic_workflow();
}