"use client";

import React, { useState, useContext } from "react";
import Image from "next/image";
import { MpContext } from "../context/mp_context";
import { track } from '@vercel/analytics';

/**
 * ImageGenerator component allows users to enter a prompt and generate an image using the fal.ai API.
 * Follows snake_case for all identifiers.
 */
export default function Image_generator() {
  // State for the prompt input
  const [prompt_text, set_prompt_text] = useState('');
  // State for the generated image (base64)
  const [image_base64, set_image_base64] = useState<string | null>(null);
  // State for the MP used
  const [mp_used, set_mp_used] = useState<number | null>(null);
  // Loading and error states
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const { refresh_mp, plan, mp_tokens } = useContext(MpContext);

  // State for model selection
  const [model_id, set_model_id] = useState<string>("fal-ai/flux/schnell");

  const MODEL_OPTIONS = [
    {
      value: "fal-ai/flux/schnell",
      label: "FLUX.1 [schnell] (fast, lower cost)",
      cost: 1,
      plans: ["free", "standard"],
    },
    {
      value: "fal-ai/flux/dev",
      label: "FLUX.1 [dev] (high quality)",
      cost: 8,
      plans: ["standard"],
    },
    {
      value: "fal-ai/flux/pro",
      label: "FLUX.1 [pro] (premium)",
      cost: 17,
      plans: ["standard"],
    },
  ];

  // Helper to get cost for selected model
  const get_model_cost = (model_id: string) => {
    const model = MODEL_OPTIONS.find(m => m.value === model_id);
    return model ? model.cost : 1;
  };

  // Filter models based on plan
  const available_models = MODEL_OPTIONS.filter(m => m.plans.includes(plan || "free"));

  // Handler for generating the image
  const handle_generate_image = async (e: React.FormEvent) => {
    e.preventDefault();
    set_is_loading(true);
    set_error_message(null);
    set_image_base64(null);
    set_mp_used(null);

    // Track the image generation event with as much relevant info as possible
    track('Image Generation', {
      event: 'click',
      model_id,
      plan,
      prompt_length: prompt_text.length,
      prompt_text: prompt_text.slice(0, 255), // limit to 255 chars for analytics
      timestamp: new Date().toISOString(),
      // user_id: add if available from context or props
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt_text, model_id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      set_image_base64(data.image_base64);
      set_mp_used(data.mp_used ?? null);
      await refresh_mp();
    } catch (error: unknown) {
      if (error instanceof Error) {
        set_error_message(error.message || 'An error occurred');
      } else {
        set_error_message('An error occurred');
      }
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6 bg-base-200 rounded-lg shadow-lg">
      <form onSubmit={handle_generate_image} className="flex flex-col gap-4" aria-label="Image generation form">
        <label htmlFor="prompt_text" className="font-semibold">Enter your prompt:</label>
        <input
          id="prompt_text"
          type="text"
          className="input input-bordered w-full"
          value={prompt_text}
          onChange={e => set_prompt_text(e.target.value)}
          placeholder="Describe your image..."
          required
          aria-required="true"
          aria-label="Prompt for image generation"
        />
        {/* Show model options and costs for the user's plan */}
        <div>
          <label htmlFor="model_id" className="font-semibold">Choose model:</label>
          <select
            id="model_id"
            className="select select-bordered w-full mt-1"
            value={model_id}
            onChange={e => set_model_id(e.target.value)}
            disabled={is_loading}
            aria-label="Select image generation model"
          >
            {available_models.map(model => (
              <option key={model.value} value={model.value}>
                {model.label} — {model.cost} token{model.cost > 1 ? 's' : ''} per image
              </option>
            ))}
          </select>
        </div>
        {/* Show user's token balance and cost for selected model */}
        <div className="text-sm mt-1">
          <span className="font-mono">Your tokens: {typeof mp_tokens === 'number' ? mp_tokens : '--'}</span>
          <br />
          <span>Cost for this image: <span className="font-mono">{get_model_cost(model_id)}</span> token{get_model_cost(model_id) > 1 ? 's' : ''}</span>
          {typeof mp_tokens === 'number' && mp_tokens < get_model_cost(model_id) && (
            <div className="text-error mt-1">Not enough tokens for this model.</div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={is_loading || (typeof mp_tokens === 'number' && mp_tokens < get_model_cost(model_id))}
          aria-busy={is_loading}
        >
          {is_loading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>
      {error_message && (
        <div className="alert alert-error mt-4">{error_message}</div>
      )}
      {image_base64 && (
        <div className="mt-6 flex flex-col items-center">
          <Image
            src={`data:image/png;base64,${image_base64}`}
            alt="Generated visual"
            className="rounded-lg border shadow-md max-w-full h-auto"
            width={512}
            height={512}
            unoptimized
            priority
          />
          {mp_used !== null && (
            <div className="mt-2 text-xs text-primary font-mono">MP used: {mp_used}</div>
          )}
        </div>
      )}
    </div>
  );
} 