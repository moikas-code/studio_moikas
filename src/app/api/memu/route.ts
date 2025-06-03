import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { workflow_xai_agent } from "@/lib/xai_agent";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Token costs per 3000 tokens
const TEXT_TOKENS_PER_3000 = 1; // 1 MP per 3000 tokens for text
const MIN_TEXT_COST = 1; // Minimum 1 MP per message

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { session_id, workflow_id, message, system_prompt } = body;

    if (!session_id || !message) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for now
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
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

    // Check minimum token balance
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
          name: "Memu Chat Session"
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

    // Get workflow data and nodes if specified
    let workflow_nodes: any[] = [];
    let workflow_data: any = null;
    
    if (workflow_id) {
      const { data } = await supabase
        .from("workflows")
        .select(`
          *,
          workflow_nodes (*)
        `)
        .eq("id", workflow_id)
        .eq("user_id", user.id)
        .single();

      if (data) {
        workflow_data = data;
        workflow_nodes = data.workflow_nodes || [];
      }
    }

    // Get conversation history for context
    const { data: message_history } = await supabase
      .from("workflow_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(20); // Limit to last 20 messages

    const conversation_messages = message_history?.map(msg => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    }) || [];

    // Add current message
    const current_message = new HumanMessage(message);
    const all_messages = [...conversation_messages, current_message];

    try {
      // Initialize the enhanced xAI agent
      const agent = new workflow_xai_agent({
        temperature: 0.7,
        maxTokens: 2048,
      });

      // Execute the multi-agent workflow
      const result = await agent.execute_workflow(
        all_messages,
        workflow_id || "",
        session_id,
        user.id,
        workflow_nodes
      );

      // Calculate token cost
      const total_input_tokens = result.token_usage.input;
      const total_output_tokens = result.token_usage.output;
      const total_tokens_used = total_input_tokens + total_output_tokens;
      
      // Calculate cost: 1 MP per 3000 tokens, minimum 1 MP
      let text_cost = Math.max(MIN_TEXT_COST, Math.ceil(total_tokens_used / 3000));
      const total_cost = text_cost + result.model_costs;

      // Check if user has enough tokens for the actual cost
      if (total_tokens < total_cost) {
        return NextResponse.json(
          { error: "Insufficient tokens for this operation" },
          { status: 402 }
        );
      }

      // Deduct tokens
      const renewable_to_use = Math.min(subscription.tokens_renewable, total_cost);
      const permanent_to_use = Math.max(0, total_cost - renewable_to_use);

      const { error: deduct_error } = await supabase.rpc('deduct_tokens_v2', {
        p_user_id: user.id,
        p_renewable_tokens: renewable_to_use,
        p_permanent_tokens: permanent_to_use
      });

      if (deduct_error) {
        console.error("Token deduction failed:", deduct_error);
        return NextResponse.json(
          { error: "Token deduction failed" },
          { status: 500 }
        );
      }

      // Save assistant response
      await supabase
        .from("workflow_messages")
        .insert({
          session_id: session.id,
          role: "assistant",
          content: result.response,
          metadata: {
            token_usage: result.token_usage,
            model_costs: result.model_costs,
            execution_history: result.execution_history,
            workflow_id: workflow_id,
            total_cost: total_cost
          }
        });

      // Log usage
      await supabase
        .from("usage")
        .insert({
          user_id: user.id,
          tokens_used: total_cost
        });

      return NextResponse.json({
        response: result.response,
        session_id: session.id,
        tokens_used: total_cost,
        token_usage: result.token_usage,
        model_costs: result.model_costs,
        execution_history: result.execution_history
      });

    } catch (error) {
      console.error("Agent execution error:", error);
      
      const error_message = error instanceof Error ? error.message : String(error);
      
      // Save error message
      await supabase
        .from("workflow_messages")
        .insert({
          session_id: session.id,
          role: "assistant",
          content: "I apologize, but I encountered an error while processing your request. Please try again.",
          metadata: {
            error: error_message,
            timestamp: new Date().toISOString()
          }
        });

      return NextResponse.json(
        { error: "Failed to process request" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("API error:", error);
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

    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
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

    // Get session messages
    const { data: messages } = await supabase
      .from("workflow_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    // Get session info
    const { data: session } = await supabase
      .from("workflow_sessions")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      session,
      messages: messages || []
    });

  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 