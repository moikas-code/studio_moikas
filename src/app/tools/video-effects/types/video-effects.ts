export interface AspectOption {
  label: string
  value: string
  slider_value: number
}

export interface VideoModel {
  value: string
  label: string
  cost: number
  is_image_to_video?: boolean
}

export interface VideoGenerationParams {
  prompt: string
  model: string
  aspect_ratio: string
  duration: number
  image_url?: string
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed'
  video_url?: string
  error?: string
  progress?: number
}

export interface VideoSettings {
  aspect: string
  aspect_slider: number
  duration: number
  model_id: string
}