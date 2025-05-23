"use client";

import React, { useState, useContext, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from "react";
import { MpContext } from "../context/mp_context";
import { get_tokens_for_size, MODEL_OPTIONS, add_overlay_to_image } from "../../lib/generate_helpers";
import { track } from "@vercel/analytics";
import Error_display from "./error_display";
import { Brush, ChefHat, SendHorizontal, Sparkles } from "lucide-react";
import ImageGenerationReceipt from "./ImageGenerationReceipt";

/**
 * ImageGenerator component allows users to enter a prompt and generate an image using the fal.ai API.
 * Follows snake_case for all identifiers.
 */
export default function Image_generator() {
  // State for the prompt input
  const [prompt_text, set_prompt_text] = useState("");
  // State for Image Prompt Description
  const [prompt_description, set_prompt_description] = useState("");
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
  const [model_id, set_model_id] = useState<string>(
    "fal-ai/sana"
  );

  // State for aspect ratio slider (discrete, only supported ratios)
  const ASPECT_PRESETS = useMemo(() => [
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
  ], []);
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

  // Loading state for prompt enhancement
  const [is_enhancing, set_is_enhancing] = useState(false);

  // Ref for the textarea to auto-expand
  const prompt_textarea_ref = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea on value or window resize
  useEffect(() => {
    const textarea = prompt_textarea_ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
    // Handler for window resize
    const handle_resize = () => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    };
    window.addEventListener('resize', handle_resize);
    return () => window.removeEventListener('resize', handle_resize);
  }, [prompt_text]);

  // Handler for textarea change with auto-resize
  const handle_prompt_text_change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    set_prompt_text(e.target.value);
  };

  // Track enhancement usage
  const [enhancement_count, set_enhancement_count] = useState(0);
  const [backend_cost, set_backend_cost] = useState<number | null>(null);

  // Store last used settings for redo/reuse
  const [last_generation, set_last_generation] = useState<Record<string, unknown> | null>(null);

  // Add at the top, after other useState hooks
  const SANA_STYLE_OPTIONS = [
    "(No style)",
    "Cinematic",
    "Photographic",
    "Anime",
    "Manga",
    "Digital Art",
    "Pixel art",
    "Fantasy art",
    "Neonpunk",
    "3D Model",
  ];
  const [num_inference_steps, set_num_inference_steps] = useState(18);
  const [seed, set_seed] = useState(() => Math.floor(Math.random() * 1000000));
  const [style_name, set_style_name] = useState("(No style)");

  // Helper to parse negative prompt from --no or --n
  function extract_negative_prompt(prompt: string): { prompt: string; negative_prompt: string } {
    const regex = /\s--(?:no|n)\s+([^\-][^\n]*)/i;
    const match = prompt.match(regex);
    if (match) {
      const negative_prompt = match[1].trim();
      // Remove the --no/--n part from the prompt
      const cleaned_prompt = prompt.replace(regex, "").trim();
      return { prompt: cleaned_prompt, negative_prompt };
    }
    return { prompt, negative_prompt: "" };
  }

  // Handler for generating the image
  const handle_generate_image = useCallback(
    async (e: React.FormEvent, custom?: { prompt: string, model: string, aspect: number, enhance: number }) => {
      e.preventDefault();
      set_show_settings(false); // Auto-hide options
      set_is_loading(true);
      set_error_message(null);
      set_image_base64([]);
      set_mana_points_used(null);
      set_backend_cost(null);

      // Use custom values if provided (for redo), else current state
      const used_prompt = custom?.prompt ?? prompt_text;
      const used_model = custom?.model ?? model_id;
      const used_aspect = custom?.aspect ?? aspect_index;
      const used_enhance = custom?.enhance ?? enhancement_count;
      const used_aspect_label = ASPECT_PRESETS[used_aspect].label;
      const used_aspect_ratio = ASPECT_PRESETS[used_aspect].ratio;
      const used_width = Math.round(Math.sqrt(PREVIEW_AREA * used_aspect_ratio));
      const used_height = Math.round(PREVIEW_AREA / used_width);

      // Track the image generation event with as much relevant info as possible
      track("Image Generation", {
        event: "click",
        model_id: used_model,
        plan,
        prompt_length: used_prompt.length,
        prompt_text: used_prompt.slice(0, 255),
        aspect_ratio: used_aspect_label,
        timestamp: new Date().toISOString(),
      });

      try {
        const { prompt: parsed_prompt, negative_prompt } =
          used_model === "fal-ai/sana"
            ? extract_negative_prompt(used_prompt)
            : { prompt: used_prompt, negative_prompt: "" };
        const payload = {
          prompt: parsed_prompt,
          model_id: used_model,
          aspect_ratio: used_aspect_label,
          width: used_width,
          height: used_height,
          enhancement_mp: used_enhance,
          ...(used_model === "fal-ai/sana" && {
            negative_prompt,
            num_inference_steps,
            seed,
            style_name,
          }),
        };
        console.log('Sending to /api/generate:', payload);
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }
        let images = Array.isArray(data.image_base64)
          ? data.image_base64
          : [data.image_base64];
        // Apply overlay for free users
        if (plan === 'free') {
          images = await Promise.all(images.map((img: string) => add_overlay_to_image(img)));
        }
        set_image_base64(images);
        set_prompt_description(used_prompt ?? "");
        set_mana_points_used(data.mp_used ?? null);
        set_backend_cost(data.enhancement_mp ?? null);
        await refresh_mp();
        // Reset prompt and enhancement count after generation
        set_prompt_text("");
        set_enhancement_count(0);
        // Store last generation settings
        set_last_generation({
          prompt_text: used_prompt,
          model_id: used_model,
          aspect_index: used_aspect,
          enhancement_count: used_enhance,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          set_error_message(error.message || "An error occurred");
        } else {
          set_error_message("An error occurred");
        }
      } finally {
        set_is_loading(false);
      }
    },
    [aspect_index, enhancement_count, model_id, plan, PREVIEW_AREA, prompt_text, refresh_mp, set_enhancement_count, set_error_message, set_image_base64, set_is_loading, set_mana_points_used, set_prompt_description, set_show_settings, set_last_generation, ASPECT_PRESETS, num_inference_steps, seed, style_name]
  );

  // Redo: re-run generation with last settings
  const handle_redo = useCallback(() => {
    if (!last_generation) return;
    handle_generate_image(new Event('submit') as unknown as React.FormEvent, {
      prompt: last_generation.prompt_text as string,
      model: last_generation.model_id as string,
      aspect: last_generation.aspect_index as number,
      enhance: last_generation.enhancement_count as number,
    });
  }, [last_generation, handle_generate_image]);

  // Reuse: copy prompt/settings to input and show settings
  const handle_reuse = useCallback(() => {
    if (!last_generation) return;
    set_prompt_text(last_generation.prompt_text as string);
    set_model_id(last_generation.model_id as string);
    set_aspect_index(last_generation.aspect_index as number);
    set_enhancement_count(last_generation.enhancement_count as number);
    set_show_settings(true);
  }, [last_generation]);

  // Handler for enhancing the prompt
  const handle_enhance_prompt = useCallback(
    async () => {
      if (!prompt_text || !prompt_text.trim()) return;
      set_is_enhancing(true);
      set_error_message(null);
      try {
        track("Enhance Prompt", {
          event: "click",
          plan,
          prompt_length: prompt_text.length,
          prompt_text: prompt_text.slice(0, 255),
          timestamp: new Date().toISOString(),
        });
        const response = await fetch("/api/enhance-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt_text }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to enhance prompt");
        }
        set_prompt_text(data.enhanced_prompt || prompt_text);
        set_enhancement_count((c) => c + 1);
      } catch (error: unknown) {
        if (error instanceof Error) {
          set_error_message(error.message || "An error occurred");
        } else {
          set_error_message("An error occurred");
        }
      } finally {
        set_is_enhancing(false);
        await refresh_mp();
      }
    },
    [plan, prompt_text, refresh_mp, set_enhancement_count, set_error_message, set_is_enhancing, set_prompt_text]
  );

  // Placeholder style for aspect ratio preview
  const placeholder_style = {
    width: `${preview_width / 8}px`, // Scale down for UI (e.g., 1024 -> 128px)
    height: `${preview_height / 8}px`,
    transition: "all 0.3s ease",
  };

  // Cost breakdown for receipt (from backend)
  const get_costs = () => {
    if (backend_cost) {
      // Only include enhancement_mp if it was used
      const enhancement_mp = backend_cost > 0 ? backend_cost : 0;
      return {
        enhancement_mp,
        images: [
          {
            model: MODEL_OPTIONS.find((m) => m.value === model_id)?.label || model_id,
            width: preview_width,
            height: preview_height,
            mp: mana_points_used ?? 0,
          },
        ],
        total_mp: enhancement_mp + (mana_points_used || 0),
      };
    }
    // fallback to local calculation if backend_cost is not set
    // Only include enhancement_mp if it was used
    const enhancement_mp = enhancement_count > 0 ? enhancement_count : 0;
    return {
      enhancement_mp,
      images: image_base64.map(() => ({
        model: MODEL_OPTIONS.find((m) => m.value === model_id)?.label || model_id,
        width: preview_width,
        height: preview_height,
        mp: get_tokens_for_size(preview_width, preview_height),
      })),
      total_mp:
        enhancement_mp + image_base64.length * get_tokens_for_size(preview_width, preview_height),
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handle_keydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!is_loading && prompt_text.trim()) {
          handle_generate_image(new Event('submit') as unknown as React.FormEvent);
        }
      } else if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        set_prompt_text("");
      } else if (e.ctrlKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (!is_enhancing && prompt_text.trim() && !is_loading) {
          handle_enhance_prompt();
        }
      }
    }
    window.addEventListener('keydown', handle_keydown);
    return () => window.removeEventListener('keydown', handle_keydown);
  }, [prompt_text, is_loading, is_enhancing, handle_enhance_prompt, handle_generate_image]);

  // Ref for the prompt input container
  const prompt_input_ref = useRef<HTMLDivElement>(null);
  const [prompt_input_height, set_prompt_input_height] = useState(0);

  // Measure the height of the prompt input container
  useLayoutEffect(() => {
    if (prompt_input_ref.current) {
      set_prompt_input_height(prompt_input_ref.current.offsetHeight);
    }
  }, [prompt_text]); // re-measure when prompt_text changes

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start bg-base-100 py-8 relative">
      {/* Sticky input and settings menu container */}
      <div className="w-full flex flex-col items-center z-30 sticky top-0 bg-base-100 relative">
        {/* Prompt input */}
        <div
          ref={prompt_input_ref}
          className="w-full max-w-5xl mx-auto mb-0 flex items-center gap-2 py-2"
        >
          <div className="flex w-full items-center gap-2 flex-1 p-4 rounded-xl border border-base-200 bg-white shadow-sm">
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
            {/* Multiline prompt input styled to match the reference image, auto-expanding */}
            <textarea
              id="prompt_text"
              ref={prompt_textarea_ref}
              className="flex-1 bg-transparent outline-none text-lg text-gray-900 placeholder:text-gray-400 resize-none min-h-[36px] py-2 px-0 border-b border-gray-200 focus:border-orange-500 focus:bg-white transition-colors duration-200 rounded-none shadow-none focus:ring-0 focus:outline-none leading-tight overflow-hidden placeholder:font-normal placeholder:text-gray-400"
              value={prompt_text}
              onChange={handle_prompt_text_change}
              placeholder="What will you create?"
              required
              aria-required="true"
              aria-label="Prompt for image generation"
              rows={1}
              style={{
                lineHeight: "1.6",
                fontFamily: "inherit",
                background: "none",
                boxShadow: "none",
              }}
            />
            {/* Enhance Prompt Button */}
            <div className="flex flex-col md:flex-row items-center ml-2 gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                disabled={
                  is_enhancing ||
                  !prompt_text ||
                  !prompt_text.trim() ||
                  is_loading
                }
                aria-busy={is_enhancing}
                onClick={handle_enhance_prompt}
              >
                {is_enhancing ? <ChefHat /> : <Sparkles />}
              </button>

              <button
                type="submit"
                className="md:ml-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold shadow hover:bg-orange-600 transition"
                disabled={
                  is_loading ||
                  (typeof mana_points === "number" &&
                    mana_points < size_tokens_slider)
                }
                aria-busy={is_loading}
                onClick={handle_generate_image}
              >
                {is_loading ? <Brush /> : <SendHorizontal />}
              </button>
            </div>
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
            className={`w-full max-w-5xl mx-auto flex flex-col gap-6 z-30 absolute options-card-animated${show_settings ? '' : ' hide'}`}
            style={{ top: prompt_input_height }}
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
                  <div className="font-semibold text-black text-lg mb-2">
                    Model
                  </div>
                  <div className="w-full">
                    <select
                      className="select select-bordered w-full text-black font-medium bg-white border-base-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
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
                {model_id === "fal-ai/sana" && (
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <label htmlFor="num_inference_steps" className="font-medium text-gray-700 w-48">Inference Steps</label>
                      <input
                        id="num_inference_steps"
                        type="number"
                        min={1}
                        max={50}
                        value={num_inference_steps}
                        onChange={e => set_num_inference_steps(Number(e.target.value))}
                        className="input input-bordered w-24"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <label htmlFor="seed" className="font-medium text-gray-700 w-48">Seed</label>
                      <input
                        id="seed"
                        type="number"
                        value={seed}
                        onChange={e => set_seed(Number(e.target.value))}
                        className="input input-bordered w-32"
                      />
                      <button
                        type="button"
                        className="btn btn-xs ml-2"
                        onClick={() => set_seed(Math.floor(Math.random() * 1000000))}
                      >
                        Randomize
                      </button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <label htmlFor="style_name" className="font-medium text-gray-700 w-48">Style</label>
                      <select
                        id="style_name"
                        value={style_name}
                        onChange={e => set_style_name(e.target.value)}
                        className="select select-bordered w-48"
                      >
                        {SANA_STYLE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
      {/* End sticky/menu container */}
      {/* Error message (always below menu/input) */}
      <Error_display error_message={error_message} />
      {/* Generation Receipt (show after generation or error) */}
      {(image_base64.length > 0 || error_message) && (
        <ImageGenerationReceipt
          prompt_text={prompt_description || ""}
          images={image_base64}
          costs={get_costs()}
          plan={plan || ""}
          timestamp={new Date().toLocaleString()}
          error_message={error_message}
          onDownload={(img, idx) => {
            const a = document.createElement("a");
            a.href = `data:image/png;base64,${img}`;
            a.download = `generated_image_${idx + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          onRedo={image_base64.length > 0 ? handle_redo : undefined}
          onReuse={image_base64.length > 0 ? handle_reuse : undefined}
        />
      )}
      {/* Add this style block for the animation */}
      <style jsx>{`
        .options-card-animated {
          transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
        }
        .options-card-animated.hide {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
