"use client";
import React, { useState, useRef, useEffect, useContext } from "react";
import { FaVideo, FaImage, FaClock, FaExpandArrowsAlt } from "react-icons/fa";
import { MoreVertical } from "lucide-react";
import CostDisplay from "../../../components/CostDisplay";
import Compact_token_display from "@/components/CompactTokenDisplay";
import { MpContext } from "@/context/mp_context";
import VideoJobHistory from "./components/video_job_history";
import { useVideoModels } from "./hooks/use_video_models";

const ASPECT_OPTIONS = [
  { label: "16:9 (Landscape)", value: "16:9", sliderValue: 0 },
  { label: "1:1 (Square)", value: "1:1", sliderValue: 1 },
  { label: "9:16 (Portrait)", value: "9:16", sliderValue: 2 },
];

export default function VideoEffectsClient() {
  const { plan } = useContext(MpContext);
  const {
    models: video_models,
    loading: models_loading,
    default_model_id,
  } = useVideoModels(plan || "free");

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
  // Removed unused state variables
  const [model_id, set_model_id] = useState("");
  const [video_duration, set_video_duration] = useState(5);
  const [enhancing, set_enhancing] = useState(false);
  const [job_id, set_job_id] = useState<string | null>(null);
  // Derived state: job in progress
  const job_in_progress = !!job_id && !video_url;

  // Set default model when models are loaded
  useEffect(() => {
    if (default_model_id && !model_id) {
      set_model_id(default_model_id);
    }
  }, [default_model_id, model_id]);

  const selected_model = video_models.find((m) => m.id === model_id);

  const handle_aspect_slider_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    set_aspect_slider(value);
    set_aspect(ASPECT_OPTIONS[value].value);
  };

  const auto_resize_textarea = () => {
    if (prompt_textarea_ref.current) {
      prompt_textarea_ref.current.style.height = "auto";
      prompt_textarea_ref.current.style.height = prompt_textarea_ref.current.scrollHeight + "px";
    }
  };

  const handle_generate = async () => {
    if (loading || job_in_progress) return;
    if (!prompt.trim() && !image_file) {
      set_error("Please enter a prompt or upload an image");
      return;
    }

    if (!model_id) {
      set_error("Please select a model");
      return;
    }

    set_loading(true);
    set_error("");
    set_video_url("");
    set_job_id(null);

    const form_data = new FormData();
    form_data.append("prompt", prompt);
    form_data.append("aspect_ratio", aspect);
    form_data.append("model", model_id);
    form_data.append("duration", video_duration.toString());

    if (image_file) {
      form_data.append("image", image_file);
    }

    try {
      const response = await fetch("/api/video-effects", {
        method: "POST",
        body: form_data,
      });

      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.error || "Failed to generate video");
      }

      const data = await response.json();

      if (data.job_id) {
        set_job_id(data.job_id);
      } else if (data.video_url) {
        set_video_url(data.video_url);
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      set_loading(false);
    }
  };

  // Removed unused handlers - now handled by VideoJobHistory component

  const handle_enhance_prompt = async () => {
    if (!prompt.trim() || enhancing) return;

    set_enhancing(true);
    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to enhance prompt");

      const data = await response.json();
      if (data.enhanced_prompt) {
        set_prompt(data.enhanced_prompt);
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err);
    } finally {
      set_enhancing(false);
    }
  };

  const handle_file_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        set_image_file(file);
        set_error("");
      } else {
        set_error("Please upload an image file");
      }
    }
  };

  const base_cost = selected_model?.cost || 0;
  const duration_cost = base_cost * video_duration;

  const render_content = () => {
    if (video_url) {
      return (
        <div className="flex items-center justify-center">
          <video
            src={video_url}
            controls
            autoPlay
            loop
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center">
        <div className="text-center text-gray-400 p-8">
          <FaVideo className="w-24 h-24 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Your video will appear here</p>
          <p className="text-sm mt-2">Generate a video to get started</p>
        </div>
      </div>
    );
  };

  const get_model_capabilities = () => {
    if (!selected_model) return { supports_image: false, supports_text: true };

    return {
      supports_image: selected_model.model_config?.supports_image_input || false,
      supports_text: !selected_model.model_config?.is_text_only !== false,
    };
  };

  const capabilities = get_model_capabilities();
  const can_generate = capabilities.supports_text ? prompt.trim() : image_file !== null;

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Effects Studio</h1>
        <div className="flex items-center gap-4">
          <Compact_token_display />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Video Area */}
        <div className="xl:col-span-8 glass dark:glass-dark rounded-3xl p-6 shadow-macos">
          <div className="aspect-video bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden">
            {render_content()}
          </div>

          {/* Prompt Input */}
          <div className="mt-6" ref={prompt_input_ref}>
            <div className="relative">
              <textarea
                ref={prompt_textarea_ref}
                value={prompt}
                onChange={(e) => {
                  set_prompt(e.target.value);
                  auto_resize_textarea();
                }}
                onInput={auto_resize_textarea}
                placeholder={
                  capabilities.supports_text
                    ? "Describe your video..."
                    : "Text prompts not supported for this model"
                }
                className="w-full p-4 pr-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-jade dark:focus:ring-jade resize-none min-h-[60px] max-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!capabilities.supports_text || loading || job_in_progress}
              />
              <button
                onClick={handle_enhance_prompt}
                disabled={
                  !prompt.trim() ||
                  enhancing ||
                  loading ||
                  job_in_progress ||
                  !capabilities.supports_text
                }
                className="absolute right-2 top-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600dark:text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enhancing ? "Enhancing..." : "Enhance"}
              </button>
            </div>

            {/* File Upload */}
            {capabilities.supports_image && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handle_file_change}
                  disabled={loading || job_in_progress}
                  className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jade/10 file:text-jade hover:file:bg-jade/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {image_file && (
                  <div className="mt-2 flex items-center gap-2">
                    <FaImage className="text-jade" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {image_file.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handle_generate}
              disabled={!can_generate || loading || job_in_progress || models_loading}
              className="mt-4 w-full py-3 bg-gradient-to-r from-jade to-jade-darkdark:text-white font-medium rounded-xl hover:from-jade-dark hover:to-jade transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </>
              ) : job_in_progress ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaVideo />
                  <span>Generate Video</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="xl:col-span-4 space-y-6">
          {/* Model Selection */}
          <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Model</h3>
            <select
              value={model_id}
              onChange={(e) => set_model_id(e.target.value)}
              disabled={loading || models_loading || job_in_progress}
              className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-jade disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {models_loading ? (
                <option>Loading models...</option>
              ) : (
                video_models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Settings */}
          <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
              <button
                onClick={() => set_show_settings(!show_settings)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-4 ${!show_settings && "max-h-32 overflow-hidden"}`}>
              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaExpandArrowsAlt className="inline mr-2" />
                  Aspect Ratio
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    value={aspect_slider}
                    onChange={handle_aspect_slider_change}
                    disabled={loading || job_in_progress}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {ASPECT_OPTIONS.map((option) => (
                      <span key={option.value}>{option.value}</span>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {ASPECT_OPTIONS[aspect_slider].label}
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaClock className="inline mr-2" />
                  Duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={video_duration}
                    onChange={(e) => set_video_duration(parseInt(e.target.value))}
                    disabled={loading || job_in_progress}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                    {video_duration}s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Display */}
          <CostDisplay cost={duration_cost} />

          {/* Job History */}
          <VideoJobHistory
            on_job_select={(job) => {
              if (job.video_url) {
                set_video_url(job.video_url);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
