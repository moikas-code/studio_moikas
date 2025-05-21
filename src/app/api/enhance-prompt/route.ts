import { NextRequest, NextResponse } from "next/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { auth } from "@clerk/nextjs/server";
import { deduct_tokens } from "@/lib/generate_helpers";
import { invoke_xai_agent_with_tools } from "@/lib/xai_agent";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * POST /api/enhance-prompt
 * Body: { prompt: string }
 * Auth required. Deducts 1 MP (token) from the user, prioritizing renewable tokens.
 * Returns: { enhanced_prompt: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Parse request body
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();
    // Fetch user row
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();
    if (user_error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Deduct 1 token (MP) from the user
    try {
      await deduct_tokens({ supabase, user_id: user.id, required_tokens: 1 });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Insufficient tokens" }, { status: 402 });
    }
    // Enhance the prompt using xAI agent
    const system_message = new SystemMessage(
      "You are an expert prompt engineer for AI image generation. Improve the user's prompt for best results. Be concise and to the point. Do not add any additional text or commentary."
    );
    const human_message = new HumanMessage(prompt);
    const enhanced_prompt = await invoke_xai_agent_with_tools({
      system_message,
      prompt: human_message,
    });
    return NextResponse.json({ enhanced_prompt });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
} 