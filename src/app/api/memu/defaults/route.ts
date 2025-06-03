import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Validation schemas
const VALID_RESPONSE_STYLES = ['conversational', 'formal', 'creative', 'technical', 'concise'];
const VALID_MODELS = ['grok-3-mini-latest'];

function validate_chat_defaults(data: Record<string, unknown>) {
  const errors: string[] = [];

  if (data.system_prompt && typeof data.system_prompt !== 'string') {
    errors.push('system_prompt must be a string');
  }

  if (data.system_prompt && data.system_prompt.length > 2000) {
    errors.push('system_prompt must be less than 2000 characters');
  }

  if (data.response_style && !VALID_RESPONSE_STYLES.includes(data.response_style)) {
    errors.push(`response_style must be one of: ${VALID_RESPONSE_STYLES.join(', ')}`);
  }

  if (data.temperature !== undefined) {
    const temp = Number(data.temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      errors.push('temperature must be a number between 0 and 1');
    }
  }

  if (data.max_tokens !== undefined) {
    const tokens = Number(data.max_tokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 4096) {
      errors.push('max_tokens must be a number between 1 and 4096');
    }
  }

  if (data.context_window !== undefined) {
    const window = Number(data.context_window);
    if (isNaN(window) || window < 1 || window > 50) {
      errors.push('context_window must be a number between 1 and 50');
    }
  }

  if (data.model_preference && !VALID_MODELS.includes(data.model_preference)) {
    errors.push(`model_preference must be one of: ${VALID_MODELS.join(', ')}`);
  }

  if (data.custom_instructions && typeof data.custom_instructions !== 'string') {
    errors.push('custom_instructions must be a string');
  }

  if (data.custom_instructions && data.custom_instructions.length > 1000) {
    errors.push('custom_instructions must be less than 1000 characters');
  }

  return errors;
}

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 30, 60);
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

    // Get or create user chat defaults
    const { data: defaults, error: defaults_error } = await supabase
      .rpc('get_or_create_user_chat_defaults', { p_user_id: user.id });

    if (defaults_error) {
      console.error("Error fetching chat defaults:", defaults_error);
      
      // If function doesn't exist, fall back to manual default creation
      if (defaults_error.code === 'PGRST202') {
        console.log("Database function not found, creating default settings manually");
        
        // Try to get existing defaults first
        const { data: existing_defaults } = await supabase
          .from("user_chat_defaults")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (existing_defaults) {
          return NextResponse.json({ defaults: existing_defaults });
        }
        
        // Create default settings if none exist
        const default_settings = {
          user_id: user.id,
          temperature: 0.8,
          max_tokens: 1024,
          model_preference: 'grok-3-mini-latest',
          system_prompt: 'You are a helpful, friendly AI assistant. Give direct, clear answers in a conversational tone. Avoid being overly formal or verbose. When someone asks a question, provide the key information they need without unnecessary technical details or lengthy explanations unless specifically requested. Be natural and human-like in your responses.',
          response_style: 'conversational',
          context_window: 20,
          enable_memory: true,
          enable_web_search: false,
          enable_code_execution: false,
          custom_instructions: ''
        };
        
        const { data: new_defaults, error: create_error } = await supabase
          .from("user_chat_defaults")
          .insert(default_settings)
          .select()
          .single();
        
        if (create_error) {
          console.error("Error creating default settings:", create_error);
          return NextResponse.json(
            { error: "Failed to create default settings" },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ defaults: new_defaults });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch chat defaults" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      defaults: defaults
    });

  } catch (error) {
    console.error("GET chat defaults error:", error);
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
    
    // Validate input
    const validation_errors = validate_chat_defaults(body);
    if (validation_errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validation_errors },
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

    // Prepare update data - only include provided fields
    const update_data: Record<string, unknown> = {};
    
    if (body.system_prompt !== undefined) update_data.system_prompt = body.system_prompt;
    if (body.response_style !== undefined) update_data.response_style = body.response_style;
    if (body.temperature !== undefined) update_data.temperature = Number(body.temperature);
    if (body.max_tokens !== undefined) update_data.max_tokens = Number(body.max_tokens);
    if (body.context_window !== undefined) update_data.context_window = Number(body.context_window);
    if (body.enable_memory !== undefined) update_data.enable_memory = Boolean(body.enable_memory);
    if (body.enable_web_search !== undefined) update_data.enable_web_search = Boolean(body.enable_web_search);
    if (body.enable_code_execution !== undefined) update_data.enable_code_execution = Boolean(body.enable_code_execution);
    if (body.custom_instructions !== undefined) update_data.custom_instructions = body.custom_instructions;
    if (body.model_preference !== undefined) update_data.model_preference = body.model_preference;

    // First, try to get existing defaults
    const { data: existing_defaults } = await supabase
      .from("user_chat_defaults")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existing_defaults) {
      // Update existing defaults
      const { data: updated_defaults, error: update_error } = await supabase
        .from("user_chat_defaults")
        .update(update_data)
        .eq("user_id", user.id)
        .select()
        .single();

      if (update_error) {
        console.error("Error updating chat defaults:", update_error);
        return NextResponse.json(
          { error: "Failed to update chat defaults" },
          { status: 500 }
        );
      }
      result = updated_defaults;
    } else {
      // Create new defaults
      const { data: new_defaults, error: create_error } = await supabase
        .from("user_chat_defaults")
        .insert({
          user_id: user.id,
          ...update_data
        })
        .select()
        .single();

      if (create_error) {
        console.error("Error creating chat defaults:", create_error);
        return NextResponse.json(
          { error: "Failed to create chat defaults" },
          { status: 500 }
        );
      }
      result = new_defaults;
    }

    return NextResponse.json({
      defaults: result,
      message: "Chat defaults updated successfully"
    });

  } catch (error) {
    console.error("PUT chat defaults error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 5, 60);
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

    // Reset to default settings by deleting the record
    const { error: delete_error } = await supabase
      .from("user_chat_defaults")
      .delete()
      .eq("user_id", user.id);

    if (delete_error) {
      console.error("Error resetting chat defaults:", delete_error);
      return NextResponse.json(
        { error: "Failed to reset chat defaults" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat defaults reset to system defaults"
    });

  } catch (error) {
    console.error("DELETE chat defaults error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}