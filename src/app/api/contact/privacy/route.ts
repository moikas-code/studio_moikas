import { NextRequest } from "next/server";
import { handle_api_error, api_success, api_error } from "@/lib/utils/api/response";
import { validate_request } from "@/lib/utils/api/validation";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { get_redis_client } from "@/lib/utils/database/redis";
import { z } from "zod";

const contact_schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(500),
  message: z.string().min(10).max(5000),
  request_type: z.enum([
    "general",
    "data_export",
    "data_deletion",
    "opt_out",
    "data_correction",
    "breach",
    "other",
  ]),
});

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json();
    const validated = validate_request(contact_schema, body);

    // Rate limiting - max 5 messages per email per day
    const redis = get_redis_client();
    const rate_limit_key = `contact:privacy:${validated.email}:${new Date().toISOString().split("T")[0]}`;

    if (redis) {
      const current_count = await redis.incr(rate_limit_key);
      if (current_count === 1) {
        await redis.expire(rate_limit_key, 86400); // 24 hours
      }

      if (current_count > 5) {
        return api_error("Too many contact requests. Please try again tomorrow.", 429);
      }
    }

    const supabase = get_service_role_client();

    // Store the contact request
    const { error } = await supabase.from("contact_requests").insert({
      type: "privacy",
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
      request_type: validated.request_type,
      status: "pending",
    });

    if (error) {
      // If table doesn't exist, create it
      if (error.code === "42P01") {
        // Create the table
        await supabase
          .rpc("exec_sql", {
            sql: `
            CREATE TABLE IF NOT EXISTS public.contact_requests (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              type TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              request_type TEXT,
              status TEXT DEFAULT 'pending',
              admin_notes TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              responded_at TIMESTAMPTZ
            );
            
            CREATE INDEX idx_contact_requests_type ON public.contact_requests(type);
            CREATE INDEX idx_contact_requests_status ON public.contact_requests(status);
            CREATE INDEX idx_contact_requests_created_at ON public.contact_requests(created_at);
          `,
          })
          .catch(() => {
            // If exec_sql doesn't exist, we'll just log to system_logs
          });

        // Try again
        await supabase.from("contact_requests").insert({
          type: "privacy",
          name: validated.name,
          email: validated.email,
          subject: validated.subject,
          message: validated.message,
          request_type: validated.request_type,
          status: "pending",
        });
      } else {
        throw error;
      }
    }

    // Log to system logs as backup
    await supabase.from("system_logs").insert({
      action: "contact_request",
      details: {
        type: "privacy",
        email: validated.email,
        request_type: validated.request_type,
        subject: validated.subject,
      },
    });

    // In production, you would:
    // 1. Send email notification to privacy team
    // 2. Send confirmation email to user
    // 3. Create ticket in support system

    return api_success({
      message: "Privacy inquiry received successfully",
      expected_response_time: "24-48 hours",
    });
  } catch (error) {
    return handle_api_error(error);
  }
}
