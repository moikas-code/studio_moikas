"use client";

import React from "react";
import type { ModelConfig } from "@/types/models";
import type { SanaSettings } from "../../types";

interface ModelAdvancedOptionsProps {
  model_config: ModelConfig | undefined;
  // Common settings
  negative_prompt: string;
  set_negative_prompt: (value: string) => void;
  custom_seed: number | undefined;
  set_custom_seed: (value: number | undefined) => void;

  // SANA settings
  sana_settings: SanaSettings;
  sana_handlers: {
    update_inference_steps: (value: number) => void;
    update_guidance_scale: (value: number) => void;
    update_style: (value: string) => void;
  };

  // Model-specific settings
  num_images: number;
  set_num_images: (value: number) => void;
  enable_safety_checker: boolean;
  set_enable_safety_checker: (value: boolean) => void;
  expand_prompt: boolean;
  set_expand_prompt: (value: boolean) => void;
  image_format: "jpeg" | "png";
  set_image_format: (value: "jpeg" | "png") => void;
  custom_model_name: string;
  set_custom_model_name: (value: string) => void;

  // Additional settings that might be added
  clip_skip?: number;
  set_clip_skip?: (value: number) => void;
  eta?: number;
  set_eta?: (value: number) => void;
  scheduler?: string;
  set_scheduler?: (value: string) => void;
  enable_prompt_upsampling?: boolean;
  set_enable_prompt_upsampling?: (value: boolean) => void;
}

