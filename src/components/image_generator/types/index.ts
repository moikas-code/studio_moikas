export interface AspectPreset {
  name: string
  width: number
  height: number
  label: string
}

export interface ModelOption {
  id: string
  name: string
  cost: number
  description?: string
}

export interface GenerationResult {
  image_base64: string
  model_id: string
  prompt: string
  mana_points_used: number
  backend_cost?: number
  num_inference_steps?: number
  guidance_scale?: number
  style_name?: string
}

export interface SanaSettings {
  num_inference_steps: number
  guidance_scale: number
  style_name: string
  seed: number | undefined
}

export type Tool = 'select' | 'text' | 'pan'