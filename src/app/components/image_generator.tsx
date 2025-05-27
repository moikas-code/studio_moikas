"use client";

import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { MpContext } from "../context/mp_context";
import {
  get_tokens_for_size,
  MODEL_OPTIONS,
  add_overlay_to_image,
  calculateGenerationMP,
} from "../../lib/generate_helpers";
import { track } from "@vercel/analytics";
import Error_display from "./error_display";
import { Brush, ChefHat, SendHorizontal, Sparkles } from "lucide-react";
import Image_grid from "./image_grid";

/**
 * ImageGenerator component allows users to enter a prompt and generate an image using the fal.ai API.
 * Follows snake_case for all identifiers.
 */

// Custom hook for window size
function useWindowHook() {
  const [window_size, set_window_size] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    function handle_resize() {
      set_window_size({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener('resize', handle_resize);
    return () => window.removeEventListener('resize', handle_resize);
  }, []);

  return window_size;
}

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
  const [model_id, set_model_id] = useState<string>("fal-ai/sana");

  // State for aspect ratio slider (discrete, only supported ratios)
  const ASPECT_PRESETS = useMemo(
    () => [
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
    ],
    []
  );
  // Slider value is the index
  const [aspect_index, set_aspect_index] = useState(5); // Default to 1:1

  // Get current preset
  const current_preset = ASPECT_PRESETS[aspect_index];
  const aspect_label = current_preset.label;
  const aspect = current_preset.ratio;

  // Only show buttons for 1:1, 3:4, 4:3
  const BUTTON_PRESETS = ASPECT_PRESETS.map((p, i) => ({
    ...p,
    index: i,
  })).filter(
    (p) => p.label === "1:1" || p.label === "3:4" || p.label === "4:3"
  );

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
  const prompt_textarea_ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea on value or window resize
  useEffect(() => {
    const textarea = prompt_textarea_ref.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
    // Handler for window resize
    const handle_resize = () => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      }
    };
    window.addEventListener("resize", handle_resize);
    return () => window.removeEventListener("resize", handle_resize);
  }, [prompt_text]);


  // Track enhancement usage
  const [enhancement_count, set_enhancement_count] = useState(0);
  const [backend_cost, set_backend_cost] = useState<number | null>(null);

  // Store last used settings for redo/reuse
  const [last_generation, set_last_generation] = useState<Record<
    string,
    unknown
  > | null>(null);

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
  const [guidance_scale, set_guidance_scale] = useState(5);

  const window_size = useWindowHook();
  const is_small_screen = window_size.width < 768; // Tailwind 'sm' breakpoint
  const prompt_placeholder = is_small_screen ? "Create..." : "What will you create?";

  // Helper to parse negative prompt from --no or --n
  function extract_negative_prompt(prompt: string): {
    prompt: string;
    negative_prompt: string;
  } {
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
    async (
      e: React.FormEvent,
      custom?: {
        prompt: string;
        model: string;
        aspect: number;
        enhance: number;
      }
    ) => {
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
      const used_width = Math.round(
        Math.sqrt(PREVIEW_AREA * used_aspect_ratio)
      );
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
            guidance_scale,
            seed,
            style_name,
          }),
        };
        console.log("Sending to /api/generate:", payload);
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
        if (plan === "free") {
          images = await Promise.all(
            images.map((img: string) => add_overlay_to_image(img))
          );
        }
        set_image_base64(images);
        set_prompt_description(used_prompt ?? "");
        set_mana_points_used(data.mp_used ?? null);
        set_backend_cost(data.enhancement_mp ?? null);
        set_generated_model_id(data.model_id || used_model);
        set_generated_num_inference_steps(data.num_inference_steps || num_inference_steps);
        set_generated_guidance_scale(data.guidance_scale || guidance_scale);
        set_generated_style_name(data.style_name || style_name);
        await refresh_mp();
        // Reset prompt and enhancement count after generation
        set_prompt_text("");
        set_enhancement_count(0);
        // Randomize seed after each generation
        set_seed(Math.floor(Math.random() * 1000000));
        // Store last generation settings
        set_last_generation({
          prompt_text: used_prompt,
          model_id: used_model,
          aspect_index: used_aspect,
          enhancement_count: used_enhance,
        });
        set_guidance_scale(5);
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
    [
      aspect_index,
      enhancement_count,
      model_id,
      plan,
      PREVIEW_AREA,
      prompt_text,
      refresh_mp,
      set_enhancement_count,
      set_error_message,
      set_image_base64,
      set_is_loading,
      set_mana_points_used,
      set_prompt_description,
      set_show_settings,
      set_last_generation,
      ASPECT_PRESETS,
      num_inference_steps,
      seed,
      style_name,
      set_guidance_scale,
    ]
  );

  // Redo: re-run generation with last settings
  const handle_redo = useCallback(() => {
    if (!last_generation) return;
    handle_generate_image(new Event("submit") as unknown as React.FormEvent, {
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
  const handle_enhance_prompt = useCallback(async () => {
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
  }, [
    plan,
    prompt_text,
    refresh_mp,
    set_enhancement_count,
    set_error_message,
    set_is_enhancing,
    set_prompt_text,
  ]);

  // Placeholder style for aspect ratio preview
  const placeholder_style = {
    width: `${preview_width / (is_small_screen ? 16 : 8)}px`, // Scale down for UI (e.g., 1024 -> 128px)
    height: `${preview_height / (is_small_screen ? 16 : 8)}px`,
    transition: "all 0.3s ease",
  };

  // Cost breakdown for receipt (from backend)
  // const get_costs = () => {
  //   if (backend_cost) {
  //     // Only include enhancement_mp if it was used
  //     const enhancement_mp = backend_cost > 0 ? backend_cost : 0;
  //     return {
  //       enhancement_mp,
  //       images: [
  //         {
  //           model:
  //             MODEL_OPTIONS.find((m) => m.value === model_id)?.name ||
  //             model_id,
  //           width: preview_width,
  //           height: preview_height,
  //           mp: mana_points_used ?? 0,
  //         },
  //       ],
  //       total_mp: enhancement_mp + (mana_points_used || 0),
  //     };
  //   }
    // fallback to local calculation if backend_cost is not set
    // Only include enhancement_mp if it was used
    const enhancement_mp = enhancement_count > 0 ? enhancement_count : 0;
    return {
      enhancement_mp,
      images: image_base64.map(() => ({
        model:
          MODEL_OPTIONS.find((m) => m.value === model_id)?.name || model_id,
        width: preview_width,
        height: preview_height,
        mp: get_tokens_for_size(preview_width, preview_height),
      })),
      total_mp:
        enhancement_mp +
        image_base64.length *
          get_tokens_for_size(preview_width, preview_height),
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handle_keydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (!is_loading && prompt_text.trim()) {
          handle_generate_image(
            new Event("submit") as unknown as React.FormEvent
          );
        }
      } else if (e.ctrlKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        set_prompt_text("");
      } else if (e.ctrlKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        if (!is_enhancing && prompt_text.trim() && !is_loading) {
          handle_enhance_prompt();
        }
      }
    }
    window.addEventListener("keydown", handle_keydown);
    return () => window.removeEventListener("keydown", handle_keydown);
  }, [
    prompt_text,
    is_loading,
    is_enhancing,
    handle_enhance_prompt,
    handle_generate_image,
  ]);

  // Ref for the prompt input container
  const prompt_input_ref = useRef<HTMLDivElement>(null);
  const [prompt_input_height, set_prompt_input_height] = useState(0);

  // Measure the height of the prompt input container
  useEffect(() => {
    if (prompt_input_ref.current) {
      set_prompt_input_height(prompt_input_ref.current.offsetHeight);
    }
  }, [prompt_text, window_size.width]);

  const [generated_model_id, set_generated_model_id] = useState<string>("");
  const [generated_num_inference_steps, set_generated_num_inference_steps] = useState<number>(num_inference_steps);
  const [generated_guidance_scale, set_generated_guidance_scale] = useState<number>(guidance_scale);
  const [generated_style_name, set_generated_style_name] = useState<string>(style_name);

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start bg-base-100 p-8 relative">
      {/* Sticky input and settings menu container */}
      {/* Responsive input bar: top for desktop/tablet, fixed bottom for mobile */}
      <div className="w-full flex flex-col items-center z-30">
        <div
          ref={prompt_input_ref}
          className="w-full flex justify-center items-start"
        >
          <div
            className="fixed bottom-20 left-0 w-full px-2 z-40 md:static md:bottom-auto md:left-auto md:px-0  md:mt-8"
            style={{ pointerEvents: "auto" }}
          >
            <form
              onSubmit={handle_generate_image}
              className="w-full max-w-2xl mx-auto flex items-start bg-base-200 rounded border border-base-300 shadow-lg px-4 md:px-6 py-2.5 md:py-3 gap-2 md:gap-3 relative min-h-[56px]"
              style={{
                boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)",
              }}
            >
              {/* Left camera icon */}
              <span className="flex items-center text-jade pl-0.5 pt-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M5 7l1.5-2h11L19 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              {/* Prompt input */}
              <textarea
                id="prompt_text"
                ref={prompt_textarea_ref}
                className="flex-1 w-full min-h-[36px] bg-transparent outline-none text-base placeholder:text-base-400 px-2 md:px-3 font-sans font-normal border-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto"
                value={prompt_text}
                onChange={(e) => {
                  set_prompt_text(e.target.value);
                  const textarea = prompt_textarea_ref.current;
                  if (textarea) {
                    textarea.style.height = "auto";
                    textarea.style.height = textarea.scrollHeight + "px";
                  }
                }}
                placeholder={prompt_placeholder}
                required
                aria-required="true"
                aria-label="Prompt for image generation"
                rows={1}
                style={{
                  lineHeight: "1.6",
                  background: "none",
                  boxShadow: "none",
                  overflow: "hidden",
                }}
                autoComplete="off"
                spellCheck={true}
              />
              {/* Settings button */}
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-jade text-base bg-transparent hover:bg-jade hover:text-jade transition focus:outline-none focus:ring-2 focus:ring-jade cursor-pointer"
                data-tip={show_settings ? "Hide settings" : "Show settings"}
                aria-label={show_settings ? "Hide settings" : "Show settings"}
                aria-pressed={show_settings}
                tabIndex={0}
                onClick={() => set_show_settings((s) => !s)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.7 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008.7 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09A1.65 1.65 0 0019.4 8.7a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
              {/* Enhance button */}
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-jade text-base hover:bg-jade-focus transition focus:outline-none focus:ring-2 focus:ring-jade cursor-pointer"
                disabled={
                  is_enhancing ||
                  !prompt_text ||
                  !prompt_text.trim() ||
                  is_loading
                }
                aria-busy={is_enhancing}
                onClick={handle_enhance_prompt}
              >
                {is_enhancing ? (
                  <ChefHat className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </button>
              {/* Submit button */}
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-jade text-base hover:bg-jade-focus transition focus:outline-none focus:ring-2 focus:ring-jade cursor-pointer"
                disabled={
                  is_loading ||
                  (typeof mana_points === "number" &&
                    mana_points < size_tokens_slider)
                }
                aria-busy={is_loading}
              >
                {is_loading ? (
                  <Brush className="w-6 h-6" />
                ) : (
                  <SendHorizontal className="w-6 h-6" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Main options card (settings) */}
      {show_settings && (
        <form
          onSubmit={handle_generate_image}
          className="w-full max-w-5xl mx-auto flex flex-col gap-6 z-50 options-card-animated bg-base-200 rounded-2xl border border-base-300 shadow-md p-1"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: window_size.width < 768 ? 72 : 42 + prompt_input_height,
            margin: '0 auto'
          }}
        >
          {/* Close button for mobile */}
          <button
            type="button"
            className="absolute top-2 right-2 z-50 md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-base-800 text-base hover:bg-base-700 hover:text-jade transition cursor-pointer"
            aria-label="Close options"
            onClick={() => set_show_settings(false)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Size */}
            <div className="bg-base-200 rounded-2xl border border-base-300 shadow-md p-6 flex flex-col gap-4">
              <div className="hidden md:block text-sm md:text-lg font-semibold text-base md:mb-2 text-center">
                Image Size
              </div>
              {/* Flex row for preview and controls */}
              <div className="flex flex-col w-full items-center justify-center gap-3 md:gap-6 relative">
                {/* Aspect ratio preview (placeholder) */}
                <div className="flex flex-col items-center justify-center w-[90px] md:w-[120px] h-[90px] md:h-[120px]">
                  <div
                    className="border border-base rounded-md flex items-center justify-center bg-base-800 w-[32px] h-[32px] flex-shrink-0 mx-1 md:mx-4 my-1 md:my-2 p-1 md:p-3"
                    style={{ ...placeholder_style }}
                  >
                    <span className="text-base md:text-lg font-semibold text-base">
                      {aspect_label}
                    </span>
                  </div>
                </div>
                {/* Preset buttons and slider */}
                {/* Reset button in upper right */}
                <button
                  type="button"
                  className="btn btn-xs text-sm text-base border border-base-300 hover:text-jade hover:border-jade absolute top-0 p-2 left-0 mt-1 mr-1 z-10 bg-base-800 absolute"
                  onClick={reset_aspect_index}
                  aria-label="Reset image size"
                >
                  Reset
                </button>
                <div className="w-full max-w-xs md:max-w-md flex flex-col items-center gap-2 relative">
                  {/* Preset buttons */}
                  <div className="flex justify-center gap-2 mb-2 w-full">
                    {BUTTON_PRESETS.map((preset) => (
                      <button
                        key={preset.index}
                        type="button"
                        className={`btn btn-xs rounded-full text-xs font-medium transition-all duration-150 px-4 py-1 ${
                          aspect_index === preset.index
                            ? "bg-jade text-base"
                            : "bg-base-800 text-base border border-base-300 hover:bg-base-700 hover:text-jade"
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
                    className="w-full h-2 rounded-full bg-base-800 accent-jade focus:outline-none cursor-pointer transition-all duration-300"
                    aria-label="Aspect ratio slider"
                  />
                  {/* Image size display */}
                  <div className="text-xs text-base-400 mt-1">
                    {preview_width} × {preview_height} px
                  </div>
                </div>
              </div>
            </div>
            {/* SANA Advanced Options (right column) - only show if model_id includes 'sana' */}
            {model_id.includes("sana") ? (
              <div className="bg-base-200 rounded-2xl border border-base-300 shadow-md p-6 flex flex-col gap-4">
                <div className="hidden md:block text-sm md:text-lg font-semibold text-base md:mb-2 text-center">
                  Advanced Options
                </div>
                {/* SANA Advanced Options - keep all controls, just restyle */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Inference Steps */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="num_inference_steps"
                      className="font-medium text-base text-xs mb-1"
                    >
                      Inference Steps
                    </label>
                    <input
                      id="num_inference_steps"
                      type="number"
                      min="1"
                      max="50"
                      value={num_inference_steps}
                      onChange={(e) =>
                        set_num_inference_steps(Number(e.target.value))
                      }
                      className="input input-bordered w-full text-xs py-1 px-2 bg-base-800 border border-base-300 text-base"
                    />
                  </div>
                  {/* Guidance Scale (CFG) */}
                  <div className="flex flex-col gap-1">
                    <label
                      title="Guidance Scale (CFG)"
                      htmlFor="guidance_scale"
                      className="font-medium text-base text-xs mb-1"
                    >
                      CFG
                    </label>
                    <input
                      id="guidance_scale"
                      type="number"
                      min="1"
                      max="20"
                      step="0.1"
                      value={guidance_scale}
                      onChange={(e) =>
                        set_guidance_scale(Number(e.target.value))
                      }
                      className="input input-bordered w-full text-xs py-1 px-2 bg-base-800 border border-base-300 text-base"
                    />
                  </div>

                  {/* Style Name */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="style_name"
                      className="font-medium text-base text-xs mb-1"
                    >
                      Style
                    </label>
                    <select
                      id="style_name"
                      value={style_name}
                      onChange={(e) => set_style_name(e.target.value)}
                      className="select select-bordered w-full text-xs bg-base-800 border border-base-300 text-base"
                    >
                      {SANA_STYLE_OPTIONS.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          className="bg-base-900 text-base"
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Seed */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="seed"
                      className="font-medium text-base text-xs mb-1"
                    >
                      Seed
                    </label>
                    <div className="flex flex-col gap-2 items-center">
                      <input
                        id="seed"
                        type="number"
                        value={seed}
                        onChange={(e) => set_seed(Number(e.target.value))}
                        className="input input-bordered w-full text-xs py-1 px-2 bg-base-800 border border-base-300 text-base"
                      />
                      <button
                        type="button"
                        className="btn btn-xs text-xs bg-base-800 border border-base-300 text-base hover:bg-jade hover:text-base-100"
                        onClick={() =>
                          set_seed(Math.floor(Math.random() * 1000000))
                        }
                        tabIndex={0}
                      >
                        Randomize
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-base-200 rounded-2xl border border-base-300 shadow-md p-6 flex flex-row md:flex-col gap-4 md:mt-2">
                <div className="text-xs md:text-lg font-semibold text-base mb-2">
                  Model
                </div>
                <div className="w-full">
                  <select
                    className="select select-bordered w-full text-base font-medium bg-base-800 border border-base-300 focus:border-jade focus:ring-2 focus:ring-jade-focus transition text-sm"
                    value={model_id}
                    onChange={(e) => set_model_id(e.target.value)}
                    disabled={is_loading}
                    aria-label="Select model"
                  >
                    {available_models.map((model) => (
                      <option
                        key={model.value}
                        value={model.value}
                        className="bg-base-900 text-base"
                      >
                        {model.name} ({calculateGenerationMP(model)} MP)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          {/* Model row below, full width */}
          {model_id.includes("sana") && (
            <div className="bg-base-200 rounded-2xl border border-base-300 shadow-md p-6 flex flex-row md:flex-col gap-4 md:mt-2">
                <div className="text-xs md:text-lg font-semibold text-base mb-2">Model</div>
              <div className="w-full">
                <select
                  className="select select-bordered w-full text-base font-medium bg-base-800 border border-base-300 focus:border-jade focus:ring-2 focus:ring-jade-focus transition text-sm"
                  value={model_id}
                  onChange={(e) => set_model_id(e.target.value)}
                  disabled={is_loading}
                  aria-label="Select model"
                >
                  {available_models.map((model) => (
                    <option
                      key={model.value}
                      value={model.value}
                      className="bg-base-900 text-base"
                    >
                      {model.name} ({calculateGenerationMP(model)} MP)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>
      )}
      {/* Error message (always below menu/input) */}
      <Error_display error_message={error_message} />
      {/* Generation Grid (show after generation) */}
      {image_base64.length > 0 && (
        <Image_grid
          image_base64={image_base64}
          prompt_text={prompt_description || ""}
          mana_points_used={mana_points_used}
          plan={plan || ""}
          model_id={generated_model_id || model_id}
          num_inference_steps={generated_num_inference_steps || num_inference_steps}
          guidance_scale={generated_guidance_scale || guidance_scale}
          style_name={generated_style_name || style_name}
          enhancement_count={enhancement_count}
          onRedo={handle_redo}
          onReuse={handle_reuse}
        />
      )}
      {/* Add this style block for the animation */}
      <style jsx>{`
        .options-card-animated {
          transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
        }
        .options-card-animated.hide {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