export function ModelAdvancedOptions({
  model_config,
  negative_prompt,
  set_negative_prompt,
  custom_seed,
  set_custom_seed,
  sana_settings,
  sana_handlers,
  num_images,
  set_num_images,
  enable_safety_checker,
  set_enable_safety_checker,
  expand_prompt,
  set_expand_prompt,
  image_format,
  set_image_format,
  custom_model_name,
  set_custom_model_name,
  clip_skip,
  set_clip_skip,
  eta,
  set_eta,
  scheduler,
  set_scheduler,
  enable_prompt_upsampling,
  set_enable_prompt_upsampling,
}: ModelAdvancedOptionsProps) {
  if (!model_config) return null;

  return (
    <>
      {/* Negative Prompt - Always show */}
      <div>
        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
          Negative Prompt
        </label>
        <textarea
          value={negative_prompt}
          onChange={(e) => set_negative_prompt(e.target.value)}
          placeholder="Things to avoid in the image (optional)..."
          className="w-full px-3 py-2 bg-base-200/50 rounded-lg
                   placeholder:text-base-content/40
                   focus:outline-none focus:ring-2 focus:ring-primary/20
                   min-h-[60px] text-sm"
        />
      </div>

      {/* Inference Steps */}
      {model_config.supports_steps && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Inference Steps ({sana_settings.num_inference_steps})
          </label>
          <input
            type="range"
            min={1}
            max={model_config.max_steps || 50}
            value={sana_settings.num_inference_steps}
            onChange={(e) => sana_handlers.update_inference_steps(parseInt(e.target.value))}
            className="range range-primary range-sm"
          />
          <div className="flex justify-between text-xs text-base-content/60 mt-1">
            <span>1</span>
            <span>{model_config.default_steps || 25}</span>
            <span>{model_config.max_steps || 50}</span>
          </div>
        </div>
      )}

      {/* Guidance Scale (CFG) */}
      {model_config.supports_cfg && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Guidance Scale ({sana_settings.guidance_scale})
          </label>
          <input
            type="range"
            min={model_config.min_cfg || 0}
            max={model_config.max_cfg || 20}
            step="0.5"
            value={sana_settings.guidance_scale}
            onChange={(e) => sana_handlers.update_guidance_scale(parseFloat(e.target.value))}
            className="range range-primary range-sm"
          />
          <div className="flex justify-between text-xs text-base-content/60 mt-1">
            <span>{model_config.min_cfg || 0}</span>
            <span>{model_config.default_cfg || 7.5}</span>
            <span>{model_config.max_cfg || 20}</span>
          </div>
        </div>
      )}

      {/* Style Presets */}
      {model_config.metadata?.style_presets &&
        Array.isArray(model_config.metadata.style_presets) && (
          <div>
            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
              Style Preset
            </label>
            <select
              value={sana_settings.style_name || "none"}
              onChange={(e) => sana_handlers.update_style(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              <option value="none">(No style)</option>
              {(model_config.metadata.style_presets as string[]).map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Number of Images */}
      {model_config.max_images > 1 && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Number of Images
          </label>
          <input
            type="number"
            min="1"
            max={model_config.max_images}
            value={num_images}
            onChange={(e) =>
              set_num_images(
                Math.min(model_config.max_images, Math.max(1, parseInt(e.target.value) || 1))
              )
            }
            className="input input-bordered input-sm w-full"
          />
        </div>
      )}

      {/* Checkboxes for various options */}
      {(model_config.metadata?.enable_safety_checker !== undefined ||
        model_config.metadata?.expand_prompt !== undefined ||
        (model_config.metadata?.supports_prompt_upsampling &&
          enable_prompt_upsampling !== undefined &&
          set_enable_prompt_upsampling)) && (
        <div className="flex flex-wrap gap-4">
          {/* Safety Checker */}
          {model_config.metadata?.enable_safety_checker !== undefined && (
            <label className="label cursor-pointer">
              <input
                type="checkbox"
                checked={enable_safety_checker}
                onChange={(e) => set_enable_safety_checker(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm"
              />
              <span className="label-text ml-2">Enable Safety Checker</span>
            </label>
          )}

          {/* Expand Prompt */}
          {model_config.metadata?.expand_prompt !== undefined && (
            <label className="label cursor-pointer">
              <input
                type="checkbox"
                checked={expand_prompt}
                onChange={(e) => set_expand_prompt(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm"
              />
              <span className="label-text ml-2">Expand Prompt</span>
            </label>
          )}

          {/* Prompt Upsampling */}
          {model_config.metadata?.supports_prompt_upsampling &&
            enable_prompt_upsampling !== undefined &&
            set_enable_prompt_upsampling && (
              <label className="label cursor-pointer">
                <input
                  type="checkbox"
                  checked={enable_prompt_upsampling}
                  onChange={(e) => set_enable_prompt_upsampling(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span className="label-text ml-2">Prompt Upsampling</span>
              </label>
            )}
        </div>
      )}

      {/* Output Format */}
      {model_config.metadata?.supported_formats &&
        Array.isArray(model_config.metadata.supported_formats) && (
          <div>
            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
              Output Format
            </label>
            <select
              value={image_format}
              onChange={(e) => set_image_format(e.target.value as "jpeg" | "png")}
              className="select select-bordered select-sm w-full"
            >
              {(model_config.metadata.supported_formats as string[]).map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Custom Model Name */}
      {model_config.metadata?.allow_custom_model_name && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Custom Model Name
          </label>
          <input
            type="text"
            value={custom_model_name}
            onChange={(e) => set_custom_model_name(e.target.value)}
            placeholder={
              (model_config.metadata.default_model_name as string) ||
              "stabilityai/stable-diffusion-xl-base-1.0"
            }
            className="input input-bordered input-sm w-full"
          />
          <p className="text-xs text-base-content/40 mt-1">
            Enter a Hugging Face model ID or leave blank for default
          </p>
        </div>
      )}

      {/* Scheduler */}
      {model_config.supported_schedulers &&
        model_config.supported_schedulers.length > 0 &&
        scheduler !== undefined &&
        set_scheduler && (
          <div>
            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
              Scheduler
            </label>
            <select
              value={
                scheduler || model_config.default_scheduler || model_config.supported_schedulers[0]
              }
              onChange={(e) => set_scheduler(e.target.value)}
              className="select select-bordered select-sm w-full"
            >
              {model_config.supported_schedulers.map((sched) => (
                <option key={sched} value={sched}>
                  {sched}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* Clip Skip */}
      {model_config.supports_clip_skip && clip_skip !== undefined && set_clip_skip && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Clip Skip ({clip_skip})
          </label>
          <input
            type="range"
            min={0}
            max={model_config.max_clip_skip || 2}
            value={clip_skip}
            onChange={(e) => set_clip_skip(parseInt(e.target.value))}
            className="range range-primary range-sm"
          />
          <div className="flex justify-between text-xs text-base-content/60 mt-1">
            <span>0</span>
            <span>{model_config.default_clip_skip || 0}</span>
            <span>{model_config.max_clip_skip || 2}</span>
          </div>
        </div>
      )}

      {/* Eta */}
      {model_config.supports_eta && eta !== undefined && set_eta && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Eta ({eta})
          </label>
          <input
            type="range"
            min={0}
            max={model_config.max_eta || 1}
            step="0.1"
            value={eta}
            onChange={(e) => set_eta(parseFloat(e.target.value))}
            className="range range-primary range-sm"
          />
          <div className="flex justify-between text-xs text-base-content/60 mt-1">
            <span>0</span>
            <span>{model_config.default_eta || 0}</span>
            <span>{model_config.max_eta || 1}</span>
          </div>
        </div>
      )}

      {/* Seed Input */}
      {model_config.metadata?.supports_seed && (
        <div>
          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
            Seed (Optional)
          </label>
          <input
            type="number"
            value={custom_seed || ""}
            onChange={(e) => set_custom_seed(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Random seed"
            className="input input-bordered input-sm w-full"
          />
          <p className="text-xs text-base-content/40 mt-1">Leave empty for random seed</p>
        </div>
      )}
    </>
  );
}
