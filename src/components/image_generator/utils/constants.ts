import type { AspectPreset } from '../types'

export const ASPECT_PRESETS: AspectPreset[] = [
  { name: '1:1', width: 1024, height: 1024, label: 'Square' },
  { name: '16:9', width: 1920, height: 1080, label: 'Wide' },
  { name: '9:16', width: 1080, height: 1920, label: 'Portrait' },
  { name: '4:3', width: 1024, height: 768, label: 'Standard' },
  { name: '3:2', width: 1536, height: 1024, label: 'Classic' },
  { name: '2:3', width: 1024, height: 1536, label: 'Tall' },
  { name: '21:9', width: 2560, height: 1080, label: 'Ultrawide' },
  { name: '9:21', width: 1080, height: 2560, label: 'Phone' }
]

export const SANA_STYLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'photographic', label: 'Photographic' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy-art', label: 'Fantasy Art' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'comic-book', label: 'Comic Book' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: '3d-model', label: '3D Model' },
  { value: 'neon-punk', label: 'Neon Punk' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'analog-film', label: 'Analog Film' },
  { value: 'isometric', label: 'Isometric' }
]

export const DEFAULT_SANA_SETTINGS = {
  num_inference_steps: 28,
  guidance_scale: 7.5,
  style_name: 'none',
  seed: undefined
}

export const GENERATION_LIMITS = {
  prompt_max_length: 100000,
  preview_max_size: 1024 * 1024,
  max_seed: 2147483647
}