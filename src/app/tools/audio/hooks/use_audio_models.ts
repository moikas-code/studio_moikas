import { useState, useEffect } from 'react'
import type { ModelConfig } from '@/types/models'

interface AudioModel {
  id: string
  name: string
  cost: number
  supports_voice_cloning?: boolean
  voice_presets?: string[]
  model_config?: ModelConfig
}

export function useAudioModels(user_plan: string) {
  const [models, set_models] = useState<AudioModel[]>([])
  const [loading, set_loading] = useState(true)
  const [default_model_id, set_default_model_id] = useState<string>('')
  
  useEffect(() => {
    const fetch_models = async () => {
      try {
        set_loading(true)
        const response = await fetch('/api/models?type=audio')
        const data = await response.json()
        
        if (data.data && data.data.models) {
          const audio_models = data.data.models.map((model: ModelConfig & { effective_cost_mp: number }) => ({
            id: model.model_id,
            name: model.name,
            cost: model.effective_cost_mp,
            supports_voice_cloning: model.metadata?.supports_voice_cloning || false,
            voice_presets: model.metadata?.voice_presets || [],
            model_config: model
          }))
          
          set_models(audio_models)
          
          // Set default model
          if (audio_models.length > 0) {
            const default_model = audio_models.find((m: AudioModel) => m.model_config?.is_default) || audio_models[0]
            set_default_model_id(default_model.id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch audio models:', error)
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