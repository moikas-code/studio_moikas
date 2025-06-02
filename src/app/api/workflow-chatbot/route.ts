import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user's workflows
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: workflows, error } = await supabase
      .from("workflows")
      .select(`
        *,
        workflow_nodes (*)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching workflows:", error);
      return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
    }

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Workflow API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, template_id } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create workflow
    const { data: workflow, error } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        name,
        description,
        template_id,
        graph_data: {},
        settings: {}
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workflow:", error);
      return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }

    // If template_id provided, copy nodes from template
    if (template_id) {
      const { data: template_nodes } = await supabase
        .from("workflow_nodes")
        .select("*")
        .eq("workflow_id", template_id);

      if (template_nodes && template_nodes.length > 0) {
        const new_nodes = template_nodes.map(node => ({
          workflow_id: workflow.id,
          node_id: node.node_id,
          type: node.type,
          position: node.position,
          data: node.data,
          connections: node.connections
        }));

        const { error: template_nodes_error } = await supabase
          .from("workflow_nodes")
          .insert(new_nodes);

        if (template_nodes_error) {
          console.error("Error copying template nodes:", template_nodes_error);
        }
      }
    } else {
      // Create default nodes for new workflow
      const default_nodes = [
        {
          workflow_id: workflow.id,
          node_id: "input_1",
          type: "input",
          position: { x: 100, y: 100 },
          data: { label: "User Input" },
          connections: { target: ["llm_1"] }
        },
        {
          workflow_id: workflow.id,
          node_id: "llm_1",
          type: "llm",
          position: { x: 300, y: 100 },
          data: {
            label: "AI Assistant",
            prompt: "{{user_input}}",
            system_prompt: "You are a helpful assistant."
          },
          connections: { source: ["input_1"], target: ["output_1"] }
        },
        {
          workflow_id: workflow.id,
          node_id: "output_1",
          type: "output",
          position: { x: 500, y: 100 },
          data: { label: "Response" },
          connections: { source: ["llm_1"] }
        }
      ];

      const { error: nodes_error } = await supabase
        .from("workflow_nodes")
        .insert(default_nodes);

      if (nodes_error) {
        console.error("Error creating default nodes:", nodes_error);
        // Continue anyway - workflow is created, just without default nodes
      }
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Workflow API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, graph_data, settings } = body;

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
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
    const { data: workflow, error } = await supabase
      .from("workflows")
      .update({
        name,
        description,
        graph_data,
        settings,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workflow:", error);
      return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Workflow API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete workflow
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting workflow:", error);
      return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workflow API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}