import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage } from 'ai';

// Accept extra options for fal-ai/sana
export async function generate_flux_image(
  prompt: string,
  width = 1024,
  height = 1024,
  model_id = 'fal-ai/flux/dev',
  options: {
    negative_prompt?: string;
    num_inference_steps?: number;
    seed?: number;
    style_name?: string;
  } = {}
) {
  const size = `${width}x${height}` as `${number}x${number}`;
  // Build payload
  const payload = {
    model: fal.image(model_id),
    prompt,
    size,
    ...(model_id === 'fal-ai/sana' && {
      ...(options.negative_prompt ? { negative_prompt: options.negative_prompt } : {}),
      ...(options.num_inference_steps ? { num_inference_steps: options.num_inference_steps } : {}),
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
      ...(options.style_name ? { style_name: options.style_name } : {}),
    }),
  };
  const { image } = await generateImage(payload as Parameters<typeof generateImage>[0]);
  return image;
} 