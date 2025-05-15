"use client";

import React, { useState, useContext } from "react";
import { MpContext } from "../context/mp_context";
import { track } from "@vercel/analytics";
import Error_display from "./error_display";
import Image_grid from "./image_grid";

/**
 * ImageGenerator component allows users to enter a prompt and generate an image using the fal.ai API.
 * Follows snake_case for all identifiers.
 */
export default function Image_generator() {
  // State for the prompt input
  const [prompt_text, set_prompt_text] = useState("");
  // State for the generated image (base64)
  const [image_base64, set_image_base64] = useState<string[]>([]); // support grid
  // State for the Mana Points used
  const [mana_points_used, set_mana_points_used] = useState<number | null>(
    null
  );
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

  // State for aspect ratio slider (discrete, only supported ratios)
  const ASPECT_PRESETS = [
    { label: "1:2", ratio: 0.5 },
    { label: "9:16", ratio: 9 / 16 },
    { label: "2:3", ratio: 2 / 3 },
    { label: "3:4", ratio: 3 / 4 },
    { label: "5:6", ratio: 5 / 6 },
    { label: "1:1", ratio: 1 },
    { label: "6:5", ratio: 6 / 5 },
    { label: "4:3", ratio: 4 / 3 },
    { label: "3:2", ratio: 3 / 2 },
    { label: "16:9", ratio: 16 / 9 },
    { label: "2:1", ratio: 2 },
  ];
  // Slider value is the index
  const [aspect_index, set_aspect_index] = useState(5); // Default to 1:1

  // Get current preset
  const current_preset = ASPECT_PRESETS[aspect_index];
  const aspect_label = current_preset.label;
  const aspect = current_preset.ratio;

  // Only show buttons for 1:1, 3:4, 4:3
  const BUTTON_PRESETS = ASPECT_PRESETS
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.label === "1:1" || p.label === "3:4" || p.label === "4:3");

  // Calculate width and height for preview (fixed area, variable aspect)
  const PREVIEW_AREA = 1024 * 1024; // 1MP for preview
  const preview_width = Math.round(Math.sqrt(PREVIEW_AREA * aspect));
  const preview_height = Math.round(PREVIEW_AREA / preview_width);

  // Helper to set aspect ratio preset
  function set_aspect_preset_index(idx: number) {
    set_aspect_index(idx);
  }

  // Reset to 1:1
  function reset_aspect_index() {
    set_aspect_index(5);
  }

  // Helper to get pixel count and tokens for the selected aspect ratio
  function get_pixels(width: number, height: number) {
    return width * height;
  }
  function get_tokens_for_size(width: number, height: number) {
    // 1 token per 1MP, round up
    return Math.ceil(get_pixels(width, height) / 1_000_000);
  }

  // Get current dimensions and tokens based on aspect ratio
  const slider_width = preview_width;
  const slider_height = preview_height;
  const size_tokens_slider = get_tokens_for_size(slider_width, slider_height);

  // Filter models based on plan
  const available_models = MODEL_OPTIONS.filter((m) =>
    m.plans.includes(plan || "free")
  );

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
    track("Image Generation", {
      event: "click",
      model_id,
      plan,
      prompt_length: prompt_text.length,
      prompt_text: prompt_text.slice(0, 255), // limit to 255 chars for analytics
      aspect_ratio: aspect_label,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt_text,
          model_id,
          aspect_ratio: aspect_label,
          width: preview_width,
          height: preview_height,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }
      // Support grid: if data.image_base64 is an array, use it; else wrap in array
      set_image_base64(
        Array.isArray(data.image_base64)
          ? data.image_base64
          : [data.image_base64]
      );
      set_mana_points_used(data.mp_used ?? null);
      await refresh_mp();
    } catch (error: unknown) {
      if (error instanceof Error) {
        set_error_message(error.message || "An error occurred");
      } else {
        set_error_message("An error occurred");
      }
    } finally {
      set_is_loading(false);
    }
  };

  // Placeholder style for aspect ratio preview
  const placeholder_style = {
    width: `${preview_width / 8}px`, // Scale down for UI (e.g., 1024 -> 128px)
    height: `${preview_height / 8}px`,
    transition: "all 0.3s ease",
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-base-100 py-8 relative">
      {/* Sticky input and settings menu container */}
      <div className="w-full flex flex-col items-center z-30 sticky top-0 bg-base-100">
        {/* Prompt input */}
        <div className="w-full max-w-5xl mx-auto mb-0 flex items-center gap-2 py-2">
          <div className="flex items-center gap-2 flex-1 p-4 rounded-xl border border-base-200 bg-white shadow-sm">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h2l.4-1.2A2 2 0 017.3 4h9.4a2 2 0 011.9 1.8L19 7h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 0l2.293 2.293a1 1 0 001.414 0L12 5.414l5.293 5.293a1 1 0 001.414 0L21 7"
              />
            </svg>
            <input
              id="prompt_text"
              type="text"
              className="flex-1 bg-transparent outline-none text-lg text-gray-900 placeholder:text-gray-400"
              value={prompt_text}
              onChange={(e) => set_prompt_text(e.target.value)}
              placeholder="What will you imagine?"
              required
              aria-required="true"
              aria-label="Prompt for image generation"
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold shadow hover:bg-orange-600 transition"
              disabled={
                is_loading ||
                (typeof mana_points === "number" &&
                  mana_points < size_tokens_slider)
              }
              aria-busy={is_loading}
              onClick={handle_generate_image}
            >
              {is_loading ? "Generating..." : "Generate"}
            </button>
          </div>
          {/* Settings button */}
          <button
            type="button"
            className="btn btn-square ml-2 p-0 flex items-center justify-center tooltip border-2 border-orange-400 bg-white hover:bg-orange-50 text-orange-600 shadow focus:outline-none focus:ring-2 focus:ring-orange-400"
            data-tip={show_settings ? "Hide settings" : "Show settings"}
            aria-label={show_settings ? "Hide settings" : "Show settings"}
            aria-pressed={show_settings}
            tabIndex={0}
            onClick={() => set_show_settings((s) => !s)}
          >
            <svg
              className={`w-7 h-7 transition-transform duration-300 ${
                show_settings
                  ? "rotate-0 text-orange-500"
                  : "rotate-90 text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.34a1 1 0 0 0 .26-1.09l-1-1.73a1 1 0 0 1 0-.94l1-1.73a1 1 0 0 0-.26-1.09l-2-2a1 1 0 0 0-1.09-.26l-1.73 1a1 1 0 0 1-.94 0l-1.73-1a1 1 0 0 0-1.09.26l-2 2a1 1 0 0 0-.26 1.09l1 1.73a1 1 0 0 1 0 .94l-1 1.73a1 1 0 0 0 .26 1.09l2 2a1 1 0 0 0 1.09.26l1.73-1a1 1 0 0 1 .94 0l1.73 1a1 1 0 0 0 1.09-.26l2-2z"
              />
            </svg>
          </button>
        </div>

        {/* Main options card (settings) */}
        {show_settings && (
          <form
            onSubmit={handle_generate_image}
            className="w-full max-w-5xl mx-auto flex flex-col gap-6 z-30"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-base-200 p-8 flex flex-col gap-8">
              {/* Image Size section, updated to match Midjourney */}
              <div className="flex flex-col bg-white rounded-xl shadow border border-base-200 p-6 items-center relative w-full">
                <div className="text-2xl font-semibold text-gray-800 select-none mb-4 w-full text-center">
                  Image Size
                </div>
                {/* Flex row for preview and controls */}
                <div className="flex flex-col md:flex-row w-full items-center justify-center gap-8">
                  {/* Aspect ratio preview (placeholder) */}
                  <div className="flex flex-col items-center justify-center w-[250px]! h-[250px]!">
                    <div
                      className="border border-gray-200 rounded-md flex items-center justify-center bg-gray-50 w-[100px] h-[100px] flex-shrink-0  mx-6 my-2 p-4"
                      style={placeholder_style}
                    >
                      <span className="text-lg font-semibold text-gray-700">
                        {aspect_label}
                      </span>
                    </div>
                  </div>
                  {/* Preset buttons and slider */}
                  <div className="w-full max-w-md flex flex-col items-center gap-4 relative">
                    {/* Reset button in upper right */}
                    <button
                      type="button"
                      className="btn btn-outline btn-xs text-gray-600 hover:text-orange-500 absolute top-0 right-0 mt-2 mr-2 z-10"
                      onClick={reset_aspect_index}
                      aria-label="Reset image size"
                    >
                      Reset
                    </button>
                    {/* Preset buttons */}
                    <div className="flex justify-center gap-3 mb-2 w-full">
                      {BUTTON_PRESETS.map((preset) => (
                        <button
                          key={preset.index}
                          type="button"
                          className={`btn btn-sm rounded-full text-sm font-medium transition-all duration-150 ${
                            aspect_index === preset.index
                              ? "bg-orange-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                          onClick={() => set_aspect_preset_index(preset.index)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max={ASPECT_PRESETS.length - 1}
                      step="1"
                      value={aspect_index}
                      onChange={(e) => set_aspect_index(Number(e.target.value))}
                      className="w-full h-2 rounded-full bg-gray-200 appearance-none focus:outline-none accent-orange-500 cursor-pointer transition-all duration-300"
                      aria-label="Aspect ratio slider"
                    />
                    {/* Image size display */}
                    <div className="text-xs text-gray-500 mt-1">
                      {preview_width} × {preview_height} px
                    </div>
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div className="border-b border-gray-200 w-full"></div>
              {/* Bottom row: Model and More Options */}
              <div className="flex flex-col md:flex-row gap-8">
                {/* Model */}
                <div className="flex-1 bg-base-50 rounded-xl border border-base-200 shadow-sm p-6 flex flex-col gap-4">
                  <div className="font-semibold text-lg mb-2">Model</div>
                  <div className="w-full">
                    <select
                      className="select select-bordered w-full text-base font-medium bg-white border-base-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                      value={model_id}
                      onChange={(e) => set_model_id(e.target.value)}
                      disabled={is_loading}
                      aria-label="Select model"
                    >
                      {available_models.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
      {/* End sticky/menu container */}
      {/* Error message (always below menu/input) */}
      <Error_display error_message={error_message} />
      {/* Image grid display, full width, in a card (always below menu/input) */}
      <Image_grid image_base64={image_base64} prompt_text={prompt_text} mana_points_used={mana_points_used} />
      {/* Cost display at the bottom of the page */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="card bg-base-100 shadow-lg border border-orange-300 px-8 py-4 flex flex-row items-center gap-4">
          <span className="font-semibold text-gray-700">Current Cost:</span>
          <span className="font-mono text-lg text-orange-600">
            {size_tokens_slider}
          </span>
          <span className="text-sm text-gray-500">MP (Model × Size)</span>
        </div>
      </div>
    </div>
  );
}
