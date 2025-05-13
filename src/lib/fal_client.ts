import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage } from 'ai';

export async function generate_flux_image(prompt: string, width = 1024, height = 1024) {
  const size = `${width}x${height}` as `${number}x${number}`;
  const { image } = await generateImage({
    model: fal.image('fal-ai/flux-lora'), // FLUX.1 [dev] model
    prompt,
    size,
  });
  return image;
} 