import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";
import { invoke_xai_agent_with_tools } from "@/lib/ai-agents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PdfReader } from "pdfreader";
import { track } from '@vercel/analytics/server';
import { create_clerk_supabase_client_ssr } from '@/lib/supabase_server';
import { calculate_final_cost } from '@/lib/pricing_config';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const FEATURES = [
  "script",
  "product_description",
  "video_description",
  "tweet",
  "profile_bio",
  "summary",
  "test",
  "outline",
];

function extract_text_from_pdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = "";
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(err);
      if (!item) return resolve(text);
      if (item.text) text += item.text + " ";
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    let rate;
    if (userId) {
      rate = await check_rate_limit(redis, userId, 10, 60);
    } else {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      rate = await check_rate_limit(redis, ip, 10, 60);
    }
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
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const form_data = await req.formData();
    const file = form_data.get("file");
    const feature = form_data.get("feature");
    const link_or_topic = form_data.get("link_or_topic");
    const session_id = form_data.get("session_id");
    if (typeof feature !== "string" || !FEATURES.includes(feature)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    let text = "";
    let file_name = null;
    if (file && typeof file !== "string" && "arrayBuffer" in file) {
      file_name = file.name;
      if (file.type === "text/plain") {
        const buffer = Buffer.from(await file.arrayBuffer());
        text = buffer.toString("utf-8");
      } else if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          text = await extract_text_from_pdf(buffer);
        } catch {
          return NextResponse.json({ error: "Failed to parse PDF." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "Only text and PDF files are supported for now." }, { status: 400 });
      }
    } else if (typeof link_or_topic === "string" && link_or_topic.trim().length > 0) {
      text = link_or_topic.trim();
    } else {
      return NextResponse.json({ error: "Please upload a file or enter a topic/link." }, { status: 400 });
    }
    // Deduct 25 tokens from the user
    const supabase = await create_clerk_supabase_client_ssr();
    // Get user row by Clerk ID
    const { data: user_row, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();
    if (user_error || !user_row?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Get subscription to check token balance and deduct tokens
    const { data: subscription, error: sub_error } = await supabase
      .from('subscriptions')
      .select('renewable_tokens, permanent_tokens, plan')
      .eq('user_id', user_row.id)
      .single()

    if (sub_error || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Calculate cost with plan-based markup
    const base_cost = 25 / 1.6 // Remove old 1.6x markup to get base cost
    const actual_cost = calculate_final_cost(base_cost, subscription.plan)

    const total_tokens = subscription.renewable_tokens + subscription.permanent_tokens
    if (total_tokens < actual_cost) {
      return NextResponse.json({ 
        error: 'Insufficient tokens', 
        required: actual_cost, 
        available: total_tokens 
      }, { status: 402 })
    }

    // Deduct tokens - prioritize renewable tokens first, then permanent
    const renewable_to_deduct = Math.min(actual_cost, subscription.renewable_tokens)
    const permanent_to_deduct = actual_cost - renewable_to_deduct

    const { error: deduct_error } = await supabase
      .from('subscriptions')
      .update({
        renewable_tokens: subscription.renewable_tokens - renewable_to_deduct,
        permanent_tokens: subscription.permanent_tokens - permanent_to_deduct
      })
      .eq('user_id', user_row.id)

    if (deduct_error) {
      return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 500 })
    }

    // Log the usage
    await supabase
      .from('usage')
      .insert({
        user_id: user_row.id,
        tokens_used: actual_cost,
        description: `Text analysis: ${feature}`
      })
    // Track analytics event
    await track('Text Analyzer Used', {
      feature: String(feature),
      file_name: file_name || '',
      topic: typeof link_or_topic === 'string' ? link_or_topic.slice(0, 128) : '',
      user_id: String(userId),
      timestamp: new Date().toISOString(),
    });
    let system_prompt = "You are an expert assistant.";
    if (feature === "summary") {
      system_prompt = "Summarize the following text in a concise and clear way.";
    } else if (feature === "test") {
      system_prompt = "Create a test (with questions and answers) based on the following text. The test should be in the form of a multiple choice quiz. The questions should be based on the text and should be designed to test the user's understanding of the text. Be sure to include a mix of easy and hard questions. Be direct and concise.";
    } else if (feature === "outline") {
      system_prompt = "Create an outline of the key points from the following text. Be direct and concise.";
    } else if (feature === "script") {
      system_prompt = "Write a detailed script based on the following topic or content. The script should be engaging, informative, and well-structured.";
    } else if (feature === "product_description") {
      system_prompt = "Write a compelling product description based on the following topic or content. Highlight key features, benefits, and use persuasive language.";
    } else if (feature === "video_description") {
      system_prompt = "Write a captivating video description based on the following topic or content. Make it suitable for YouTube or similar platforms, and include relevant keywords.";
    } else if (feature === "tweet") {
      system_prompt = "Generate a set of engaging tweets based on the following topic or content. Each tweet should be concise, interesting, and suitable for social media.";
    } else if (feature === "profile_bio") {
      system_prompt = "Write a creative and professional profile bio based on the following topic or content. Make it suitable for social media or professional platforms.";
    }
    const result = await invoke_xai_agent_with_tools({
      system_message: new SystemMessage(system_prompt),
      prompt: new HumanMessage(text),
      model_options: { model: "grok-3-mini-latest" },
    });

    // Save to session if session_id is provided
    if (session_id && typeof session_id === "string") {
      try {
        // Verify session belongs to user
        const { data: session, error: session_error } = await supabase
          .from("workflow_sessions")
          .select("id")
          .eq("id", session_id)
          .eq("user_id", user_row.id)
          .single();

        if (session && !session_error) {
          // Create user input message
          const user_input = file_name 
            ? `[File: ${file_name}] ${feature.replace('_', ' ')} request`
            : `[Topic: ${text.slice(0, 100)}...] ${feature.replace('_', ' ')} request`;

          // Save user message
          await supabase
            .from('workflow_messages')
            .insert({
              session_id,
              role: 'user',
              content: user_input,
              metadata: { 
                feature,
                file_name: file_name || null,
                topic: typeof link_or_topic === 'string' ? link_or_topic : null
              }
            });

          // Save assistant response
          await supabase
            .from('workflow_messages')
            .insert({
              session_id,
              role: 'assistant',
              content: result,
              metadata: { feature, tokens_used: 25 }
            });

          // Update session timestamp
          await supabase
            .from('workflow_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', session_id);
        }
      } catch (session_error) {
        console.error('Failed to save to session:', session_error);
        // Don't fail the request if session saving fails
      }
    }

    return NextResponse.json({ result });
  } catch  {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 