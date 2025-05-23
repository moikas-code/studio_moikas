import { fal } from "@ai-sdk/fal";
import { experimental_generateImage as generateImage } from "ai";

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
  } = {}
) {
  const size = `${width}x${height}` as `${number}x${number}`;
  //build sana options
  const sana_options = {
    ...(options.seed !== undefined && { seed: options.seed }),
    providerOptions: {
      ...(options.negative_prompt !== undefined && {
        negative_prompt: options.negative_prompt,
      }),
      ...(options.num_inference_steps !== undefined && {
        num_inference_steps: options.num_inference_steps,
      }),

      ...(options.guidance_scale !== undefined && {
        guidance_scale: options.guidance_scale,
      }),
      ...(options.style_name !== undefined && {
        style_name: options.style_name,
      }),
    },
  };
  // Build payload
  const payload = {
    model: fal.image(model_id),
    prompt,
    size,
    ...(model_id === "fal-ai/sana" ? sana_options : {}),
  };
  const { image } = await generateImage(
    payload as Parameters<typeof generateImage>[0]
  );
  return image;
}
