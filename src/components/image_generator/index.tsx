'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PromptInput } from './components/input/prompt_input'
import { EnhanceButton } from './components/input/enhance_button'
import { SettingsPanel } from './components/settings/settings_panel'
import ErrorDisplay from '@/components/error_display'
import ImageGrid from '@/components/image_grid'
import { useImageGeneration, type GenerationParams } from './hooks/use_image_generation'
import { usePromptEnhancement } from './hooks/use_prompt_enhancement'
import { useAspectRatio } from './hooks/use_aspect_ratio'
import { useSanaSettings } from './hooks/use_sana_settings'
import { Toaster } from 'react-hot-toast'
import { Settings } from 'lucide-react'
import type { EmbeddingInput, LoraWeight } from './types'
import type { ModelConfig } from '@/types/models'

interface ImageGeneratorProps {
  available_mp: number
  on_mp_update?: () => void
  user_plan?: string
}


export function ImageGenerator({ 
  available_mp, 
  on_mp_update,
  user_plan = 'free'
}: ImageGeneratorProps) {
  const router = useRouter()
  
  // State for models from database
  const [available_models, set_available_models] = useState<{
    id: string
    name: string
    cost: number
    model_config?: ModelConfig
  }[]>([])
  const [models_loading, set_models_loading] = useState(true)
  
  // State
  const [prompt_text, set_prompt_text] = useState('')
  const [model_id, set_model_id] = useState('')
  const [show_settings, set_show_settings] = useState(false)
  const [generated_images, set_generated_images] = useState<{
    id?: string
    url: string
    prompt: string
    model: string
    timestamp: number
  }[]>([])
  const [selected_embeddings, set_selected_embeddings] = useState<EmbeddingInput[]>([])
  const [selected_loras, set_selected_loras] = useState<LoraWeight[]>([])
  
  // Hooks
  const { is_loading, error_message, generate_image } = useImageGeneration()
  const { is_enhancing, enhancement_count, enhance_prompt } = usePromptEnhancement()
  const aspect_ratio = useAspectRatio()
  const sana = useSanaSettings()
  
  // Fetch available models from database
  useEffect(() => {
    const fetch_models = async () => {
      try {
        set_models_loading(true)
        const response = await fetch('/api/models?type=image')
        const data = await response.json()
        
        if (data.data && data.data.models) {
          const models = data.data.models.map((model: ModelConfig & { effective_cost_mp: number }) => ({
            id: model.model_id,
            name: model.name,
            cost: model.effective_cost_mp,
            model_config: model
          }))
          
          set_available_models(models)
          
          // Set default model
          if (models.length > 0) {
            const default_model = models.find((m: any) => m.model_config?.is_default) || models[0]
            set_model_id(default_model.id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        // Fallback to empty models
        set_available_models([])
      } finally {
        set_models_loading(false)
      }
    }
    
    fetch_models()
  }, [user_plan])
  
  // Handle prompt enhancement
  const handle_enhance = async () => {
    const enhanced = await enhance_prompt(prompt_text)
    if (enhanced) {
      set_prompt_text(enhanced)
    }
  }
  
  // Handle image generation
  const handle_generate = async () => {
    if (!prompt_text.trim()) return
    
    const selected_model = available_models.find(m => m.id === model_id)
    const model_config = selected_model?.model_config
    
    const dimensions = aspect_ratio.get_dimensions()
    const params: GenerationParams = {
      prompt: prompt_text,
      model: model_id,
      width: dimensions.width,
      height: dimensions.height
    }
    
    // Add model-specific params based on database configuration
    if (model_config) {
      // Add CFG if supported
      if (model_config.supports_cfg) {
        params.guidance_scale = sana.guidance_scale || model_config.default_cfg
      }
      
      // Add steps if supported
      if (model_config.supports_steps) {
        params.num_inference_steps = sana.num_inference_steps || model_config.default_steps
      }
      
      // Add style for SANA models
      if (model_id.includes('sana') && sana.style_name) {
        params.style_name = sana.style_name
      }
      
      // Add seed if provided
      if (sana.seed !== undefined) {
        params.seed = sana.seed
      }
      
      // Add embeddings and LoRAs for models that support them
      if (model_config.metadata?.supports_embeddings && (selected_embeddings.length > 0 || selected_loras.length > 0)) {
        if (selected_embeddings.length > 0) {
          params.embeddings = selected_embeddings
        }
        if (selected_loras.length > 0) {
          params.loras = selected_loras
        }
      }
    }
    
    const result = await generate_image(params)
    
    if (result) {
      console.log('Generated image result:', result)
      console.log('Base64 length:', result.image_base64?.length)
      
      set_generated_images(prev => [{
        url: result.image_base64, // Store just the base64 string
        prompt: prompt_text,
        model: model_id,
        timestamp: Date.now()
      }, ...prev])
      
      if (on_mp_update) {
        on_mp_update()
      }
    }
  }
  
  // Check if can generate
  const selected_model = available_models.find(m => m.id === model_id)
  const can_generate = prompt_text.trim() && 
                      !is_loading && 
                      selected_model && 
                      (user_plan === 'admin' || available_mp >= selected_model.cost)
  
  // Show loading state while fetching models
  if (models_loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    )
  }
  
  // Show error if no models available
  if (available_models.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="alert alert-warning">
          <span>No image generation models available. Please contact support.</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Image Generator</h1>
        <p className="text-base-content/70">
          Transform your ideas into stunning visuals
        </p>
      </div>
      
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-4">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <PromptInput
                value={prompt_text}
                on_change={set_prompt_text}
                on_submit={handle_generate}
                is_loading={is_loading}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                  <EnhanceButton
                    on_click={handle_enhance}
                    is_enhancing={is_enhancing}
                    enhancement_count={enhancement_count}
                    disabled={!prompt_text.trim()}
                  />
                  <button
                    onClick={() => set_show_settings(!show_settings)}
                    className="btn btn-ghost btn-sm gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                
                <button
                  onClick={handle_generate}
                  disabled={!can_generate}
                  className="btn btn-primary"
                >
                  {is_loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    `Generate (${selected_model?.cost || 0} MP)`
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {error_message && (
            <ErrorDisplay error_message={error_message} />
          )}
          
          {generated_images.length > 0 && (
            <ImageGrid 
              image_base64={generated_images.map(img => img.url)}
              prompt_text={generated_images[0]?.prompt || ''}
              mana_points_used={null}
              model_id={model_id}
              onEdit={() => router.push('/tools/image-editor')}
            />
          )}
        </div>
        
        <div className="order-1 lg:order-2 relative">
          {/* Mobile Settings - Always visible */}
          <div className="lg:hidden mb-4">
            <SettingsPanel
              is_open={true}
              on_close={() => {}}
              models={available_models}
              selected_model_id={model_id}
              on_model_change={set_model_id}
              user_mp={available_mp}
              aspect_presets={aspect_ratio.aspect_presets}
              aspect_index={aspect_ratio.aspect_index}
              on_aspect_change={aspect_ratio.set_aspect_preset}
              get_aspect_label={aspect_ratio.get_aspect_label}
              show_sana_options={selected_model?.model_config?.metadata?.supports_styles || model_id.includes('sana')}
              sana_settings={{
                num_inference_steps: sana.num_inference_steps,
                guidance_scale: sana.guidance_scale,
                style_name: sana.style_name,
                seed: sana.seed
              }}
              on_sana_change={{
                steps: sana.update_inference_steps,
                scale: sana.update_guidance_scale,
                style: sana.update_style,
                seed: sana.update_seed
              }}
              selected_embeddings={selected_embeddings}
              selected_loras={selected_loras}
              on_embeddings_change={set_selected_embeddings}
              on_loras_change={set_selected_loras}
            />
          </div>
          
          {/* Desktop Settings - Toggleable */}
          <div className="hidden lg:block">
          <SettingsPanel
            is_open={show_settings}
            on_close={() => set_show_settings(false)}
            models={available_models}
            selected_model_id={model_id}
            on_model_change={set_model_id}
            user_mp={available_mp}
            aspect_presets={aspect_ratio.aspect_presets}
            aspect_index={aspect_ratio.aspect_index}
            on_aspect_change={aspect_ratio.set_aspect_preset}
            get_aspect_label={aspect_ratio.get_aspect_label}
            show_sana_options={model_id.includes('sana')}
            sana_settings={{
              num_inference_steps: sana.num_inference_steps,
              guidance_scale: sana.guidance_scale,
              style_name: sana.style_name,
              seed: sana.seed
            }}
            on_sana_change={{
              steps: sana.update_inference_steps,
              scale: sana.update_guidance_scale,
              style: sana.update_style,
              seed: sana.update_seed
            }}
            selected_embeddings={selected_embeddings}
            selected_loras={selected_loras}
            on_embeddings_change={set_selected_embeddings}
            on_loras_change={set_selected_loras}
          />
          </div>
        </div>
      </div>
    </div>
  )
}