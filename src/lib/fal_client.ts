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

// Generate image using Stable Diffusion models with LoRA support
export async function generate_sd_lora_image(
  prompt: string,
  width = 1024,
  height = 1024,
  model_id: string,
  options: {
    negative_prompt?: string;
    num_inference_steps?: number;
    seed?: number;
    guidance_scale?: number;
    scheduler?: string;
    loras?: Array<{ path: string; scale?: number }>;
    embeddings?: Array<{ path: string; tokens?: string[] }>;
    controlnets?: Array<{ 
      path: string; 
      condition_image?: string;
      strength?: number;
      start?: number;
      end?: number;
    }>;
    num_images?: number;
    enable_safety_checker?: boolean;
    expand_prompt?: boolean;
    format?: 'jpeg' | 'png';
    clip_skip?: number;
    prompt_strength?: number;
    image_url?: string; // For img2img
    image_strength?: number; // For img2img
    model_name?: string; // For custom HuggingFace models with fal-ai/lora
  } = {}
) {
  // Ensure FAL_KEY is set before attempting to generate
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required for image generation');
  }

  // Build the input object for Stable Diffusion models
  const input: Record<string, unknown> = {
    prompt,
    image_size: { width, height },
    ...(options.model_name !== undefined && {
      model_name: options.model_name,
    }),
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
    ...(options.scheduler !== undefined && { scheduler: options.scheduler }),
    ...(options.num_images !== undefined && { num_images: options.num_images }),
    ...(options.enable_safety_checker !== undefined && { 
      enable_safety_checker: options.enable_safety_checker 
    }),
    ...(options.expand_prompt !== undefined && { 
      expand_prompt: options.expand_prompt 
    }),
    ...(options.format !== undefined && { 
      format: options.format 
    }),
    ...(options.clip_skip !== undefined && { 
      clip_skip: options.clip_skip 
    }),
    ...(options.prompt_strength !== undefined && { 
      prompt_strength: options.prompt_strength 
    }),
    // Image-to-image parameters
    ...(options.image_url !== undefined && { 
      image_url: options.image_url 
    }),
    ...(options.image_strength !== undefined && { 
      strength: options.image_strength 
    }),
    // LoRA weights
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
    // Embeddings
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
    // ControlNet
    ...(options.controlnets !== undefined && options.controlnets.length > 0 && { 
      controlnets: options.controlnets.filter(c => c && c.path)
    }),
  };

  console.log('[fal.ai SD] Sending request to model:', model_id);
  console.log('[fal.ai SD] Input payload:', JSON.stringify(input, null, 2));
  
  try {
    const result = await fal.subscribe(model_id, {
      input,
      logs: true,
      onQueueUpdate: (update: FalQueueUpdate) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    console.log('Fal.ai SD raw result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Stable Diffusion generation error:', error);
    if (error && typeof error === 'object' && 'body' in error) {
      console.error('Error body:', JSON.stringify((error as {body: unknown}).body, null, 2));
    }
    if (error && typeof error === 'object' && 'status' in error && (error as {status: number}).status === 422) {
      console.error('Validation error - request format is incorrect');
      console.error('Sent model_id:', model_id);
      console.error('Sent input:', JSON.stringify(input, null, 2));
    }
    throw error;
  }
}

// TODO: Implement status check if webhook fails
// For now, rely on webhook for status updates
