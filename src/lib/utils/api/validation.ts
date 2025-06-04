import { z } from 'zod'

// Common schemas
export const user_id_schema = z.string().uuid()
export const session_id_schema = z.string().uuid()
export const limit_schema = z.number().int().min(1).max(100).default(10)
export const offset_schema = z.number().int().min(0).default(0)

// Image generation schemas
export const image_generation_schema = z.object({
  prompt: z.string().min(1).max(1000).transform(s => s.trim()),
  model: z.string().min(1),
  aspect_ratio: z.string().optional(),
  width: z.number().int().min(64).max(2048).optional(),
  height: z.number().int().min(64).max(2048).optional(),
  inference_steps: z.number().int().min(1).max(100).optional(),
  guidance_scale: z.number().min(0).max(30).optional(),
  style_preset: z.string().optional(),
  seed: z.number().int().optional(),
  enable_safety_checker: z.boolean().optional()
})

// Enhanced prompt schema
export const enhance_prompt_schema = z.object({
  prompt: z.string().min(1).max(500).transform(s => s.trim()),
  style: z.string().optional()
})

// MEMU workflow schemas
export const memu_message_schema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000)
})

export const memu_workflow_schema = z.object({
  workflow_id: z.string().uuid(),
  messages: z.array(memu_message_schema),
  session_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional()
})

// Video effects schema
export const video_effects_schema = z.object({
  video_url: z.string().url(),
  effect_type: z.enum(['style_transfer', 'object_removal', 'enhancement']),
  parameters: z.record(z.unknown()).optional()
})

// Chat session schemas
export const create_chat_session_schema = z.object({
  title: z.string().min(1).max(200).optional(),
  workflow_id: z.string().uuid().optional()
})

export const chat_message_schema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(['user', 'assistant']),
  metadata: z.record(z.unknown()).optional()
})

// Feedback schema
export const feedback_schema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(10).max(5000),
  metadata: z.record(z.unknown()).optional()
})

// Bug report schema
export const bug_report_schema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  steps_to_reproduce: z.string().optional(),
  expected_behavior: z.string().optional(),
  actual_behavior: z.string().optional(),
  environment: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    version: z.string().optional()
  }).optional()
})

// Token estimation schema
export const token_estimation_schema = z.object({
  text: z.string().min(1).max(100000),
  model: z.string().optional()
})

// Stripe schemas
export const create_checkout_schema = z.object({
  price_id: z.string().min(1),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional()
})

// Webhook validation helpers
export const clerk_webhook_schema = z.object({
  type: z.string(),
  data: z.record(z.unknown())
})

export const stripe_webhook_schema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown())
  })
})

export const fal_webhook_schema = z.object({
  status: z.enum(['completed', 'failed']),
  job_id: z.string(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional()
})

/**
 * Validate request body with Zod schema
 * @param schema - Zod schema
 * @param data - Request data
 * @returns Validated data or throws validation error
 */
export function validate_request<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      throw new Error(`Validation error: ${message}`)
    }
    throw error
  }
}