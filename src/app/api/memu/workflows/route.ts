import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { Redis } from "@upstash/redis";
import { check_rate_limit, check_workflow_creation_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 10, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rate.remaining.toString(),
            "X-RateLimit-Reset": rate.reset.toString(),
          },
        }
      );
    }

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Get user
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's workflows with node count
    const { data: workflows } = await supabase
      .from("workflows")
      .select(`
        *,
        workflow_nodes (
          id,
          type,
          data
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Transform workflows to include node count and capabilities
    const enriched_workflows = workflows?.map(workflow => ({
      ...workflow,
      node_count: workflow.workflow_nodes?.length || 0,
      capabilities: extract_workflow_capabilities(workflow.workflow_nodes || []),
      last_modified: workflow.updated_at
    })) || [];

    return NextResponse.json({
      workflows: enriched_workflows
    });

  } catch (error) {
    console.error("GET workflows error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 10, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rate.remaining.toString(),
            "X-RateLimit-Reset": rate.reset.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { name, description, template_id, nodes = [] } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Get user
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check workflow creation limits
    try {
      const limit_check = await check_workflow_creation_limit({
        supabase,
        user_id: user.id,
      });

      if (!limit_check.allowed) {
        return NextResponse.json({
          error: `Workflow limit reached. ${limit_check.plan === "free" 
            ? `Free users can create ${limit_check.max_allowed} workflow. Upgrade to Standard for unlimited workflows.`
            : `You have reached your limit of ${limit_check.max_allowed} workflows.`
          }`,
          limit_info: {
            current_count: limit_check.current_count,
            max_allowed: limit_check.max_allowed,
            plan: limit_check.plan
          }
        }, { status: 403 });
      }
    } catch (limit_error) {
      console.error("Error checking workflow limits:", limit_error);
      return NextResponse.json(
        { error: "Failed to check workflow limits" },
        { status: 500 }
      );
    }

    // Create workflow
    const { data: workflow, error: workflow_error } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        template_id,
        name,
        description,
        graph_data: {},
        settings: {
          auto_execute: false,
          require_confirmation: true,
          max_execution_time: 300000 // 5 minutes
        },
        is_active: true
      })
      .select()
      .single();

    if (workflow_error) {
      console.error("Error creating workflow:", workflow_error);
      return NextResponse.json(
        { error: "Failed to create workflow" },
        { status: 500 }
      );
    }

    // Create workflow nodes if provided
    if (nodes.length > 0) {
      const workflow_nodes = nodes.map((node: any) => ({
        workflow_id: workflow.id,
        node_id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
        connections: node.connections || []
      }));

      const { error: nodes_error } = await supabase
        .from("workflow_nodes")
        .insert(workflow_nodes);

      if (nodes_error) {
        console.error("Error creating workflow nodes:", nodes_error);
        // Clean up the workflow if node creation fails
        await supabase
          .from("workflows")
          .delete()
          .eq("id", workflow.id);
        
        return NextResponse.json(
          { error: "Failed to create workflow nodes" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      workflow: {
        ...workflow,
        workflow_nodes: nodes
      }
    });

  } catch (error) {
    console.error("POST workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, nodes, settings } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update workflow
    const update_data: any = { updated_at: new Date().toISOString() };
    if (name) update_data.name = name;
    if (description !== undefined) update_data.description = description;
    if (settings) update_data.settings = settings;

    const { data: workflow, error: workflow_error } = await supabase
      .from("workflows")
      .update(update_data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (workflow_error) {
      console.error("Error updating workflow:", workflow_error);
      return NextResponse.json(
        { error: "Failed to update workflow" },
        { status: 500 }
      );
    }

    // Update nodes if provided
    if (nodes) {
      // Delete existing nodes
      await supabase
        .from("workflow_nodes")
        .delete()
        .eq("workflow_id", id);

      // Insert new nodes
      if (nodes.length > 0) {
        const workflow_nodes = nodes.map((node: any) => ({
          workflow_id: id,
          node_id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: node.data || {},
          connections: node.connections || []
        }));

        const { error: nodes_error } = await supabase
          .from("workflow_nodes")
          .insert(workflow_nodes);

        if (nodes_error) {
          console.error("Error updating workflow nodes:", nodes_error);
          return NextResponse.json(
            { error: "Failed to update workflow nodes" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      workflow: {
        ...workflow,
        workflow_nodes: nodes || []
      }
    });

  } catch (error) {
    console.error("PUT workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const workflow_id = url.searchParams.get("id");

    if (!workflow_id) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete workflow (cascade will handle nodes and related data)
    const { error: delete_error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflow_id)
      .eq("user_id", user.id);

    if (delete_error) {
      console.error("Error deleting workflow:", delete_error);
      return NextResponse.json(
        { error: "Failed to delete workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workflow deleted successfully"
    });

  } catch (error) {
    console.error("DELETE workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to extract workflow capabilities
function extract_workflow_capabilities(nodes: any[]): string[] {
  const capabilities = new Set<string>();

  for (const node of nodes) {
    switch (node.type) {
      case "image_generator":
        capabilities.add("Image Generation");
        break;
      case "text_analyzer":
        capabilities.add("Text Analysis");
        break;
      case "llm":
        capabilities.add("Language Processing");
        break;
      case "conditional":
        capabilities.add("Logic Branching");
        break;
      case "loop":
        capabilities.add("Iteration");
        break;
      default:
        capabilities.add(node.type);
    }
  }

  return Array.from(capabilities);
} 