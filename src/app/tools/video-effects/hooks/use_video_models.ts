import { useState, useEffect } from 'react'
import type { ModelConfig } from '@/types/models'

interface VideoModel {
  id: string
  name: string
  cost: number
  duration_options?: number[]
  supports_audio?: boolean
  model_config?: ModelConfig
}

export function useVideoModels(user_plan: string) {
  const [models, set_models] = useState<VideoModel[]>([])
  const [loading, set_loading] = useState(true)
  const [default_model_id, set_default_model_id] = useState<string>('')
  
  useEffect(() => {
    const fetch_models = async () => {
      try {
        set_loading(true)
        const response = await fetch('/api/models?type=video')
        const data = await response.json()
        
        if (data.data && data.data.models) {
          const video_models = data.data.models.map((model: ModelConfig & { effective_cost_mp: number }) => ({
            id: model.model_id,
            name: model.name,
            cost: model.effective_cost_mp,
            duration_options: model.duration_options || [5],
            supports_audio: model.supports_audio_generation || false,
            model_config: model
          }))
          
          set_models(video_models)
          
          // Set default model
          if (video_models.length > 0) {
            const default_model = video_models.find((m: VideoModel) => m.model_config?.is_default) || video_models[0]
            set_default_model_id(default_model.id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch video models:', error)
        set_models([])
      } finally {
        set_loading(false)
      }
    }
    
    fetch_models()
  }, [user_plan])
  
  return {
    models,
    loading,
    default_model_id
  }
}