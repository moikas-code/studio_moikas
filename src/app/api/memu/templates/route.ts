import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Predefined workflow templates for different use cases
const WORKFLOW_TEMPLATES = {
  "content_creator": {
    id: "content_creator",
    name: "Content Creator Assistant",
    description: "Generate and refine content with image creation and text analysis",
    category: "Content Creation",
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 100, y: 100 },
        data: {
          label: "Content Topic Input",
          description: "Enter your content topic or idea"
        }
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 300, y: 100 },
        data: {
          label: "Content Generator",
          prompt: "Create engaging content about: {{input}}. Include main points, hooks, and call-to-action suggestions.",
          system_prompt: "You are a professional content creator and copywriter.",
          model: "grok-3-mini-latest",
          output_key: "content_draft"
        }
      },
      {
        id: "text_analyzer_1",
        type: "text_analyzer",
        position: { x: 500, y: 100 },
        data: {
          label: "Content Analyzer",
          description: "Analyze content quality, sentiment, and engagement potential",
          analysis_types: ["sentiment", "readability", "engagement"],
          output_key: "content_analysis"
        }
      },
      {
        id: "image_generator_1",
        type: "image_generator",
        position: { x: 300, y: 300 },
        data: {
          label: "Visual Creator",
          prompt: "Create a compelling visual for: {{input}}",
          model: "fal-ai/flux/schnell",
          style: "professional, engaging",
          output_key: "hero_image"
        }
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 700, y: 200 },
        data: {
          label: "Final Content Package",
          description: "Complete content with analysis and visuals"
        }
      }
    ],
    connections: [
      { source: "input_1", target: "llm_1" },
      { source: "llm_1", target: "text_analyzer_1" },
      { source: "input_1", target: "image_generator_1" },
      { source: "text_analyzer_1", target: "output_1" },
      { source: "image_generator_1", target: "output_1" }
    ]
  },
  
  "research_assistant": {
    id: "research_assistant",
    name: "Research & Analysis Assistant",
    description: "Comprehensive research and analysis workflow",
    category: "Research & Analysis",
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 100, y: 100 },
        data: {
          label: "Research Topic",
          description: "Enter your research question or topic"
        }
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 300, y: 100 },
        data: {
          label: "Research Planner",
          prompt: "Create a comprehensive research plan for: {{input}}. Include key questions, methodologies, and sources to investigate.",
          system_prompt: "You are a research methodology expert.",
          output_key: "research_plan"
        }
      },
      {
        id: "llm_2",
        type: "llm",
        position: { x: 500, y: 100 },
        data: {
          label: "Information Synthesizer",
          prompt: "Based on the research plan: {{research_plan}}, synthesize key findings and insights about {{input}}.",
          system_prompt: "You are an expert researcher and analyst.",
          output_key: "synthesis"
        }
      },
      {
        id: "text_analyzer_1",
        type: "text_analyzer",
        position: { x: 700, y: 100 },
        data: {
          label: "Content Quality Check",
          description: "Analyze research quality and completeness",
          output_key: "quality_analysis"
        }
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 900, y: 100 },
        data: {
          label: "Research Report",
          description: "Complete research findings with quality assessment"
        }
      }
    ],
    connections: [
      { source: "input_1", target: "llm_1" },
      { source: "llm_1", target: "llm_2" },
      { source: "llm_2", target: "text_analyzer_1" },
      { source: "text_analyzer_1", target: "output_1" }
    ]
  },
  
  "creative_brainstorm": {
    id: "creative_brainstorm",
    name: "Creative Brainstorming Hub",
    description: "Multi-perspective creative ideation and visual exploration",
    category: "Creative Development",
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {
          label: "Creative Brief",
          description: "Describe your creative challenge or project"
        }
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 300, y: 100 },
        data: {
          label: "Divergent Thinking",
          prompt: "Generate 10 wildly creative and diverse ideas for: {{input}}. Think outside the box and explore unconventional approaches.",
          system_prompt: "You are a creative director known for innovative, breakthrough ideas.",
          output_key: "wild_ideas"
        }
      },
      {
        id: "llm_2",
        type: "llm",
        position: { x: 300, y: 300 },
        data: {
          label: "Practical Solutions",
          prompt: "Create 5 practical, implementable solutions for: {{input}}. Focus on feasibility and effectiveness.",
          system_prompt: "You are a pragmatic problem solver and project manager.",
          output_key: "practical_ideas"
        }
      },
      {
        id: "llm_3",
        type: "llm",
        position: { x: 500, y: 200 },
        data: {
          label: "Idea Synthesizer",
          prompt: "Combine the best elements from wild ideas: {{wild_ideas}} and practical solutions: {{practical_ideas}} to create 3 innovative yet feasible concepts for {{input}}.",
          system_prompt: "You are a strategic creative consultant.",
          output_key: "synthesized_concepts"
        }
      },
      {
        id: "image_generator_1",
        type: "image_generator",
        position: { x: 700, y: 200 },
        data: {
          label: "Concept Visualizer",
          prompt: "Create a visual representation of the top concept: {{synthesized_concepts}}",
          model: "fal-ai/flux-realism",
          style: "creative, inspiring, professional",
          output_key: "concept_visual"
        }
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 900, y: 200 },
        data: {
          label: "Creative Package",
          description: "Complete creative exploration with concepts and visuals"
        }
      }
    ],
    connections: [
      { source: "input_1", target: "llm_1" },
      { source: "input_1", target: "llm_2" },
      { source: "llm_1", target: "llm_3" },
      { source: "llm_2", target: "llm_3" },
      { source: "llm_3", target: "image_generator_1" },
      { source: "image_generator_1", target: "output_1" }
    ]
  },
  
  "document_processor": {
    id: "document_processor",
    name: "Document Analysis & Summary",
    description: "Comprehensive document processing and analysis workflow",
    category: "Document Processing",
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {
          label: "Document Input",
          description: "Paste your document text or upload content"
        }
      },
      {
        id: "text_analyzer_1",
        type: "text_analyzer",
        position: { x: 300, y: 100 },
        data: {
          label: "Document Analyzer",
          description: "Analyze document structure, sentiment, and key metrics",
          analysis_types: ["structure", "sentiment", "keywords", "readability"],
          output_key: "document_analysis"
        }
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 300, y: 300 },
        data: {
          label: "Content Summarizer",
          prompt: "Create a comprehensive summary of this document: {{input}}. Include key points, main arguments, and conclusions.",
          system_prompt: "You are an expert document analyst and summarizer.",
          output_key: "summary"
        }
      },
      {
        id: "llm_2",
        type: "llm",
        position: { x: 500, y: 200 },
        data: {
          label: "Insight Extractor",
          prompt: "Based on the analysis {{document_analysis}} and summary {{summary}}, extract key insights, actionable items, and recommendations from: {{input}}",
          system_prompt: "You are a strategic analyst focused on actionable insights.",
          output_key: "insights"
        }
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 700, y: 200 },
        data: {
          label: "Document Report",
          description: "Complete document analysis with summary and insights"
        }
      }
    ],
    connections: [
      { source: "input_1", target: "text_analyzer_1" },
      { source: "input_1", target: "llm_1" },
      { source: "text_analyzer_1", target: "llm_2" },
      { source: "llm_1", target: "llm_2" },
      { source: "llm_2", target: "output_1" }
    ]
  },
  
  "social_media_manager": {
    id: "social_media_manager",
    name: "Social Media Content Manager",
    description: "Create, optimize, and analyze social media content",
    category: "Social Media",
    nodes: [
      {
        id: "input_1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {
          label: "Content Theme",
          description: "Enter your social media content topic or campaign theme"
        }
      },
      {
        id: "llm_1",
        type: "llm",
        position: { x: 300, y: 100 },
        data: {
          label: "Multi-Platform Creator",
          prompt: "Create social media content for {{input}}. Generate versions for Instagram (engaging, visual), Twitter (concise, witty), LinkedIn (professional, insightful), and TikTok (trendy, fun).",
          system_prompt: "You are a social media expert who understands platform-specific content strategies.",
          output_key: "platform_content"
        }
      },
      {
        id: "image_generator_1",
        type: "image_generator",
        position: { x: 300, y: 300 },
        data: {
          label: "Social Media Visual",
          prompt: "Create an eye-catching social media visual for: {{input}}",
          model: "fal-ai/flux/schnell",
          style: "vibrant, social media optimized, engaging",
          size: "1080x1080",
          output_key: "social_visual"
        }
      },
      {
        id: "text_analyzer_1",
        type: "text_analyzer",
        position: { x: 500, y: 200 },
        data: {
          label: "Engagement Optimizer",
          description: "Analyze content for engagement potential and platform compliance",
          analysis_types: ["engagement", "sentiment", "platform_optimization"],
          output_key: "engagement_analysis"
        }
      },
      {
        id: "llm_2",
        type: "llm",
        position: { x: 700, y: 200 },
        data: {
          label: "Hashtag & CTA Generator",
          prompt: "Based on the content {{platform_content}} and analysis {{engagement_analysis}}, generate relevant hashtags and compelling calls-to-action for each platform targeting {{input}}.",
          system_prompt: "You are a social media growth specialist.",
          output_key: "hashtags_cta"
        }
      },
      {
        id: "output_1",
        type: "output",
        position: { x: 900, y: 200 },
        data: {
          label: "Social Media Kit",
          description: "Complete social media package with content, visuals, and optimization"
        }
      }
    ],
    connections: [
      { source: "input_1", target: "llm_1" },
      { source: "input_1", target: "image_generator_1" },
      { source: "llm_1", target: "text_analyzer_1" },
      { source: "text_analyzer_1", target: "llm_2" },
      { source: "llm_2", target: "output_1" },
      { source: "image_generator_1", target: "output_1" }
    ]
  }
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const template_id = url.searchParams.get("id");

    // If specific template requested
    if (template_id) {
      const template = WORKFLOW_TEMPLATES[template_id as keyof typeof WORKFLOW_TEMPLATES];
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ template });
    }

    // Filter by category if specified
    let templates = Object.values(WORKFLOW_TEMPLATES);
    if (category) {
      templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    // Group templates by category
    const grouped_templates = templates.reduce((acc, template) => {
      const cat = template.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        node_count: template.nodes.length,
        estimated_cost: estimate_template_cost(template)
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      templates: grouped_templates,
      categories: [...new Set(Object.values(WORKFLOW_TEMPLATES).map(t => t.category))]
    });

  } catch (error) {
    console.error("GET templates error:", error);
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

    const body = await req.json();
    const { template_id, workflow_name, workflow_description } = body;

    if (!template_id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const template = WORKFLOW_TEMPLATES[template_id as keyof typeof WORKFLOW_TEMPLATES];
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
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

    // Create workflow from template
    const { data: workflow, error: workflow_error } = await supabase
      .from("workflows")
      .insert({
        user_id: user.id,
        template_id: template.id,
        name: workflow_name || template.name,
        description: workflow_description || template.description,
        graph_data: {
          nodes: template.nodes,
          connections: template.connections
        },
        settings: {
          auto_execute: false,
          require_confirmation: true,
          max_execution_time: 300000
        },
        is_active: true
      })
      .select()
      .single();

    if (workflow_error) {
      console.error("Error creating workflow from template:", workflow_error);
      return NextResponse.json(
        { error: "Failed to create workflow" },
        { status: 500 }
      );
    }

    // Create workflow nodes from template
    const workflow_nodes = template.nodes.map((node: any) => ({
      workflow_id: workflow.id,
      node_id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      connections: template.connections.filter((conn: any) => 
        conn.source === node.id || conn.target === node.id
      )
    }));

    const { error: nodes_error } = await supabase
      .from("workflow_nodes")
      .insert(workflow_nodes);

    if (nodes_error) {
      console.error("Error creating workflow nodes:", nodes_error);
      // Clean up the workflow
      await supabase
        .from("workflows")
        .delete()
        .eq("id", workflow.id);
      
      return NextResponse.json(
        { error: "Failed to create workflow nodes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workflow: {
        ...workflow,
        workflow_nodes: template.nodes
      },
      message: "Workflow created successfully from template"
    });

  } catch (error) {
    console.error("POST template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to estimate template execution cost
function estimate_template_cost(template: any): number {
  let cost = 0;
  
  for (const node of template.nodes) {
    switch (node.type) {
      case "llm":
        cost += 1; // Base LLM cost
        break;
      case "image_generator":
        const model = node.data.model || "fal-ai/flux/schnell";
        const model_costs = {
          "fal-ai/recraft-v3": 6,
          "fal-ai/flux-lora": 6,
          "fal-ai/flux/schnell": 4,
          "fal-ai/flux-realism": 6,
          "fal-ai/flux-pro": 12,
          "fal-ai/flux/dev": 10,
          "fal-ai/stable-diffusion-v3-medium": 3,
          "fal-ai/aura-flow": 3,
          "fal-ai/kolors": 3,
          "fal-ai/stable-cascade": 5,
        };
        cost += (model_costs as any)[model] || 4;
        break;
      case "text_analyzer":
        cost += 0.5; // Text analysis cost
        break;
      default:
        // No additional cost for input/output/conditional nodes
        break;
    }
  }
  
  return Math.ceil(cost);
} 