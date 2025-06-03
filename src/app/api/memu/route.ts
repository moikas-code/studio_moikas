import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { workflow_xai_agent } from "@/lib/ai-agents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Token costs per 3000 tokens
// const MIN_TEXT_COST = 1; // Minimum 1 MP per message - will be used when full functionality is enabled

export async function POST(req: NextRequest) {
  console.log("🚀 Memu API endpoint called");
  
  try {
    const body = await req.json();
    const { session_id, workflow_id, message, dev_mode, default_settings: frontend_settings } = body;
    
    // Development mode bypass
    if (dev_mode === "test") {
      console.log("🧪 Development mode - bypassing authentication");
      
      // Test the AI agent directly
      try {
        console.log("🤖 Testing AI agent initialization...");
        const agent = new workflow_xai_agent({
          temperature: 0.7,
          maxTokens: 2048,
        });
        console.log("✅ AI agent initialized successfully");
        
        console.log("📝 Creating test message...");
        const test_messages = [new HumanMessage(message || "Hello, this is a test!")];
        
        console.log("⚡ Executing workflow test...");
        const result = await agent.execute_workflow(
          test_messages,
          "",
          "test-session",
          "test-user",
          []
        );
        console.log("✅ Workflow executed successfully");
        
        return NextResponse.json({
          status: "success",
          response: result.response,
          token_usage: result.token_usage,
          execution_history: result.execution_history
        });
        
      } catch (agent_error) {
        console.error("❌ AI agent error:", agent_error);
        return NextResponse.json({
          error: "AI agent failed",
          details: agent_error instanceof Error ? agent_error.message : String(agent_error)
        }, { status: 500 });
      }
    }

    console.log("🔐 Checking authentication...");
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ No userId found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("✅ User authenticated:", userId);

    console.log("📝 Parsing request body...");
    console.log("📝 Request data:", { session_id, workflow_id, message: message?.substring(0, 50) + "..." });

    if (!session_id || !message) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    console.log("🗄️ Initializing Supabase client...");
    const supabase = await create_clerk_supabase_client_ssr();
    console.log("✅ Supabase client initialized");
    
    console.log("👤 Fetching user and subscription info...");
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select(`
        id,
        subscriptions (
          plan,
          renewable_tokens,
          permanent_tokens
        )
      `)
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("❌ User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("✅ User found:", user.id, "Plan:", user.subscriptions?.[0]?.plan);

    if (!user.subscriptions?.[0]) {
      console.log("❌ No subscription found");
      return NextResponse.json({ error: "User subscription not found" }, { status: 404 });
    }

    // Get user's default chat settings when no workflow is selected
    let default_settings = null;
    if (!workflow_id) {
      console.log("🎛️ No workflow selected, determining default chat settings...");
      
      // Priority: 1. Frontend settings, 2. Database settings, 3. Hardcoded fallback
      if (frontend_settings) {
        console.log("✅ Using frontend-provided default settings");
        default_settings = frontend_settings;
      } else {
        console.log("🔍 Fetching default settings from database...");
        
        // Try to get existing defaults directly from database
        const { data: user_defaults } = await supabase
          .from("user_chat_defaults")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (user_defaults) {
          default_settings = user_defaults;
          console.log("✅ Default settings loaded from database:", {
            response_style: user_defaults.response_style,
            temperature: user_defaults.temperature,
            model: user_defaults.model_preference
          });
        } else {
          console.log("⚠️ No user defaults found, using hardcoded fallback");
          // Use hardcoded defaults as fallback
          default_settings = {
            temperature: 0.8,
            max_tokens: 1024,
            model_preference: 'grok-3-mini-latest',
            system_prompt: 'You are a helpful, friendly AI assistant. Give direct, clear answers in a conversational tone. Avoid being overly formal or verbose. When someone asks a question, provide the key information they need without unnecessary technical details or lengthy explanations unless specifically requested. Be natural and human-like in your responses.',
            response_style: 'conversational'
          };
        }
      }
    }

    // Now process the actual chat message
    console.log("🤖 Processing chat message...");
    
    try {
      // Initialize AI agent with user's default settings or workflow settings
      const agent_config = {
        temperature: default_settings?.temperature || 0.7,
        maxTokens: default_settings?.max_tokens || 2048,
        model: default_settings?.model_preference || "grok-3-mini-latest"
      };
      
      console.log("🤖 Initializing AI agent with config:", agent_config);
      if (default_settings) {
        console.log("🎛️ Using default settings:", {
          system_prompt: default_settings.system_prompt?.substring(0, 50) + "...",
          response_style: default_settings.response_style,
          temperature: default_settings.temperature,
          max_tokens: default_settings.max_tokens,
          model: default_settings.model_preference
        });
      }
      const agent = new workflow_xai_agent(agent_config);

      // Create message history from session
      const { data: existing_messages } = await supabase
        .from("workflow_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true });

      const message_history = existing_messages?.map(msg => 
        msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
      ) || [];

      // Add the new user message
      message_history.push(new HumanMessage(message));

      console.log("⚡ Executing AI workflow...");
      const result = await agent.execute_workflow(
        message_history,
        default_settings?.system_prompt || "",
        session_id,
        user.id,
        []
      );

      console.log("✅ AI workflow completed");

      // Save user message to database
      await supabase
        .from("workflow_messages")
        .insert({
          session_id: session_id,
          user_id: user.id,
          role: "user",
          content: message,
          metadata: { timestamp: new Date().toISOString() }
        });

      // Save AI response to database
      await supabase
        .from("workflow_messages")
        .insert({
          session_id: session_id,
          user_id: user.id,
          role: "assistant",
          content: result.response,
          metadata: { 
            timestamp: new Date().toISOString(),
            token_usage: result.token_usage,
            execution_history: result.execution_history
          }
        });

      // Update session timestamp
      await supabase
        .from("workflow_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", session_id);

      return NextResponse.json({
        status: "success",
        response: result.response,
        token_usage: result.token_usage,
        execution_history: result.execution_history,
        session_id: session_id
      });

    } catch (ai_error) {
      console.error("❌ AI processing error:", ai_error);
      return NextResponse.json({
        error: "Failed to process chat message",
        details: ai_error instanceof Error ? ai_error.message : String(ai_error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("❌ API error:", error);
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

    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
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