import { useState, useCallback, useEffect } from 'react'
import { ASPECT_OPTIONS } from '../utils/video-constants'
import type { VideoSettings } from '../types/video-effects'

export function use_video_settings(default_model_id: string) {
  const [settings, set_settings] = useState<VideoSettings>({
    aspect: "1:1",
    aspect_slider: 1,
    duration: 5,
    model_id: default_model_id
  })
  
  const [show_settings, set_show_settings] = useState(false)
  
  // Load saved model preference
  useEffect(() => {
    const saved_model = localStorage.getItem('videoEffectsModel')
    if (saved_model) {
      set_settings(prev => ({ ...prev, model_id: saved_model }))
    }
  }, [])
  
  const update_aspect = useCallback((slider_value: number) => {
    const option = ASPECT_OPTIONS.find(opt => opt.slider_value === slider_value)
    if (option) {
      set_settings(prev => ({
        ...prev,
        aspect: option.value,
        aspect_slider: slider_value
      }))
    }
  }, [])
  
  const update_duration = useCallback((duration: number) => {
    set_settings(prev => ({ ...prev, duration }))
  }, [])
  
  const update_model = useCallback((model_id: string) => {
    set_settings(prev => ({ ...prev, model_id }))
    localStorage.setItem('videoEffectsModel', model_id)
  }, [])
  
  const toggle_settings = useCallback(() => {
    set_show_settings(prev => !prev)
  }, [])
  
  return {
    ...settings,
    show_settings,
    update_aspect,
    update_duration,
    update_model,
    toggle_settings
  }
}