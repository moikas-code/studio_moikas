"use client";
import React, { useState, useRef, useEffect } from "react";
import { VIDEO_MODELS, sort_models_by_cost } from "@/lib/generate_helpers";
import { FaVideo, FaImage, FaClock, FaExpandArrowsAlt } from "react-icons/fa";
import CostDisplay from "./CostDisplay";

const ASPECT_OPTIONS = [
  { label: "16:9 (Landscape)", value: "16:9" },
  { label: "9:16 (Portrait)", value: "9:16" },
];

export default function Video_effects_page() {
  const [prompt, set_prompt] = useState("");
  const [image_url, set_image_url] = useState("");
  const [image_file, set_image_file] = useState<File | null>(null);
  const [image_source, set_image_source] = useState<"url" | "upload">("url");
  const [aspect, set_aspect] = useState("16:9");
  const [video_url, set_video_url] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [show_settings, set_show_settings] = useState(false);
  const prompt_textarea_ref = useRef<HTMLTextAreaElement>(null);
  const prompt_input_ref = useRef<HTMLDivElement>(null);
  const [prompt_input_height, set_prompt_input_height] = useState(0);
  const [window_width, set_window_width] = useState(1200);
  const sorted_video_models = sort_models_by_cost(VIDEO_MODELS);
  const [model_id, set_model_id] = useState(sorted_video_models[0].value);
  const selected_model = sorted_video_models.find(m => m.value === model_id);
  const [video_duration, set_video_duration] = useState(5);
  const [enhancing, set_enhancing] = useState(false);

  useEffect(() => {
    set_window_width(typeof window !== "undefined" ? window.innerWidth : 1200);
    function handle_resize() {
      set_window_width(window.innerWidth);
    }
    window.addEventListener("resize", handle_resize);
    return () => window.removeEventListener("resize", handle_resize);
  }, []);

  useEffect(() => {
    if (prompt_input_ref.current) {
      set_prompt_input_height(prompt_input_ref.current.offsetHeight);
    }
  }, [prompt, window_width]);

  async function handle_generate(e: React.FormEvent) {
    e.preventDefault();
    set_loading(true);
    set_error("");
    set_video_url("");
    // Public black PNG URL
    const black_placeholder = "https://placehold.co/600x400/000000/000";
    let final_image_url = image_url;
    try {
      if (image_source === "upload" && image_file) {
        const form_data = new FormData();
        form_data.append("file", image_file);
        const upload_res = await fetch("/api/video-effects/upload", {
          method: "POST",
          body: form_data,
        });
        const upload_data = await upload_res.json();
        if (!upload_res.ok) throw new Error(upload_data.error || "Image upload failed");
        final_image_url = upload_data.url;
      }
      // If model requires image and no image provided, use black placeholder
      if (selected_model?.is_image_to_video && !final_image_url) {
        final_image_url = black_placeholder;
      }
      // Parse prompt for negative prompt
      let main_prompt = prompt;
      let negative_prompt = "";
      const match = prompt.match(/--no |--n ([^]*)/i);
      if (match) {
        const split = prompt.split(/--no |--n /i);
        main_prompt = split[0].trim();
        negative_prompt = split[1]?.trim() || "";
      }
      const res = await fetch("/api/video-effects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: main_prompt, negative_prompt, image_url: final_image_url, aspect, model_id, duration: video_duration }),
      });
      const data = await res.json();
      if (res.ok && data.video_url) {
        set_video_url(data.video_url);
      } else {
        set_error(data.error || "Failed to generate video");
      }
    } catch (err: unknown) {
      set_error(err instanceof Error ? err.message : String(err));
    } finally {
      set_loading(false);
    }
  }

  async function handle_enhance_prompt() {
    if (!prompt.trim()) return;
    set_enhancing(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok && data.enhanced_prompt) {
        set_prompt(data.enhanced_prompt);
      } else {
        set_error(data.error || "Failed to enhance prompt");
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : String(err));
    } finally {
      set_enhancing(false);
    }
  }

  function handle_copy() {
    if (video_url) {
      navigator.clipboard.writeText(video_url);
    }
  }

  function handle_file_change(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      set_image_file(e.target.files[0]);
    } else {
      set_image_file(null);
    }
  }

  // Placeholder for aspect ratio preview
  const aspect_label = ASPECT_OPTIONS.find(a => a.value === aspect)?.label || aspect;
  const preview_width = aspect === "16:9" ? 112 : 63;
  const preview_height = aspect === "9:16" ? 63 : 112;
  const placeholder_style = {
    width: `${preview_width}px`,
    height: `${preview_height}px`,
    transition: "all 0.3s ease",
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start bg-base-100 p-8 relative">
      {/* Main input bar */}
      <div className="w-full flex flex-col items-center z-30">
        <div
          ref={prompt_input_ref}
          className="w-full flex justify-center items-start"
        >
          <div
            className="fixed bottom-20 left-0 w-full px-2 z-40 md:static md:bottom-auto md:left-auto md:px-0 md:mt-8"
            style={{ pointerEvents: "auto" }}
          >
            <form
              onSubmit={handle_generate}
              className="w-full max-w-2xl mx-auto flex items-start bg-base-200 rounded border border-base-300 shadow-lg px-4 md:px-6 py-2.5 md:py-3 gap-2 md:gap-3 relative min-h-[56px]"
              style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)" }}
            >
              {/* Left video icon */}
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
                  <polygon points="16,12 20,10 20,14" fill="currentColor" />
                </svg>
              </span>
              {/* Prompt input */}
              <textarea
                id="prompt_text"
                ref={prompt_textarea_ref}
                className="flex-1 w-full min-h-[36px] bg-transparent outline-none text-base placeholder:text-base-400 px-2 md:px-3 font-sans font-normal border-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto"
                value={loading ? "Building..." : prompt}
                onChange={(e) => {
                  set_prompt(e.target.value);
                  const textarea = prompt_textarea_ref.current;
                  if (textarea) {
                    textarea.style.height = "auto";
                    textarea.style.height = textarea.scrollHeight + "px";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Only submit if not loading/enhancing and prompt is not empty
                    if (!loading && !enhancing && prompt.trim()) {
                      handle_generate(e as unknown as React.FormEvent);
                    }
                  }
                }}
                placeholder={"Describe your video..."}
                required
                aria-required="true"
                aria-label="Prompt for video generation"
                rows={1}
                style={{
                  lineHeight: "1.6",
                  background: "none",
                  boxShadow: "none",
                  overflow: "hidden",
                }}
                autoComplete="off"
                spellCheck={true}
                disabled={loading || enhancing}
              />
              {/* Enhance Prompt button */}
              <button
                type="button"
                className="btn btn-outline btn-sm ml-2 flex-shrink-0"
                style={{ minWidth: 110 }}
                onClick={handle_enhance_prompt}
                disabled={enhancing || loading || !prompt.trim()}
                aria-label="Enhance prompt"
              >
                {enhancing ? "Enhancing..." : "Enhance Prompt"}
              </button>
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
            </form>
          </div>
        </div>
      </div>
      {/* Loading indicator and message */}
      {loading && (
        <div className="w-full flex flex-col items-center justify-center mt-8 mb-4">
          <span
            className="loading loading-spinner loading-lg text-jade mb-2"
            aria-label="Generating video"
            role="status"
          ></span>
          <span className="text-base font-semibold text-jade">
            AI is creating your video...
          </span>
        </div>
      )}
      {/* Main options card (settings) */}
      {show_settings && (
        <form
          onSubmit={handle_generate}
          className="w-full max-w-5xl mx-auto flex flex-col z-50 options-card-animated bg-gradient-to-br from-base-200 via-base-100 to-base-200 rounded-2xl border border-base-300 shadow-lg p-2 md:p-4"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: window_width < 768 ? 72 : 42 + prompt_input_height,
            margin: "0 auto",
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
          {/* Options row */}
          <div className="w-full grid grid-cols-3 gap-4  bg-transparent">
            {/* Aspect Ratio */}
            <div className="col-span-1 flex-1 min-w-[180px] min-h-[280px] bg-white/80 rounded-2xl border border-base-300 shadow-md p-5 flex flex-col gap-3 items-center justify-center transition-all duration-200 hover:shadow-xl focus-within:ring-2 focus-within:ring-jade relative group">
              <div className="flex items-center gap-2 mb-1 w-full">
                <FaExpandArrowsAlt className="text-jade text-lg" />
                <span className="text-lg font-bold text-base-900">
                  Aspect Ratio
                </span>
                <span
                  className="ml-1 text-base-400 cursor-help"
                  title="Choose the aspect ratio for your video."
                >
                  ?
                </span>
              </div>
              <div className="flex flex-col h-full  w-full items-center justify-center gap-2 md:gap-3 relative">
                {/* Aspect ratio preview (placeholder) */}
                <div className="flex flex-col items-center justify-center w-[42px] md:w-[63px] h-[42px] md:h-[63px] mb-4">
                  <div
                    className="border border-base rounded-md flex items-center justify-center bg-base-800 w-[22px] h-[22px] flex-shrink-0 mx-1 md:mx-2 my-1 md:my-2 p-1 md:p-2"
                    style={{ ...placeholder_style }}
                  >
                    <span className="text-base md:text-lg font-semibold text-base">
                      {aspect_label}
                    </span>
                  </div>
                </div>
                <select
                  className="select select-bordered w-full text-lg font-semibold bg-base-100 border border-base-300 focus:border-jade focus:ring-2 focus:ring-jade-focus transition text-base rounded-lg px-3 py-2 hover:border-jade"
                  value={aspect}
                  onChange={(e) => set_aspect(e.target.value)}
                  aria-label="Select aspect ratio"
                >
                  {ASPECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Duration */}
            <div className="flex-1 min-w-[140px] bg-white/80 rounded-2xl border border-base-300 shadow-md p-5 flex flex-col gap-3 items-center justify-between transition-all duration-200 hover:shadow-xl focus-within:ring-2 focus-within:ring-jade relative group">
              <div className="flex items-center gap-2 mb-1 w-full">
                <FaClock className="text-jade text-lg" />
                <span className="text-lg font-bold text-base-900">
                  Duration
                </span>
                <span
                  className="ml-1 text-base-400 cursor-help"
                  title="Choose the length of the generated video."
                >
                  ?
                </span>
              </div>
              <select
                className="select select-bordered w-full text-lg font-semibold bg-base-100 border border-base-300 focus:border-jade focus:ring-2 focus:ring-jade-focus transition text-base rounded-lg px-3 py-2 hover:border-jade"
                value={video_duration}
                onChange={(e) => set_video_duration(Number(e.target.value))}
                aria-label="Select video duration"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
              <CostDisplay model={selected_model} />
            </div>
            {/* Model selection */}
            <div className="flex-1 min-w-[220px]  bg-white/80 rounded-2xl border border-base-300 shadow-md p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-xl focus-within:ring-2 focus-within:ring-jade relative group">
              <div className="flex items-center gap-2 mb-1">
                <FaVideo className="text-jade text-lg" />
                <span className="text-lg font-bold text-base-900">Model</span>
                <span
                  className="ml-1 text-base-400 cursor-help"
                  title="Choose the AI model for video generation."
                >
                  ?
                </span>
              </div>
              <select
                className="select select-bordered w-full text-lg font-semibold bg-base-100 border border-base-300 focus:border-jade focus:ring-2 focus:ring-jade-focus transition text-base rounded-lg px-3 py-2 hover:border-jade"
                value={model_id}
                onChange={(e) => set_model_id(e.target.value)}
                aria-label="Select model"
              >
                {sorted_video_models.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Image Source and Upload/URL - only if is_image_to_video */}
            {selected_model?.is_image_to_video && (
              <div className="flex-1 min-w-[220px] bg-white/80 rounded-2xl border border-base-300 shadow-md p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-xl focus-within:ring-2 focus-within:ring-jade relative group">
                <div className="flex items-center gap-2 mb-1">
                  <FaImage className="text-jade text-lg" />
                  <span className="text-lg font-bold text-base-900">
                    Image Source
                  </span>
                  <span
                    className="ml-1 text-base-400 cursor-help"
                    title="Provide an image URL or upload an image to guide the video."
                  >
                    ?
                  </span>
                </div>
                <div className="flex gap-3 items-center mb-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="image_source"
                      value="url"
                      checked={image_source === "url"}
                      onChange={() => set_image_source("url")}
                    />
                    Use Image URL
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="image_source"
                      value="upload"
                      checked={image_source === "upload"}
                      onChange={() => set_image_source("upload")}
                    />
                    Upload Image
                  </label>
                </div>
                {image_source === "url" ? (
                  <>
                    <label className="font-medium">Image URL</label>
                    <input
                      className="input input-bordered w-full rounded-lg px-3 py-2"
                      type="url"
                      value={image_url}
                      onChange={(e) => set_image_url(e.target.value)}
                      placeholder="https://..."
                      required
                    />
                  </>
                ) : (
                  <>
                    <label className="font-medium">Upload Image</label>
                    <input
                      className="file-input file-input-bordered w-full rounded-lg px-3 py-2"
                      type="file"
                      accept="image/*"
                      onChange={handle_file_change}
                      required
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </form>
      )}
      {/* Error message (always below menu/input) */}
      {error && <div className="alert alert-error mt-4">{error}</div>}
      {/* Result display */}
      {video_url && (
        <div className="w-full max-w-2xl mx-auto mt-8 bg-base-900 rounded-xl border border-base-300 shadow-lg p-0 flex flex-col items-center">
          <video
            src={video_url}
            controls
            className="w-full max-w-md rounded shadow m-4"
          />
          <div className="flex gap-2 mb-4">
            <a href={video_url} download className="btn btn-success">
              Download Video
            </a>
            <button className="btn btn-outline" onClick={handle_copy}>
              Copy Link
            </button>
          </div>
        </div>
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