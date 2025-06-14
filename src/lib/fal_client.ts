import { fal } from "@fal-ai/client";

// Export the fal client for use in other modules
export { fal };

// Configure fal client with API key - but only if we have the key
// This allows the module to be imported even if FAL_KEY is not set
if (process.env.FAL_KEY) {
  try {
    fal.config({
      credentials: process.env.FAL_KEY
    });
  } catch (error) {
    console.error('Failed to configure fal client:', error);
  }
} else {
  console.warn('FAL_KEY environment variable is not set - video generation will not work');
}

interface FalQueueUpdate {
  status: string;
  logs?: { message: string }[];
  progress?: number;
}

interface FalQueueResult {
  request_id?: string;
  id?: string;
  requestId?: string;
}

interface FalSyncResult {
  video_url?: string;
  url?: string;
  images?: { url: string }[];
}

type FalResult = FalQueueResult | FalSyncResult;

// Accept extra options for fal-ai/sana
export async function generate_flux_image(
  prompt: string,
  width = 1024,
  height = 1024,
  model_id = "fal-ai/sana",
  options: {
    negative_prompt?: string;
    num_inference_steps?: number;
    seed?: number;
    guidance_scale?: number;
    style_name?: string;
    image_size?: string;
    num_images?: number;
    aspect_ratio?: string;
    embeddings?: Array<{ path: string; tokens?: string[] }>;
    loras?: Array<{ path: string; scale?: number }>;
    // Fast-SDXL specific
    enable_safety_checker?: boolean;
    expand_prompt?: boolean;
    format?: 'jpeg' | 'png';
  } = {}
) {
  // Ensure FAL_KEY is set before attempting to generate
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required for image generation');
  }
  // Compose image_size if not provided
  const image_size = options.image_size || {
    width,
    height,
  };
  const input: Record<string, unknown> = {
    prompt,
    ...(options.negative_prompt !== undefined && {
      negative_prompt: options.negative_prompt,
    }),
    ...(options.num_inference_steps !== undefined && {
      num_inference_steps: options.num_inference_steps,
    }),
    ...(options.seed !== undefined && { seed: options.seed }),
    ...(options.guidance_scale !== undefined && {
      guidance_scale: options.guidance_scale,
    }),
    ...(options.style_name !== undefined && { style_name: options.style_name }),
    ...(options.num_images !== undefined && { num_images: options.num_images }),
    ...(options.aspect_ratio !== undefined
      ? { aspect_ratio: options.aspect_ratio }
      : { image_size }),
    // Only add embeddings if they are valid
    ...(options.embeddings !== undefined && options.embeddings.length > 0 && { 
      embeddings: options.embeddings.filter(e => e && e.path).map(e => {
        let path = e.path;
        // Convert Hugging Face IDs to the format fal.ai expects
        const hf_pattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
        if (hf_pattern.test(path) && !path.startsWith('http')) {
          path = `hf:${path}`;
        }
        return {
          path: path,
          ...(e.tokens && { tokens: e.tokens })
        };
      })
    }),
    // Only add loras if they are valid
    ...(options.loras !== undefined && options.loras.length > 0 && { 
      loras: options.loras.filter(l => l && l.path).map(l => {
        let path = l.path;
        // Convert Hugging Face IDs to the format fal.ai expects
        const hf_pattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
        if (hf_pattern.test(path) && !path.startsWith('http')) {
          path = `hf:${path}`;
        }
        return {
          path: path,
          scale: l.scale ?? 1
        };
      })
    }),
    // Fast-SDXL specific parameters
    ...(options.enable_safety_checker !== undefined && { 
      enable_safety_checker: options.enable_safety_checker 
    }),
    ...(options.expand_prompt !== undefined && { 
      expand_prompt: options.expand_prompt 
    }),
    ...(options.format !== undefined && { 
      format: options.format 
    }),
  };
  console.log('[fal.ai] Sending request to model:', model_id);
  console.log('[fal.ai] Input payload:', JSON.stringify(input, null, 2));
  
  const result = await fal.subscribe(model_id, {
    input,
    logs: true,
    onQueueUpdate: (update: FalQueueUpdate) => {
      if (update.status === "IN_PROGRESS" && update.logs) {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });
  console.log('Fal.ai raw result:', JSON.stringify(result, null, 2));
  return result;
}

// Generate video using fal.ai
export async function generate_video(
  model_id: string,
  params: {
    prompt: string;
    negative_prompt?: string;
    duration?: number;
    aspect_ratio?: string;
    image_url?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    seed?: number;
  },
  options?: {
    webhook_url?: string;
    poll_interval?: number;
    logs?: boolean;
  }
): Promise<FalResult> {
  // Ensure FAL_KEY is set before attempting to generate
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required for video generation');
  }
  const input: Record<string, unknown> = {
    prompt: params.prompt,
    ...(params.negative_prompt && { negative_prompt: params.negative_prompt }),
    ...(params.duration && { duration: params.duration }),
    ...(params.aspect_ratio && { aspect_ratio: params.aspect_ratio }),
    ...(params.image_url && { image_url: params.image_url }),
    ...(params.num_inference_steps && { num_inference_steps: params.num_inference_steps }),
    ...(params.guidance_scale && { guidance_scale: params.guidance_scale }),
    ...(params.seed !== undefined && { seed: params.seed })
  };

  // If webhook URL is provided, use queue API for async processing
  if (options?.webhook_url) {
    const result = await fal.queue.submit(model_id, {
      input,
      webhookUrl: options.webhook_url
    });
    
    console.log('Video generation queued:', JSON.stringify(result, null, 2));
    console.log('Webhook URL:', options.webhook_url);
    
    // Log the specific fields we're looking for
    console.log('Queue result fields:', {
      request_id: result.request_id,
      status: result.status,
      status_url: result.status_url,
      queue_position: result.queue_position,
      // Log the entire result to see all fields
      full_result: result
    });
    
    return result;
  }

  // Otherwise use subscribe for sync processing with progress updates
  const result = await fal.subscribe(model_id, {
    input,
    logs: options?.logs ?? true,
    pollInterval: options?.poll_interval ?? 5000,
    onQueueUpdate: (update: FalQueueUpdate) => {
      console.log(`Video generation ${update.status}:`, update.progress || 0, '%');
      if (update.logs) {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  console.log('Video generation result:', JSON.stringify(result, null, 2));
  return result;
}

// TODO: Implement status check if webhook fails
// For now, rely on webhook for status updates
