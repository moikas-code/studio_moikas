import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { workflow_engine, workflow_definition } from "@/lib/workflow_engine";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Token costs per 100 tokens
const TEXT_TOKENS_PER_100 = 1; // 1 MP per 100 tokens for text
const MIN_TEXT_COST = 1; // Minimum 1 MP per message

// Model costs (from existing system)
const MODEL_COSTS = {
  // Image models
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
  // Video models
  "fal-ai/hunyuanvideo": 100,
  "fal-ai/ltx-video": 80,
  "fal-ai/cogvideox-5b": 50,
  "fal-ai/mochi-v1": 60,
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { session_id, workflow_id, message } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user and subscription info
    const { data: user } = await supabase
      .from("users")
      .select(`
        id,
        subscriptions (
          plan_type,
          tokens_renewable,
          tokens_permanent
        )
      `)
      .eq("clerk_id", userId)
      .single();

    if (!user || !user.subscriptions?.[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = user.subscriptions[0];
    const is_free_user = subscription.plan_type === "free";

    // Rate limiting
    const rate_limit = is_free_user ? 10 : 60;
    const rate = await check_rate_limit(redis, userId, rate_limit, 60);
    
    if (!rate.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          retry_after: rate.reset
        },
        { status: 429 }
      );
    }

    // Check minimum token balance (we'll calculate actual cost after generation)
    const total_tokens = subscription.tokens_renewable + subscription.tokens_permanent;
    if (total_tokens < MIN_TEXT_COST) {
      return NextResponse.json(
        { error: "Insufficient tokens" },
        { status: 402 }
      );
    }

    // Get or create session
    let session;
    const { data: existing_session } = await supabase
      .from("workflow_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (existing_session) {
      session = existing_session;
    } else {
      const { data: new_session, error: session_error } = await supabase
        .from("workflow_sessions")
        .insert({
          id: session_id,
          user_id: user.id,
          workflow_id,
          name: "Chat Session"
        })
        .select()
        .single();

      if (session_error) {
        console.error("Error creating session:", session_error);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }
      session = new_session;
    }

    // Save user message
    await supabase
      .from("workflow_messages")
      .insert({
        session_id: session.id,
        role: "user",
        content: message
      });

    // Don't deduct tokens yet - we'll calculate cost after generation
    let tokens_deducted = false;
    let actual_token_cost = 0;

    try {
      // Get workflow if specified
      let workflow_def: workflow_definition | null = null;
      
      if (workflow_id) {
        const { data: workflow_data } = await supabase
          .from("workflows")
          .select(`
            *,
            workflow_nodes (*)
          `)
          .eq("id", workflow_id)
          .eq("user_id", user.id)
          .single();

        if (workflow_data) {
          workflow_def = {
            id: workflow_data.id,
            name: workflow_data.name,
            nodes: workflow_data.workflow_nodes || [],
            settings: workflow_data.settings || {}
          };
        }
      }

      let response;
      let token_usage = { input: 0, output: 0 };
      let workflow_model_costs = 0;
      
      if (workflow_def && workflow_def.nodes.length > 0) {
        // Execute workflow
        const engine = new workflow_engine(workflow_def, {
          session_id: session.id,
          user_id: user.id,
          variables: {},
          history: []
        });

        await engine.initialize();
        const result = await engine.execute({ user_input: message });
        response = result.llm_response || result.output || "Workflow executed successfully";
        
        // Calculate costs from workflow execution
        if (result.token_usage) {
          token_usage = result.token_usage;
        }
        if (result.model_costs) {
          workflow_model_costs = result.model_costs;
        }
      } else {
        // Default chat behavior if no workflow
        const { ChatXAI } = await import("@langchain/xai");
        const { HumanMessage, SystemMessage } = await import("@langchain/core/messages");
        
        const model = new ChatXAI({
          apiKey: process.env.XAI_API_KEY,
          model: "grok-3-mini-latest",
        });
        
        const messages = [
          new SystemMessage("You are a helpful AI assistant that can help users create and manage workflows."),
          new HumanMessage(message)
        ];
        
        const ai_response = await model.invoke(messages);
        
        // Extract response content
        if (typeof ai_response.content === "string") {
          response = ai_response.content;
        } else if (Array.isArray(ai_response.content)) {
          response = ai_response.content
            .map((item) => {
              if (typeof item === "string") return item;
              if (typeof item === "object" && item !== null && "text" in item)
                return String(item.text);
              return "";
            })
            .join("");
        } else {
          response = "I couldn't process your message.";
        }
        
        // Get token usage from response metadata
        if (ai_response.usage_metadata) {
          token_usage = {
            input: ai_response.usage_metadata.input_tokens || 0,
            output: ai_response.usage_metadata.output_tokens || 0
          };
        } else {
          // Estimate if not provided (rough approximation)
          token_usage = {
            input: Math.ceil(message.length / 4),
            output: Math.ceil(response.length / 4)
          };
        }
      }
      
      // Calculate actual token cost
      const total_tokens = token_usage.input + token_usage.output;
      const text_token_cost = Math.max(
        MIN_TEXT_COST,
        Math.ceil(total_tokens / 100) * TEXT_TOKENS_PER_100
      );
      actual_token_cost = text_token_cost + workflow_model_costs;
      
      // Check if user has enough tokens for actual cost
      if (total_tokens < actual_token_cost) {
        throw new Error("Insufficient tokens for this operation");
      }
      
      // Deduct actual token cost
      const { error: deduct_error } = await supabase
        .rpc("deduct_tokens", {
          p_user_id: user.id,
          p_amount: actual_token_cost
        });

      if (deduct_error) {
        console.error("Error deducting tokens:", deduct_error);
        throw new Error("Failed to deduct tokens");
      }
      
      tokens_deducted = true;

      // Save assistant response
      await supabase
        .from("workflow_messages")
        .insert({
          session_id: session.id,
          role: "assistant",
          content: response
        });

      // Track usage
      await supabase
        .from("usage")
        .insert({
          user_id: user.id,
          action: "workflow_chat",
          tokens_used: actual_token_cost,
          metadata: {
            session_id: session.id,
            workflow_id,
            token_breakdown: {
              text_tokens: token_usage,
              model_costs: workflow_model_costs,
              total_cost: actual_token_cost
            }
          }
        });

      return NextResponse.json({ 
        response,
        tokens_used: actual_token_cost,
        token_details: {
          input_tokens: token_usage.input,
          output_tokens: token_usage.output,
          text_cost: text_token_cost,
          model_costs: workflow_model_costs,
          total_cost: actual_token_cost
        }
      });

    } catch (error) {
      console.error("Chat processing error:", error);
      
      // Refund tokens on error
      if (tokens_deducted && actual_token_cost > 0) {
        await supabase
          .rpc("refund_tokens", {
            p_user_id: user.id,
            p_amount: actual_token_cost
          });
      }

      return NextResponse.json(
        { error: "Failed to process chat" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
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

    // Get session and messages
    const { data: session, error: session_error } = await supabase
      .from("workflow_sessions")
      .select(`
        *,
        workflow_messages (
          id,
          role,
          content,
          created_at,
          metadata
        )
      `)
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    if (session_error || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Sort messages by created_at
    session.workflow_messages.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return NextResponse.json({ 
      session,
      messages: session.workflow_messages
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}