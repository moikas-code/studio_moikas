'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PromptInput } from './components/input/prompt_input'
import { EnhanceButton } from './components/input/enhance_button'
import { SettingsPanel } from './components/settings/settings_panel'
import ErrorDisplay from '@/app/components/error_display'
import ImageGrid from '@/app/components/image_grid'
import { useImageGeneration, type GenerationParams } from './hooks/use_image_generation'
import { usePromptEnhancement } from './hooks/use_prompt_enhancement'
import { useAspectRatio } from './hooks/use_aspect_ratio'
import { useSanaSettings } from './hooks/use_sana_settings'
import { Toaster } from 'react-hot-toast'
import { Settings } from 'lucide-react'
import { FREE_IMAGE_MODELS, PREMIUM_IMAGE_MODELS } from '@/lib/ai_models'
import { calculate_final_cost } from '@/lib/pricing_config'

interface ImageGeneratorProps {
  available_mp: number
  on_mp_update?: () => void
  user_plan?: string
}

// Convert dollar cost to MP (1 MP = $0.001) with plan-based markup
const cost_to_mp = (cost: number, plan: string) => {
  const base_mp_cost = cost / 0.001
  return calculate_final_cost(base_mp_cost, plan)
}

// Get models based on user plan
const get_available_models = (plan: string = 'free') => {
  const all_models = [...FREE_IMAGE_MODELS, ...PREMIUM_IMAGE_MODELS]
  return all_models
    .filter(model => model.plans.includes(plan))
    .map(model => ({
      id: model.value,
      name: model.name,
      cost: cost_to_mp(model.custom_cost, plan)
    }))
}

export function ImageGenerator({ 
  available_mp, 
  on_mp_update,
  user_plan = 'free'
}: ImageGeneratorProps) {
  const router = useRouter()
  
  // Get available models based on user plan
  const available_models = get_available_models(user_plan)
  
  // State
  const [prompt_text, set_prompt_text] = useState('')
  const [model_id, set_model_id] = useState(available_models[0]?.id || 'fal-ai/sana/sprint')
  const [show_settings, set_show_settings] = useState(false)
  const [generated_images, set_generated_images] = useState<{
    id?: string
    url: string
    prompt: string
    model: string
    timestamp: number
  }[]>([])
  
  // Hooks
  const { is_loading, error_message, generate_image } = useImageGeneration()
  const { is_enhancing, enhancement_count, enhance_prompt } = usePromptEnhancement()
  const aspect_ratio = useAspectRatio()
  const sana = useSanaSettings()
  
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
    
    const dimensions = aspect_ratio.get_dimensions()
    const params: GenerationParams = {
      prompt: prompt_text,
      model: model_id,
      width: dimensions.width,
      height: dimensions.height
    }
    
    // Add SANA-specific params
    if (model_id.includes('sana')) {
      const sana_params = sana.get_sana_params()
      params.num_inference_steps = sana_params.num_inference_steps
      params.guidance_scale = sana_params.guidance_scale
      params.style_name = sana_params.style_name
      if (sana.seed !== undefined) {
        params.seed = sana.seed
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
                      available_mp >= selected_model.cost
  
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
          />
          </div>
        </div>
      </div>
    </div>
  )
}