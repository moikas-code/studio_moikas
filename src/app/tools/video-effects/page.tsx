"use client";
import React, { useState, useRef, useEffect } from "react";
import { VIDEO_MODELS, calculateGenerationMP, sort_models_by_cost, video_model_to_legacy_model } from "@/lib/generate_helpers";
import { FaVideo, FaImage, FaClock, FaExpandArrowsAlt } from "react-icons/fa";
import { MoreVertical } from "lucide-react";
import CostDisplay from "../../components/CostDisplay";
import Compact_token_display from "@/app/components/CompactTokenDisplay";

const ASPECT_OPTIONS = [
  { label: "16:9 (Landscape)", value: "16:9", sliderValue: 0 },
  { label: "1:1 (Square)", value: "1:1", sliderValue: 1 },
  { label: "9:16 (Portrait)", value: "9:16", sliderValue: 2 },
];

export default function Video_effects_page() {
  const [prompt, set_prompt] = useState("");
  const [image_file, set_image_file] = useState<File | null>(null);
  const [aspect, set_aspect] = useState("1:1");
  const [aspect_slider, set_aspect_slider] = useState(1);
  const [video_url, set_video_url] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState("");
  const [show_settings, set_show_settings] = useState(false);
  const prompt_textarea_ref = useRef<HTMLTextAreaElement>(null);
  const prompt_input_ref = useRef<HTMLDivElement>(null);
  const [prompt_input_height, set_prompt_input_height] = useState(0);
  const [window_width, set_window_width] = useState(1200);
  const sorted_video_models = sort_models_by_cost(
    VIDEO_MODELS.map(video_model_to_legacy_model)
  ).filter((m) => !m.is_image_to_video);
  const [model_id, set_model_id] = useState(
    sorted_video_models[0]?.value || "",
  );
  const selected_model = sorted_video_models.find((m) => m.value === model_id);
  const [video_duration, set_video_duration] = useState(5);
  const [enhancing, set_enhancing] = useState(false);
  const [job_id, set_job_id] = useState<string | null>(null);
  // Derived state: job in progress
  const job_in_progress = !!job_id && !video_url;

  useEffect(() => {
    set_window_width(typeof window !== "undefined" ? window.innerWidth : 1200);
    function handle_resize() {
      set_window_width(window.innerWidth);
    }
    window.addEventListener("resize", handle_resize);

    // Load saved model preference
    const savedModel = localStorage.getItem('videoEffectsModel');
    if (savedModel && sorted_video_models.some(m => m.value === savedModel)) {
      set_model_id(savedModel);
    }

    return () => window.removeEventListener("resize", handle_resize);
  }, [sorted_video_models]);

  useEffect(() => {
    // On mount, restore job state if present
    const saved = localStorage.getItem("jobState");
    let parsed: { job_id?: string } | null = null;
    try {
      parsed = saved ? JSON.parse(saved) : null;
    } catch {
      parsed = null;
    }
    if (parsed && parsed.job_id && !job_id && !video_url) {
      set_job_id(parsed.job_id);
    }
  }, [job_id, video_url]);

  useEffect(() => {
    // Persist job_id if job in progress
    if (job_in_progress && job_id) {
      localStorage.setItem("jobState", JSON.stringify({ job_id }));
    } else if (!job_in_progress) {
      localStorage.removeItem("jobState");
    }
  }, [job_in_progress, job_id]);

  useEffect(() => {
    if (!job_id) return;
    set_error("");
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-effects/status?job_id=${job_id}`);
        
        if (!res.ok) {
          // Handle specific HTTP errors
          if (res.status === 404) {
            set_error("Job not found. Please try generating a new video.");
            set_job_id(null);
            clearInterval(interval);
            localStorage.removeItem("jobState");
            return;
          } else if (res.status === 401) {
            set_error("Session expired. Please refresh the page.");
            clearInterval(interval);
            return;
          }
        }
        
        const data = await res.json();
        
        // Reset retry count on successful response
        retryCount = 0;
        
        if (data.status === "done" && data.video_url) {
          set_video_url(data.video_url);
          set_job_id(null); // Clear job_id after successful completion
          clearInterval(interval);
          localStorage.removeItem("jobState");
        } else if (data.status === "error") {
          set_error(data.error || "Video generation failed.");
          set_job_id(null); // Clear job_id after error
          clearInterval(interval);
          localStorage.removeItem("jobState");
        } else if (data.error) {
          // Handle any error response
          set_error(data.error);
          if (data.error.includes("not found") || data.error.includes("timeout")) {
            set_job_id(null);
            clearInterval(interval);
            localStorage.removeItem("jobState");
          }
        }
      } catch (err) {
        console.error("Error checking job status:", err);
        retryCount++;
        
        // Show temporary error message
        if (retryCount >= maxRetries) {
          set_error("Connection issues. Still trying to check video status...");
        }
        
        // Don't clear job_id on network errors - allow retry
        // But stop polling after too many failures
        if (retryCount > 10) {
          set_error("Unable to check video status. Please refresh the page.");
          clearInterval(interval);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [job_id]);

  useEffect(() => {
    if (prompt_input_ref.current) {
      set_prompt_input_height(prompt_input_ref.current.offsetHeight);
    }
  }, [prompt, window_width]);

  // Restore video_url from localStorage on mount
  useEffect(() => {
    const savedVideoUrl = localStorage.getItem("videoUrl");
    if (savedVideoUrl && !video_url) {
      set_video_url(savedVideoUrl);
    }
  }, [video_url]);

  // Persist video_url to localStorage when it changes
  useEffect(() => {
    if (video_url) {
      localStorage.setItem("videoUrl", video_url);
    } else {
      localStorage.removeItem("videoUrl");
    }
  }, [video_url]);

  async function handle_generate(e: React.FormEvent) {
    e.preventDefault();
    if (job_in_progress) return; // Prevent new submission if job in progress
    set_loading(true);
    set_error("");
    set_video_url("");
    localStorage.removeItem("videoUrl");
    set_job_id(null);
    // Public black PNG URL
    const black_placeholder = "https://placehold.co/600x400/000000/000";
    let final_image_url = "";
    try {
      if (image_file) {
        const form_data = new FormData();
        form_data.append("file", image_file);
        const upload_res = await fetch("/api/video-effects/upload", {
          method: "POST",
          body: form_data,
        });
        const upload_data = await upload_res.json();
        if (!upload_res.ok)
          throw new Error(upload_data.error || "Image upload failed");
        final_image_url = upload_data.url;
      }
      // If model requires image and no image provided, use black placeholder
      if (selected_model?.is_image_to_video && !final_image_url) {
        final_image_url = black_placeholder;
      }
      // Convert image to base64 if needed
      let image_base64 = "";
      if (final_image_url) {
        const base64_result = await fetch(final_image_url).then(res => res.blob()).then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
        // Extract base64 data from data URL
        image_base64 = base64_result.split(',')[1] || "";
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
        body: JSON.stringify({
          prompt: main_prompt,
          negative_prompt,
          image_url: final_image_url,
          image_file_base64: image_base64, // Send base64 data
          aspect,
          model_id,
          duration: video_duration,
        }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        set_error(text || "Unknown error occurred");
        set_loading(false);
        return;
      }
      if (res.ok && data.job_id) {
        set_job_id(data.job_id);
        localStorage.setItem("jobState", JSON.stringify({ job_id: data.job_id }));
      } else {
        set_error(data.error || "Failed to start video job");
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
  const preview_width = aspect === "16:9" ? 112 : aspect === "1:1" ? 80 : 63;
  const preview_height = aspect === "9:16" ? 112 : aspect === "1:1" ? 80 : 63;
  const placeholder_style = {
    width: `${preview_width}px`,
    height: `${preview_height}px`,
    transition: "all 0.3s ease",
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="navbar min-h-12 bg-base-100 border-b">
        <div className="flex-1">
          <h1 className="text-lg font-bold">Video Effects</h1>
        </div>
        <div className="flex-none flex items-center gap-3">
          {/* Model selection dropdown */}
          <div className="flex items-center gap-2">
            <FaVideo className="text-jade text-sm" />
            <select
              className="select select-sm select-bordered bg-base-200"
              value={model_id}
              onChange={(e) => {
                set_model_id(e.target.value);
                localStorage.setItem('videoEffectsModel', e.target.value);
              }}
              aria-label="Select video model"
            >
              {sorted_video_models.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.name} ({calculateGenerationMP(model)} MP/1s)
                </option>
              ))}
            </select>
          </div>
          
          {/* Compact token display */}
          <Compact_token_display className="hidden sm:flex" />
          
          {/* Dropdown menu for better mobile experience */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-square btn-ghost btn-sm">
              <MoreVertical className="w-4 h-4" />
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-64 p-2 shadow">
              {/* Show token info in dropdown on mobile */}
              <li className="sm:hidden mb-2">
                <div className="px-2 py-1">
                  <Compact_token_display show_breakdown={true} />
                </div>
              </li>
              <li>
                <a href="/tools" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Tools
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full min-h-full flex flex-col items-center justify-start bg-base-100 p-8 relative">
          {/* Main input bar */}
          <div className="w-full flex flex-col items-center z-50">
            <div
              ref={prompt_input_ref}
              className="w-full flex justify-center items-start"
            >
              <div
                className="fixed bottom-20 left-0 w-full px-2 z-50 md:static md:bottom-auto md:left-auto md:px-0 md:mt-8"
                style={{ pointerEvents: "auto" }}
              >
                <form
                  onSubmit={handle_generate}
                  className="w-full max-w-2xl mx-auto flex items-start bg-base-200 rounded border border-base-300 shadow-lg px-4 md:px-6 py-2.5 md:py-3 gap-2 md:gap-3 relative min-h-[56px]"
                  style={{ boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)" }}
                >
                  {/* Upload/URL button for image2video models */}
                  {selected_model?.is_image_to_video ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handle_file_change}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className="btn btn-sm btn-ghost text-jade hover:bg-jade/10 cursor-pointer flex items-center gap-1"
                        title={image_file ? "Change image" : "Upload image"}
                      >
                        <FaImage className="w-4 h-4" />
                        <span className="text-xs">
                          {image_file
                            ? image_file.name.slice(0, 10) + '...'
                            : "Image"}
                        </span>
                      </label>
                    </div>
                  ) : (
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
                  )}
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
                        // Only submit if not loading/enhancing and prompt is not empty and no job in progress
                        if (
                          !loading &&
                          !enhancing &&
                          prompt.trim() &&
                          !job_in_progress
                        ) {
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
                    disabled={loading || enhancing || job_in_progress}
                  />
                  {/* Enhance Prompt button */}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm ml-2 flex-shrink-0"
                    style={{ minWidth: 110 }}
                    onClick={handle_enhance_prompt}
                    disabled={
                      enhancing || loading || !prompt.trim() || job_in_progress
                    }
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
          {/* Progress bar and message when job in progress */}
          {job_in_progress && (
            <div className="w-full flex flex-col items-center justify-center mt-8 mb-4">
              <div className="w-full max-w-md">
                <div className="h-2 bg-base-300 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-jade via-jade/80 to-jade bg-[length:200%_100%] animate-gradient-x rounded-full" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-jade mb-1">
                    Your video is being generated
                  </p>
                  <p className="text-sm text-base-content/70">
                    This may take 1-3 minutes depending on the duration and complexity
                  </p>
                  {job_id && (
                    <p className="text-xs text-base-content/50 mt-2 font-mono">
                      Job ID: {job_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
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
              className="w-full max-w-3xl mx-auto flex flex-col z-20 options-card-animated bg-base-200 rounded-xl border border-base-300 shadow-lg p-4 md:p-6"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                                 top: window_width < 768 ? 120 : 90 + prompt_input_height,
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
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
                {/* Aspect Ratio */}
                <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:border-jade/30 relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExpandArrowsAlt className="text-jade text-base" />
                    <span className="text-base font-semibold">Aspect Ratio</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Visual aspect ratio preview */}
                    <div className="flex justify-center">
                      <div
                        className="border-2 border-jade/30 rounded-md bg-base-200 transition-all duration-300"
                        style={{ ...placeholder_style }}
                      />
                    </div>
                    {/* Slider with custom track */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-1 bg-base-300 rounded-full" />
                        <div
                          className="absolute h-1 bg-jade rounded-full transition-all duration-200"
                          style={{
                            left: aspect_slider < 1 ? `${aspect_slider * 50}%` : '50%',
                            right: aspect_slider > 1 ? `${(2 - aspect_slider) * 50}%` : '50%',
                          }}
                        />
                        {/* Position dots */}
                        <div className="absolute w-2 h-2 bg-base-300 rounded-full" style={{ left: '0%', transform: 'translateX(-50%)' }} />
                        <div className="absolute w-2 h-2 bg-base-300 rounded-full" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                        <div className="absolute w-2 h-2 bg-base-300 rounded-full" style={{ left: '100%', transform: 'translateX(-50%)' }} />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={aspect_slider}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          set_aspect_slider(value);
                          const selected = ASPECT_OPTIONS[value];
                          if (selected) set_aspect(selected.value);
                        }}
                        className="relative z-10 w-full h-6 bg-transparent appearance-none cursor-pointer aspect-slider"
                        aria-label="Select aspect ratio"
                      />
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between text-xs text-base-content/70">
                      {ASPECT_OPTIONS.map((opt) => (
                        <span key={opt.value} className="text-center">
                          {opt.value}
                        </span>
                      ))}
                    </div>
                    {/* Current selection label */}
                    <div className="text-center text-sm font-medium">
                      {ASPECT_OPTIONS[aspect_slider]?.label}
                    </div>
                  </div>
                </div>
                {/* Duration */}
                <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:border-jade/30 relative group">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="text-jade text-base" />
                    <span className="text-base font-semibold">Duration</span>
                  </div>
                  <select
                    className="select select-bordered select-sm w-full mb-2"
                    value={video_duration}
                    onChange={(e) => set_video_duration(Number(e.target.value))}
                    aria-label="Select video duration"
                  >
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                  <div className="mt-auto">
                    <CostDisplay model={selected_model} />
                  </div>
                </div>
              </div>
              {/* Image URL Input for image2video models */}
              {/* {selected_model?.is_image_to_video && (
                <div className="mt-4 p-4 bg-base-100 rounded-xl border border-base-300">
                  <div className="flex items-center gap-2 mb-3">
                    <FaImage className="text-jade text-base" />
                    <span className="text-base font-semibold">Image Input</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="img_src"
                          value="upload"
                          checked={image_source === "upload"}
                          onChange={() => set_image_source("upload")}
                          className="radio radio-sm radio-jade"
                        />
                        <span className="text-sm">Upload File</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="img_src"
                          value="url"
                          checked={image_source === "url"}
                          onChange={() => set_image_source("url")}
                          className="radio radio-sm radio-jade"
                        />
                        <span className="text-sm">Use URL</span>
                      </label>
                    </div>
                    {image_source === "url" && (
                      <input
                        type="url"
                        value={image_url}
                        onChange={(e) => set_image_url(e.target.value)}
                        placeholder="Enter image URL..."
                        className="input input-bordered input-sm w-full"
                      />
                    )}
                    {image_source === "upload" && image_file && (
                      <div className="text-sm text-base-content/70">
                        Selected: {image_file.name}
                      </div>
                    )}
                  </div>
                </div>
              )} */}
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
              transition:
                top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              opacity: 1;
            }
            .options-card-animated.hide {
              opacity: 0;
            }
            .aspect-slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              background: #000000;
              border-radius: 50%;
              cursor: pointer;
              position: relative;
              z-index: 20;
            }
            .aspect-slider::-moz-range-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              background: #000000;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              position: relative;
              z-index: 20;
            }
            .aspect-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 4px;
              cursor: pointer;
              background: transparent;
            }
            .aspect-slider::-moz-range-track {
              width: 100%;
              height: 4px;
              cursor: pointer;
              background: transparent;
            }
            @keyframes gradient-x {
              0% {
                background-position: 0% 50%;
              }
              100% {
                background-position: 100% 50%;
              }
            }
            .animate-gradient-x {
              animation: gradient-x 2s ease infinite;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
