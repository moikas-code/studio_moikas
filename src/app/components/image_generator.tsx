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
  // State for the Mana Points used
  const [mana_points_used, set_mana_points_used] = useState<number | null>(null);
  // Loading and error states
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const { refresh_mp, plan, mp_tokens: mana_points } = useContext(MpContext);

  // State for model selection
  const [model_id, set_model_id] = useState<string>("fal-ai/flux/schnell");

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

  // Add new state for slider value and aspect
  const ASPECT_PRESETS = [
    { label: 'Portrait', value: 'portrait', ratio: 3 / 4 },
    { label: 'Square', value: 'square', ratio: 1 },
    { label: 'Landscape', value: 'landscape', ratio: 4 / 3 },
  ];
  const SLIDER_MIN = 0.5; // 1:2
  const SLIDER_MAX = 2;   // 2:1
  const SLIDER_STEP = 0.01;

  const [aspect_slider, set_aspect_slider] = React.useState(1); // 1:1 default

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

  // Helper to get width/height from slider
  function get_dimensions_from_slider(slider_value: number) {
    // Always use 1024 as the "short" side for cost calculation
    if (slider_value === 1) return { width: 1024, height: 1024 };
    if (slider_value > 1) return { width: Math.round(1024 * slider_value), height: 1024 };
    return { width: 1024, height: Math.round(1024 / slider_value) };
  }
  const { width: slider_width, height: slider_height } = get_dimensions_from_slider(aspect_slider);

  // Update cost calculation to use slider_width/slider_height
  const size_tokens_slider = get_tokens_for_size(slider_width, slider_height);

  // Helper to set slider to preset
  function set_aspect_preset(preset: string) {
    if (preset === 'portrait') set_aspect_slider(0.75); // 3:4
    else if (preset === 'square') set_aspect_slider(1);
    else if (preset === 'landscape') set_aspect_slider(4 / 3);
  }

  // State for showing/hiding settings
  const [show_settings, set_show_settings] = useState(false);

  // Handler for generating the image
  const handle_generate_image = async (e: React.FormEvent) => {
    e.preventDefault();
    set_is_loading(true);
    set_error_message(null);
    set_image_base64([]);
    set_mana_points_used(null);

    // Track the image generation event with as much relevant info as possible
    track('Image Generation', {
      event: 'click',
      model_id,
      plan,
      prompt_length: prompt_text.length,
      prompt_text: prompt_text.slice(0, 255), // limit to 255 chars for analytics
      aspect_ratio: 'square',
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
          aspect_ratio: 'square',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      // Support grid: if data.image_base64 is an array, use it; else wrap in array
      set_image_base64(Array.isArray(data.image_base64) ? data.image_base64 : [data.image_base64]);
      set_mana_points_used(data.mp_used ?? null);
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
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-base-100 py-8">
      {/* Prompt input */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 p-4 rounded-xl border border-base-200 bg-white shadow-sm">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2l.4-1.2A2 2 0 017.3 4h9.4a2 2 0 011.9 1.8L19 7h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 0l2.293 2.293a1 1 0 001.414 0L12 5.414l5.293 5.293a1 1 0 001.414 0L21 7" /></svg>
          <input
            id="prompt_text"
            type="text"
            className="flex-1 bg-transparent outline-none text-lg text-gray-900 placeholder:text-gray-400"
            value={prompt_text}
            onChange={e => set_prompt_text(e.target.value)}
            placeholder="What will you imagine?"
            required
            aria-required="true"
            aria-label="Prompt for image generation"
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold shadow hover:bg-orange-600 transition"
            disabled={is_loading || (typeof mana_points === 'number' && mana_points < size_tokens_slider)}
            aria-busy={is_loading}
          >
            {is_loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {/* Settings button */}
        <button
          type="button"
          className="btn btn-square ml-2 p-0 flex items-center justify-center tooltip border-2 border-orange-400 bg-white hover:bg-orange-50 text-orange-600 shadow focus:outline-none focus:ring-2 focus:ring-orange-400"
          data-tip={show_settings ? 'Hide settings' : 'Show settings'}
          aria-label={show_settings ? 'Hide settings' : 'Show settings'}
          aria-pressed={show_settings}
          tabIndex={0}
          onClick={() => set_show_settings(s => !s)}
        >
          {/* Inline SVG for cog icon */}
          <svg className={`w-7 h-7 transition-transform duration-300 ${show_settings ? 'rotate-0 text-orange-500' : 'rotate-90 text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.34a1 1 0 0 0 .26-1.09l-1-1.73a1 1 0 0 1 0-.94l1-1.73a1 1 0 0 0-.26-1.09l-2-2a1 1 0 0 0-1.09-.26l-1.73 1a1 1 0 0 1-.94 0l-1.73-1a1 1 0 0 0-1.09.26l-2 2a1 1 0 0 0-.26 1.09l1 1.73a1 1 0 0 1 0 .94l-1 1.73a1 1 0 0 0 .26 1.09l2 2a1 1 0 0 0 1.09.26l1.73-1a1 1 0 0 1 .94 0l1.73 1a1 1 0 0 0 1.09-.26l2-2z" />
          </svg>
        </button>
      </div>
      {/* Main options card (settings) */}
      {show_settings && (
        <form onSubmit={handle_generate_image} className="w-full max-w-5xl mx-auto flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-base-200 p-8 flex flex-col gap-8">
            {/* Image Size section, visually matching the provided reference */}
            <div className="flex flex-col md:flex-row gap-8 bg-white rounded-xl shadow border border-base-200 p-8 items-center justify-center relative">
              {/* Section title and Reset */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl font-semibold text-gray-800 select-none">Image Size</div>
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-orange-500 text-base font-medium focus:outline-none"
                onClick={() => set_aspect_slider(1)}
                tabIndex={0}
                aria-label="Reset image size"
              >
                Reset
              </button>
              {/* Aspect ratio preview */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-72 h-72">
                <div className="flex items-center justify-center w-full h-full">
                  <div className="border-4 border-gray-500 rounded-2xl w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-semibold text-gray-700 select-none">
                      {aspect_slider === 1 ? '1 : 1' : aspect_slider < 1 ? `1 : ${(1 / aspect_slider).toFixed(0)}` : `${aspect_slider.toFixed(0)} : 1`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Controls */}
              <div className="flex-1 flex flex-col items-center w-full">
                {/* Preset buttons centered above slider */}
                <div className="flex gap-8 mb-6 w-full justify-center">
                  {ASPECT_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`px-10 py-4 rounded-full text-xl font-semibold border-2 transition-all duration-150 shadow-sm focus:outline-none ${Math.abs(aspect_slider - preset.ratio) < 0.01 ? 'bg-orange-100 text-orange-600 border-orange-400' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-orange-50 hover:border-orange-300'}`}
                      onClick={() => set_aspect_preset(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {/* Slider with custom thumb and dynamic fill */}
                <div className="relative w-full max-w-2xl flex flex-col items-center">
                  <input
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={SLIDER_STEP}
                    value={aspect_slider}
                    onChange={e => set_aspect_slider(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-gray-200 appearance-none focus:outline-none mb-2"
                    style={{ accentColor: aspect_slider === 1 ? '#fbbf24' : '#374151' }}
                    aria-label="Aspect ratio slider"
                  />
                  {/* Slider labels below, perfectly aligned */}
                  <div className="flex justify-between w-full text-lg font-medium text-gray-400 select-none px-2">
                    {[0.5, 0.75, 1, 1.33, 2].map((val) => (
                      <span key={val} className={Math.abs(aspect_slider - val) < 0.01 ? 'text-orange-500 font-bold' : ''}>
                        {val === 0.5 ? '1:2' : val === 0.75 ? '3:4' : val === 1 ? '1:1' : val === 1.33 ? '4:3' : '2:1'}
                      </span>
                    ))}
                  </div>
                  {/* Pixel dimensions below, centered under thumb */}
                  <div className="w-full flex justify-center mt-2">
                    <span className="text-base text-gray-400">{slider_width} × {slider_height} px</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom row: Model and More Options */}
            <div className="flex flex-col md:flex-row gap-8">
              {/* Model */}
              <div className="flex-1 bg-base-50 rounded-xl border border-base-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="font-semibold text-lg mb-2">Model</div>
                <div className="w-full">
                  <select
                    className="select select-bordered w-full text-base font-medium bg-white border-base-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                    value={model_id}
                    onChange={e => set_model_id(e.target.value)}
                    disabled={is_loading}
                    aria-label="Select model"
                  >
                    {available_models.map(model => (
                      <option key={model.value} value={model.value}>{model.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Error message */}
          {error_message && (
            <div className="alert alert-error border border-error bg-error/10 text-error font-bold shadow-lg mt-4">{error_message}</div>
          )}
        </form>
      )}
      {/* Image grid display, full width, in a card */}
      {image_base64.length > 0 && (
        <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-xl border border-base-200 shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {image_base64.map((img, idx) => (
              <div key={idx} className="flex flex-col items-center border border-base-200 rounded-lg bg-base-100 p-2">
                <Image
                  src={`data:image/png;base64,${img}`}
                  alt="Generated item"
                  className="rounded-lg max-w-full h-auto"
                  width={256}
                  height={256}
                  unoptimized
                  priority
                />
                <div className="text-xs text-gray-500 mt-2 text-center">
                  <span className="italic">{prompt_text}</span><br />
                  {mana_points_used !== null && <span className="font-mono">Mana Points used: {mana_points_used}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Cost display at the bottom of the page */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="card bg-base-100 shadow-lg border border-orange-300 px-8 py-4 flex flex-row items-center gap-4">
          <span className="font-semibold text-gray-700">Current Cost:</span>
          <span className="font-mono text-lg text-orange-600">{size_tokens_slider}</span>
          <span className="text-sm text-gray-500">MP (Model × Size)</span>
        </div>
      </div>
    </div>
  );
} 