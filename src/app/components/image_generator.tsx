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
   const [image_base64, set_image_base64] = useState<string[]>([]); // support grid
  // State for the MP used
  const [mp_used, set_mp_used] = useState<number | null>(null);
  // Loading and error states
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const { refresh_mp, plan, mp_tokens } = useContext(MpContext);

  // State for model selection
  const [model_id, set_model_id] = useState<string>("fal-ai/flux/schnell");
  const [aspect_ratio, set_aspect_ratio] = useState<string>('square');

  const MODEL_OPTIONS = [
    {
      value: "fal-ai/flux/schnell",
      label: "FLUX.1 [schnell]",
      cost: 1,
      plans: ["free", "standard"],
    },
    {
      value: "fal-ai/flux/dev",
      label: "FLUX.1 [dev]",
      cost: 8,
      plans: ["standard"],
    },
    {
      value: "fal-ai/flux/pro",
      label: "FLUX.1 [pro]",
      cost: 17,
      plans: ["standard"],
    },
  ];

  const ASPECT_OPTIONS = [
    { value: 'portrait_4_3', label: 'Portrait 4:3', width: 800, height: 1066 },
    { value: 'portrait_16_9', label: 'Portrait 16:9', width: 896, height: 1600 },
    { value: 'square', label: 'Square', width: 1024, height: 1024 },
    { value: 'square_hd', label: 'Square HD', width: 1536, height: 1536 },
    { value: 'landscape_4_3', label: 'Landscape 4:3', width: 1066, height: 800 },
    { value: 'landscape_16_9', label: 'Landscape 16:9', width: 1600, height: 896 },
  ];

  // Helper to get cost for selected model
  const get_model_cost = (model_id: string) => {
    const model = MODEL_OPTIONS.find(m => m.value === model_id);
    return model ? model.cost : 1;
  };

  // Filter models based on plan
  const available_models = MODEL_OPTIONS.filter(m => m.plans.includes(plan || "free"));

  // Add a helper to get pixel count and tokens for each aspect ratio
  function get_pixels(width: number, height: number) {
    return width * height;
  }
  function get_tokens_for_size(width: number, height: number) {
    // 1 token per 1MP, round up
    return Math.ceil(get_pixels(width, height) / 1_000_000);
  }

  // Helper to get selected aspect option
  const selected_aspect = ASPECT_OPTIONS.find(opt => opt.value === aspect_ratio) || ASPECT_OPTIONS[2];
  const size_tokens = get_tokens_for_size(selected_aspect.width, selected_aspect.height);
  const total_cost = get_model_cost(model_id) * size_tokens;

  // Handler for generating the image
  const handle_generate_image = async (e: React.FormEvent) => {
    e.preventDefault();
    set_is_loading(true);
    set_error_message(null);
    set_image_base64([]);
    set_mp_used(null);

    // Track the image generation event with as much relevant info as possible
    track('Image Generation', {
      event: 'click',
      model_id,
      plan,
      prompt_length: prompt_text.length,
      prompt_text: prompt_text.slice(0, 255), // limit to 255 chars for analytics
      aspect_ratio,
      timestamp: new Date().toISOString(),
      // user_id: add if available from context or props
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt_text,
          model_id,
          aspect_ratio,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      // Support grid: if data.image_base64 is an array, use it; else wrap in array
      set_image_base64(Array.isArray(data.image_base64) ? data.image_base64 : [data.image_base64]);
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
    <div className="bg-white p-6 shadow-md rounded-lg max-w-4xl mx-auto mt-8">
      <form onSubmit={handle_generate_image} className="flex flex-col gap-6">
        {/* Prompt input bar */}
        <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md w-full bg-gray-50">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2l.4-1.2A2 2 0 017.3 4h9.4a2 2 0 011.9 1.8L19 7h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 0l2.293 2.293a1 1 0 001.414 0L12 5.414l5.293 5.293a1 1 0 001.414 0L21 7" /></svg>
          <input
            id="prompt_text"
            type="text"
            className="flex-1 bg-transparent outline-none text-base"
            value={prompt_text}
            onChange={e => set_prompt_text(e.target.value)}
            placeholder="What will you imagine?"
            required
            aria-required="true"
            aria-label="Prompt for image generation"
          />
        </div>
        {/* Model selection toggle buttons */}
        <div className="flex gap-2">
          {available_models.map(model => (
            <button
              type="button"
              key={model.value}
              className={`btn btn-sm ${model_id === model.value ? 'bg-orange-500 text-white' : 'btn-outline'}`}
              onClick={() => set_model_id(model.value)}
              disabled={is_loading}
            >
              {model.label} <span className="ml-1">({model.cost} token{model.cost > 1 ? 's' : ''})</span>
            </button>
          ))}
        </div>
        {/* Aspect ratio radio buttons */}
        <div>
          <span className="font-semibold">Image Size</span>
          <div className="flex gap-4 mt-2 flex-wrap">
            {ASPECT_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="aspect_ratio"
                  value={opt.value}
                  checked={aspect_ratio === opt.value}
                  onChange={() => set_aspect_ratio(opt.value)}
                  className="radio radio-primary"
                  disabled={is_loading}
                />
                <span>{opt.label} <span className="text-xs text-gray-400">({opt.width}×{opt.height}, {get_tokens_for_size(opt.width, opt.height)} token{get_tokens_for_size(opt.width, opt.height) > 1 ? 's' : ''})</span></span>
              </label>
            ))}
          </div>
        </div>
        {/* Token/cost display */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Your tokens: <span className="font-mono">{typeof mp_tokens === 'number' ? mp_tokens : '--'}</span></span>
          <span>Cost: <span className="font-mono">{total_cost}</span> token{total_cost > 1 ? 's' : ''} (model × size)</span>
        </div>
        {/* Generate button */}
        <button
          type="submit"
          className="btn btn-primary bg-orange-500 hover:bg-orange-600 w-full"
          disabled={is_loading || (typeof mp_tokens === 'number' && mp_tokens < total_cost)}
          aria-busy={is_loading}
        >
          {is_loading ? 'Generating...' : 'Generate Image'}
        </button>
        {/* Loading spinner */}
        {is_loading && (
          <div className="flex justify-center mt-2">
            <span className="loading loading-spinner loading-md text-orange-500"></span>
          </div>
        )}
        {error_message && (
          <div className="alert alert-error mt-4">{error_message}</div>
        )}
      </form>
      {/* Image grid display */}
      {image_base64.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          {image_base64.map((img, idx) => (
            <div key={idx} className="card bg-base-100 shadow-lg rounded-lg flex flex-col items-center">
              <Image
                src={`data:image/png;base64,${img}`}
                alt="Generated visual"
                className="rounded-lg border shadow-md max-w-full h-auto"
                width={256}
                height={256}
                unoptimized
                priority
              />
              <div className="text-sm text-gray-600 mt-2 text-center">
                {prompt_text}<br />
                {mp_used !== null && <span className="font-mono">MP used: {mp_used}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 