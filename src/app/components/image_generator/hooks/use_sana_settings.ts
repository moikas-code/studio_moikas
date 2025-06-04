import { useState, useCallback } from 'react'
import { DEFAULT_SANA_SETTINGS } from '../utils/constants'
import type { SanaSettings } from '../types'

export function use_sana_settings() {
  const [settings, set_settings] = useState<SanaSettings>(DEFAULT_SANA_SETTINGS)
  
  const update_setting = useCallback(<K extends keyof SanaSettings>(
    key: K,
    value: SanaSettings[K]
  ) => {
    set_settings(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const update_inference_steps = useCallback((steps: number) => {
    update_setting('num_inference_steps', steps)
  }, [update_setting])
  
  const update_guidance_scale = useCallback((scale: number) => {
    update_setting('guidance_scale', scale)
  }, [update_setting])
  
  const update_style = useCallback((style: string) => {
    update_setting('style_name', style)
  }, [update_setting])
  
  const update_seed = useCallback((seed: number | undefined) => {
    update_setting('seed', seed)
  }, [update_setting])
  
  const reset_settings = useCallback(() => {
    set_settings(DEFAULT_SANA_SETTINGS)
  }, [])
  
  const get_sana_params = useCallback(() => {
    if (settings.seed === undefined) {
      const { seed, ...params } = settings
      return params
    }
    return settings
  }, [settings])
  
  return {
    ...settings,
    update_inference_steps,
    update_guidance_scale,
    update_style,
    update_seed,
    reset_settings,
    get_sana_params
  }
}