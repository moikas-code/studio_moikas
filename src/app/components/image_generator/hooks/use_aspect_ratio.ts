import { useState, useCallback } from 'react'
import { ASPECT_PRESETS } from '../utils/constants'

export function use_aspect_ratio() {
  const [aspect_index, set_aspect_index] = useState(0)
  
  const current_preset = ASPECT_PRESETS[aspect_index]
  
  const get_aspect_label = useCallback((index: number) => {
    const preset = ASPECT_PRESETS[index]
    return `${preset.name} ${preset.label}`
  }, [])
  
  const set_aspect_preset = useCallback((index: number) => {
    if (index >= 0 && index < ASPECT_PRESETS.length) {
      set_aspect_index(index)
    }
  }, [])
  
  const find_preset_index = useCallback((name: string) => {
    return ASPECT_PRESETS.findIndex(preset => preset.name === name)
  }, [])
  
  const get_dimensions = useCallback(() => {
    return {
      width: current_preset.width,
      height: current_preset.height
    }
  }, [current_preset])
  
  return {
    aspect_index,
    current_preset,
    aspect_presets: ASPECT_PRESETS,
    set_aspect_preset,
    get_aspect_label,
    find_preset_index,
    get_dimensions
  }
}