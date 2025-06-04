import { fal } from "@fal-ai/client";

// Configure fal client with API key
fal.config({
  credentials: process.env.FAL_KEY
});

interface FalQueueUpdate {
  status: string;
  logs?: { message: string }[];
  progress?: number;
}

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
  } = {}
) {
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
  };
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
