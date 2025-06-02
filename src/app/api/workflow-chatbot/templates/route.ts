import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client to bypass RLS for now
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // Get public templates
    const { data: templates, error } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("is_public", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    // Group by category
    const grouped_templates = templates.reduce((acc: any, template: any) => {
      const category = template.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {});

    return NextResponse.json({ 
      templates,
      grouped_templates 
    });
  } catch (error) {
    console.error("Templates API error:", error);
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
    const { template_id, name } = body;

    if (!template_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // Use service role client to bypass RLS for now
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

    // Copy template using the database function
    const { data: new_workflow_id, error } = await supabase
      .rpc("copy_workflow_template", {
        p_template_id: template_id,
        p_user_id: user.id,
        p_new_name: name
      });

    if (error) {
      console.error("Error copying template:", error);
      return NextResponse.json({ error: "Failed to create workflow from template" }, { status: 500 });
    }

    // Get the new workflow details
    const { data: workflow } = await supabase
      .from("workflows")
      .select(`
        *,
        workflow_nodes (*)
      `)
      .eq("id", new_workflow_id)
      .single();

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error("Template copy API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}