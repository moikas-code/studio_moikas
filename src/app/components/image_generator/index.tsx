'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PromptInput } from './components/input/prompt_input'
import { EnhanceButton } from './components/input/enhance_button'
import { SettingsPanel } from './components/settings/settings_panel'
import { ErrorDisplay } from '@/app/components/error_display'
import { ImageGrid } from '@/app/components/image_grid'
import { use_image_generation } from './hooks/use_image_generation'
import { use_prompt_enhancement } from './hooks/use_prompt_enhancement'
import { use_aspect_ratio } from './hooks/use_aspect_ratio'
import { use_sana_settings } from './hooks/use_sana_settings'
import { Toaster } from 'react-hot-toast'
import { Settings } from 'lucide-react'

interface ImageGeneratorProps {
  available_mp: number
  on_mp_update?: () => void
}

// Mock models data - should come from props or API
const MODELS = [
  { id: 'flux-pro', name: 'FLUX Pro', cost: 4 },
  { id: 'flux-dev', name: 'FLUX Dev', cost: 2 },
  { id: 'sana', name: 'SANA 1.0', cost: 1 }
]

export function ImageGenerator({ 
  available_mp, 
  on_mp_update 
}: ImageGeneratorProps) {
  const router = useRouter()
  
  // State
  const [prompt_text, set_prompt_text] = useState('')
  const [model_id, set_model_id] = useState('sana')
  const [show_settings, set_show_settings] = useState(false)
  const [generated_images, set_generated_images] = useState<any[]>([])
  
  // Hooks
  const { is_loading, error_message, generate_image, clear_error } = use_image_generation()
  const { is_enhancing, enhancement_count, enhance_prompt } = use_prompt_enhancement()
  const aspect_ratio = use_aspect_ratio()
  const sana = use_sana_settings()
  
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
    const params: any = {
      prompt: prompt_text,
      model: model_id,
      ...dimensions
    }
    
    // Add SANA-specific params
    if (model_id === 'sana') {
      Object.assign(params, sana.get_sana_params())
    }
    
    const result = await generate_image(params)
    
    if (result) {
      set_generated_images(prev => [{
        ...result,
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
  const selected_model = MODELS.find(m => m.id === model_id)
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
            <ErrorDisplay error={error_message} onDismiss={clear_error} />
          )}
          
          {generated_images.length > 0 && (
            <ImageGrid 
              images={generated_images}
              onEdit={(image) => router.push('/tools/image-editor')}
            />
          )}
        </div>
        
        <div className="relative">
          <SettingsPanel
            is_open={show_settings}
            on_close={() => set_show_settings(false)}
            models={MODELS}
            selected_model_id={model_id}
            on_model_change={set_model_id}
            user_mp={available_mp}
            aspect_presets={aspect_ratio.aspect_presets}
            aspect_index={aspect_ratio.aspect_index}
            on_aspect_change={aspect_ratio.set_aspect_preset}
            get_aspect_label={aspect_ratio.get_aspect_label}
            show_sana_options={model_id === 'sana'}
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
  )
}