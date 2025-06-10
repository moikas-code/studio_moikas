'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useImageGeneration, type GenerationParams } from './hooks/use_image_generation'
import { usePromptEnhancement } from './hooks/use_prompt_enhancement'
import { useAspectRatio } from './hooks/use_aspect_ratio'
import { useSanaSettings } from './hooks/use_sana_settings'
import { Toaster, toast } from 'react-hot-toast'
import { Sparkles, Settings2, ChevronDown, Download, Copy, Edit2, Loader2 } from 'lucide-react'
import type { EmbeddingInput, LoraWeight } from './types'
import type { ModelConfig } from '@/types/models'
import EmbeddingsSelector from './components/settings/embeddings_selector'

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
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  
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
  const [show_model_dropdown, set_show_model_dropdown] = useState(false)
  const [generated_image, set_generated_image] = useState<{
    url: string
    prompt: string
    model: string
    timestamp: number
  } | null>(null)
  const [selected_embeddings, set_selected_embeddings] = useState<EmbeddingInput[]>([])
  const [selected_loras, set_selected_loras] = useState<LoraWeight[]>([])
  
  // Hooks
  const { is_loading, error_message, generate_image } = useImageGeneration()
  const { is_enhancing, enhance_prompt } = usePromptEnhancement()
  const aspect_ratio = useAspectRatio()
  const sana = useSanaSettings()
  
  // Auto-resize textarea
  useEffect(() => {
    if (textarea_ref.current) {
      textarea_ref.current.style.height = 'auto'
      textarea_ref.current.style.height = `${textarea_ref.current.scrollHeight}px`
    }
  }, [prompt_text])
  
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
      toast.success('Prompt enhanced!')
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
    
    // Add model-specific params
    if (model_config) {
      if (model_config.supports_cfg) {
        params.guidance_scale = sana.guidance_scale || model_config.default_cfg
      }
      if (model_config.supports_steps) {
        params.num_inference_steps = sana.num_inference_steps || model_config.default_steps
      }
      if (model_id.includes('sana') && sana.style_name) {
        params.style_name = sana.style_name
      }
      if (sana.seed !== undefined) {
        params.seed = sana.seed
      }
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
      set_generated_image({
        url: result.image_base64,
        prompt: prompt_text,
        model: model_id,
        timestamp: Date.now()
      })
      
      if (on_mp_update) {
        on_mp_update()
      }
    }
  }
  
  const handle_copy_image = async () => {
    if (!generated_image) return
    
    try {
      // Convert base64 to blob
      const base64_data = generated_image.url.split(',')[1] || generated_image.url
      const binary_string = window.atob(base64_data)
      const bytes = new Uint8Array(binary_string.length)
      for (let i = 0; i < binary_string.length; i++) {
        bytes[i] = binary_string.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'image/png' })
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      toast.success('Image copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy image:', error)
      toast.error('Failed to copy image')
    }
  }
  
  const handle_download_image = () => {
    if (!generated_image) return
    
    const link = document.createElement('a')
    link.href = generated_image.url.startsWith('data:') ? generated_image.url : `data:image/png;base64,${generated_image.url}`
    link.download = `generated-${Date.now()}.png`
    link.click()
    toast.success('Image downloaded!')
  }
  
  const selected_model = available_models.find(m => m.id === model_id)
  const can_generate = prompt_text.trim() && 
                      !is_loading && 
                      selected_model && 
                      (user_plan === 'admin' || available_mp >= selected_model.cost)
  
  // Loading state
  if (models_loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-base-content/40 mx-auto" />
          <p className="text-sm text-base-content/60 mt-3">Loading models...</p>
        </div>
      </div>
    )
  }
  
  // No models state
  if (available_models.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-base-100">
        <div className="text-center max-w-md">
          <p className="text-base-content/60">No image generation models available.</p>
          <p className="text-sm text-base-content/40 mt-1">Please contact support.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col bg-base-100">
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-base-200 text-base-content border border-base-300 shadow-xl',
          duration: 3000,
        }}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create</h1>
            <p className="text-sm sm:text-base text-base-content/60 mt-1">
              Transform your ideas into stunning visuals
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Section */}
            <div className="space-y-4">
              {/* Model Selector */}
              <div className="relative">
                <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                  Model
                </label>
                <button
                  onClick={() => set_show_model_dropdown(!show_model_dropdown)}
                  className="w-full px-4 py-3 bg-base-200/50 hover:bg-base-200 
                           rounded-xl transition-all flex items-center justify-between
                           text-sm sm:text-base group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{selected_model?.name || 'Select model'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {selected_model?.cost || 0} MP
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-base-content/40 group-hover:text-base-content/60 
                                         transition-all ${show_model_dropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {show_model_dropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 
                                bg-base-100 border border-base-200 rounded-xl 
                                shadow-2xl z-50 overflow-hidden">
                    {available_models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          set_model_id(model.id)
                          set_show_model_dropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-base-200/50 
                                  transition-all flex items-center justify-between
                                  ${model.id === model_id ? 'bg-primary/10' : ''}`}
                      >
                        <span className="text-sm sm:text-base">{model.name}</span>
                        <span className="text-xs text-base-content/60">{model.cost} MP</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Prompt Input */}
              <div>
                <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                  Prompt
                </label>
                <div className="relative">
                  <textarea
                    ref={textarea_ref}
                    value={prompt_text}
                    onChange={(e) => set_prompt_text(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        handle_generate()
                      }
                    }}
                    placeholder="A serene landscape with mountains..."
                    className="w-full px-4 py-3 bg-base-200/50 
                             rounded-xl resize-none
                             placeholder:text-base-content/40
                             focus:outline-none focus:ring-2 focus:ring-primary/20
                             min-h-[120px] max-h-[300px]
                             text-sm sm:text-base"
                    disabled={is_loading}
                  />
                  <button
                    onClick={handle_enhance}
                    disabled={!prompt_text.trim() || is_enhancing}
                    className="absolute bottom-3 right-3 p-2 rounded-lg 
                             bg-base-100 hover:bg-primary/10 
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all group"
                    title="Enhance prompt"
                  >
                    <Sparkles className={`w-4 h-4 ${
                      is_enhancing ? 'animate-pulse text-primary' : 'text-base-content/60 group-hover:text-primary'
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-base-content/40 mt-2">
                  Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to generate
                </p>
              </div>
              
              {/* Settings */}
              <div>
                <button
                  onClick={() => set_show_settings(!show_settings)}
                  className="flex items-center gap-2 text-sm text-base-content/60 
                           hover:text-base-content transition-colors"
                >
                  <Settings2 className={`w-4 h-4 transition-transform ${
                    show_settings ? 'rotate-90' : ''
                  }`} />
                  <span>Advanced Settings</span>
                </button>
                
                {show_settings && (
                  <div className="mt-4 p-4 bg-base-200/30 rounded-xl space-y-4">
                    {/* Aspect Ratio */}
                    <div>
                      <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-3">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {aspect_ratio.aspect_presets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => aspect_ratio.set_aspect_preset(index)}
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                              index === aspect_ratio.aspect_index
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-200/50 hover:bg-base-200 text-base-content/80'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Model-specific settings */}
                    {selected_model?.model_config?.supports_cfg && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Guidance Scale: {sana.guidance_scale}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max={selected_model.model_config.max_cfg || 20}
                          step="0.5"
                          value={sana.guidance_scale}
                          onChange={(e) => sana.update_guidance_scale(Number(e.target.value))}
                          className="w-full h-2 bg-base-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* Embeddings for SDXL */}
                    {selected_model?.model_config?.metadata?.supports_embeddings && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Embeddings & LoRAs
                        </label>
                        <EmbeddingsSelector
                          selected_embeddings={selected_embeddings}
                          selected_loras={selected_loras}
                          on_embeddings_change={set_selected_embeddings}
                          on_loras_change={set_selected_loras}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Generate Button */}
              <button
                onClick={handle_generate}
                disabled={!can_generate}
                className="w-full py-3 sm:py-4 bg-primary hover:bg-primary/90 
                         text-primary-content rounded-xl font-medium
                         disabled:bg-base-200 disabled:text-base-content/40
                         transition-all flex items-center justify-center gap-2
                         text-sm sm:text-base"
              >
                {is_loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    {selected_model && (
                      <span className="opacity-80">({selected_model.cost} MP)</span>
                    )}
                  </>
                )}
              </button>
              
              {/* Error Display */}
              {error_message && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
                  <p className="text-sm text-error">{error_message}</p>
                </div>
              )}
            </div>
            
            {/* Result Section */}
            <div className="bg-base-200/30 rounded-2xl p-4 sm:p-6 min-h-[400px] flex items-center justify-center">
              {generated_image ? (
                <div className="w-full space-y-4">
                  <div className="relative group">
                    <img
                      src={generated_image.url.startsWith('data:') ? generated_image.url : `data:image/png;base64,${generated_image.url}`}
                      alt="Generated image"
                      className="w-full rounded-xl shadow-xl"
                    />
                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={handle_copy_image}
                        className="p-2 bg-base-100/90 hover:bg-base-100 rounded-lg 
                                 backdrop-blur-sm transition-all"
                        title="Copy image"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handle_download_image}
                        className="p-2 bg-base-100/90 hover:bg-base-100 rounded-lg 
                                 backdrop-blur-sm transition-all"
                        title="Download image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push('/tools/image-editor')}
                        className="p-2 bg-base-100/90 hover:bg-base-100 rounded-lg 
                                 backdrop-blur-sm transition-all"
                        title="Edit image"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60">
                    <p className="font-medium mb-1">Prompt:</p>
                    <p className="text-base-content/80">{generated_image.prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-base-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-base-content/20" />
                  </div>
                  <p className="text-base-content/40 text-sm">
                    Your generated images will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}