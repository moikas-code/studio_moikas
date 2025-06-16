import { useState, useCallback, useEffect } from "react";
import { DEFAULT_SANA_SETTINGS } from "../utils/constants";
import type { SanaSettings } from "../types";

export function useSanaSettings(model_id?: string) {
  const [settings, set_settings] = useState<SanaSettings>(DEFAULT_SANA_SETTINGS);

  // Load settings from localStorage when model_id changes
  useEffect(() => {
    if (!model_id) return;

    try {
      const saved_settings_key = `sana_settings_${model_id}`;
      const saved_settings = localStorage.getItem(saved_settings_key);

      if (saved_settings) {
        const parsed_settings = JSON.parse(saved_settings);
        set_settings({ ...DEFAULT_SANA_SETTINGS, ...parsed_settings });
      } else {
        // Reset to defaults for new model
        set_settings(DEFAULT_SANA_SETTINGS);
      }
    } catch (error) {
      console.warn("Failed to load saved SANA settings:", error);
      set_settings(DEFAULT_SANA_SETTINGS);
    }
  }, [model_id]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!model_id) return;

    try {
      const saved_settings_key = `sana_settings_${model_id}`;
      localStorage.setItem(saved_settings_key, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save SANA settings:", error);
    }
  }, [settings, model_id]);

  const update_setting = useCallback(
    <K extends keyof SanaSettings>(key: K, value: SanaSettings[K]) => {
      set_settings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const update_inference_steps = useCallback(
    (steps: number) => {
      update_setting("num_inference_steps", steps);
    },
    [update_setting]
  );

  const update_guidance_scale = useCallback(
    (scale: number) => {
      update_setting("guidance_scale", scale);
    },
    [update_setting]
  );

  const update_style = useCallback(
    (style: string) => {
      update_setting("style_name", style);
    },
    [update_setting]
  );

  const update_seed = useCallback(
    (seed: number | undefined) => {
      update_setting("seed", seed);
    },
    [update_setting]
  );

  const reset_settings = useCallback(() => {
    set_settings(DEFAULT_SANA_SETTINGS);
  }, []);

  const load_model_defaults = useCallback(
    (model_config?: { default_cfg?: number; default_steps?: number }) => {
      if (!model_config) return;

      set_settings((prev) => ({
        ...prev,
        ...(model_config.default_cfg !== undefined && { guidance_scale: model_config.default_cfg }),
        ...(model_config.default_steps !== undefined && {
          num_inference_steps: model_config.default_steps,
        }),
      }));
    },
    []
  );

  const get_sana_params = useCallback(() => {
    if (settings.seed === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { seed: _seed, ...params } = settings;
      return params;
    }
    return settings;
  }, [settings]);

  return {
    ...settings,
    update_inference_steps,
    update_guidance_scale,
    update_style,
    update_seed,
    reset_settings,
    load_model_defaults,
    get_sana_params,
  };
}
