import { NextRequest, NextResponse } from "next/server";
import { create_service_role_client } from "@/lib/supabase_server";

export const runtime = "nodejs"; // Ensure this runs in Node.js, not Edge

interface FalWebhookPayload {
  request_id: string;
  gateway_request_id?: string;
  status: "OK" | "ERROR";
  payload?: Record<string, unknown>;
  error?: string;
  payload_error?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Log all headers for debugging
    console.log(`[Webhook] Headers:`, Object.fromEntries(req.headers.entries()));
    
    // Optional: Add webhook secret verification (disabled for now)
    // const webhook_secret = process.env.FAL_WEBHOOK_SECRET;
    // if (webhook_secret) {
    //   const auth_header = req.headers.get('authorization');
    //   if (auth_header !== `Bearer ${webhook_secret}`) {
    //     console.error("Webhook authentication failed");
    //     return NextResponse.json(
    //       { error: "Unauthorized" },
    //       { status: 401 },
    //     );
    //   }
    // }

    const body: FalWebhookPayload = await req.json();
    const { request_id, gateway_request_id, status, payload, error, payload_error } = body;

    console.log(`[Webhook] Received webhook for job ${request_id} with status ${status}`);

    // Validate required fields
    if (!request_id) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 },
      );
    }

    if (!status || !["OK", "ERROR"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 },
      );
    }

    // Use service role client since webhooks don't have authentication
    const supabase = create_service_role_client();
    
    // Initialize update data
    const update_data: Record<string, unknown> = {
      status: status === "OK" ? "done" : "error",
      updated_at: new Date().toISOString(),
    };

    // Store gateway_request_id if provided
    if (gateway_request_id) {
      update_data.gateway_request_id = gateway_request_id;
    }

    // Handle successful completion
    if (status === "OK") {
      // Check for payload serialization errors
      if (payload_error) {
        update_data.status = "error";
        update_data.error_message = `Payload serialization error: ${payload_error}`;
      } else if (payload) {
        // Store the full payload for debugging
        update_data.result_payload = payload;
        
        // Extract media URLs based on different model response formats
        const extracted_urls = extract_media_urls(payload);
        
        if (extracted_urls.video_url) {
          update_data.video_url = extracted_urls.video_url;
        }
        if (extracted_urls.image_urls && extracted_urls.image_urls.length > 0) {
          update_data.image_urls = extracted_urls.image_urls;
        }
        
        // If no media found but status is OK, log warning
        if (!extracted_urls.video_url && (!extracted_urls.image_urls || extracted_urls.image_urls.length === 0)) {
          console.warn(`No media URLs found in successful payload for job ${request_id}`);
        }
      }
    } 
    // Handle errors
    else if (status === "ERROR") {
      // Construct detailed error message
      let error_message = error || "Unknown error";
      
      // Add detailed error information if available
      if (payload?.detail && Array.isArray(payload.detail)) {
        const error_details = payload.detail.map((d: { type?: string; msg?: string; loc?: string[] }) => 
          `${d.type || 'error'}: ${d.msg || 'Unknown'} at ${d.loc?.join('.') || 'unknown location'}`
        ).join('; ');
        error_message = `${error_message} - Details: ${error_details}`;
      }
      
      update_data.error_message = error_message;
      update_data.error_payload = payload; // Store full error payload for debugging
      
      // Handle token refund for failed jobs
      try {
        // Get the job details first to calculate refund amount
        const { data: job_data } = await supabase
          .from("video_jobs")
          .select("user_id, model_id, duration")
          .eq("job_id", request_id)
          .single();
          
        if (job_data) {
          // Import necessary helpers at the top of the file
          const { VIDEO_MODELS, calculateGenerationMP, video_model_to_legacy_model } = await import("@/lib/generate_helpers");
          
          const model = VIDEO_MODELS.find(m => m.value === job_data.model_id);
          if (model) {
            const refund_amount = calculateGenerationMP(video_model_to_legacy_model(model)) * (job_data.duration || 5);
            
            // Refund the tokens
            const { error: refund_error } = await supabase.rpc('refund_tokens', {
              p_user_id: job_data.user_id,
              p_amount: refund_amount
            });
            
            if (!refund_error) {
              console.log(`Refunded ${refund_amount} tokens for failed job ${request_id}`);
              update_data.tokens_refunded = refund_amount;
            } else {
              console.error(`Failed to refund tokens for job ${request_id}:`, refund_error);
            }
          }
        }
      } catch (refund_err) {
        console.error(`Error processing token refund for job ${request_id}:`, refund_err);
      }
    }

    // Update the job in the database
    const { error: db_error } = await supabase
      .from("video_jobs")
      .update(update_data)
      .eq("job_id", request_id);

    if (db_error) {
      console.error(`Database update error for job ${request_id}:`, db_error);
      return NextResponse.json(
        { error: `Database error: ${db_error.message}` },
        { status: 500 }
      );
    }

    // Log successful webhook processing
    console.log(`Webhook processed successfully for job ${request_id} with status ${status}`);

    return NextResponse.json({ 
      success: true,
      request_id,
      status 
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing error" },
      { status: 500 },
    );
  }
}

/**
 * Extract media URLs from various fal.ai model response formats
 */
function extract_media_urls(payload: Record<string, unknown>): { video_url?: string; image_urls?: string[] } {
  const result: { video_url?: string; image_urls?: string[] } = {};
  
  // Helper to safely access nested properties
  const get = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce((curr: unknown, key: string) => {
      return curr && typeof curr === 'object' && key in curr ? (curr as Record<string, unknown>)[key] : undefined;
    }, obj);
  };
  
  // Video URL extraction patterns
  const video_patterns = [
    () => get(payload, 'video.url') as string | undefined,
    () => (get(payload, 'videos') as Array<{ url?: string }> | undefined)?.[0]?.url,
    () => get(payload, 'output.video.url') as string | undefined,
    () => (get(payload, 'output.videos') as Array<{ url?: string }> | undefined)?.[0]?.url,
    () => get(payload, 'url') as string | undefined, // Some models return URL directly
  ];
  
  for (const pattern of video_patterns) {
    const url = pattern();
    if (url && typeof url === 'string') {
      result.video_url = url;
      break;
    }
  }
  
  // Image URLs extraction patterns
  const image_patterns = [
    () => (get(payload, 'images') as Array<{ url?: string }> | undefined)?.map((img) => img.url).filter((url): url is string => !!url),
    () => {
      const url = get(payload, 'image.url') as string | undefined;
      return url ? [url] : null;
    },
    () => (get(payload, 'output.images') as Array<{ url?: string }> | undefined)?.map((img) => img.url).filter((url): url is string => !!url),
    () => {
      const url = get(payload, 'output.image.url') as string | undefined;
      return url ? [url] : null;
    },
  ];
  
  for (const pattern of image_patterns) {
    const urls = pattern();
    if (urls && urls.length > 0) {
      result.image_urls = urls;
      break;
    }
  }
  
  return result;
}
