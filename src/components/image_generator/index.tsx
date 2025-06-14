'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useImageGeneration, type GenerationParams } from './hooks/use_image_generation'
import { usePromptEnhancement } from './hooks/use_prompt_enhancement'
import { useAspectRatio } from './hooks/use_aspect_ratio'
import { useSanaSettings } from './hooks/use_sana_settings'
import { Toaster, toast } from 'react-hot-toast'
import { Sparkles, Settings2, ChevronDown, Download, Copy, Edit2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [generated_images, set_generated_images] = useState<{
    urls: string[]
    prompt: string
    model: string
    timestamp: number
    total_cost: number
    cost_per_image: number
    inference_time?: number
    dynamic_pricing?: boolean
  } | null>(null)
  const [selected_image_index, set_selected_image_index] = useState(0)
  const [selected_embeddings, set_selected_embeddings] = useState<EmbeddingInput[]>([])
  const [selected_loras, set_selected_loras] = useState<LoraWeight[]>([])
  const [negative_prompt, set_negative_prompt] = useState('')
  const [num_images, set_num_images] = useState(1)
  const [enable_safety_checker, set_enable_safety_checker] = useState(true)
  const [expand_prompt, set_expand_prompt] = useState(true)
  const [image_format, set_image_format] = useState<'jpeg' | 'png'>('jpeg')
  const [custom_seed, set_custom_seed] = useState<number | undefined>(undefined)
  const [custom_model_name, set_custom_model_name] = useState<string>('')
  
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
            const default_model = models.find((m: typeof models[0]) => m.model_config?.is_default) || models[0]
            set_model_id(default_model.id)
            
            // Set default model name if available
            if (default_model.model_config?.metadata?.default_model_name) {
              set_custom_model_name(default_model.model_config.metadata.default_model_name as string)
            }
            
            // Update sana settings with model defaults
            if (default_model.model_config) {
              if (default_model.model_config.default_cfg) {
                sana.update_guidance_scale(default_model.model_config.default_cfg)
              }
              if (default_model.model_config.default_steps) {
                sana.update_inference_steps(default_model.model_config.default_steps)
              }
            }
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
  }, [user_plan, sana])
  
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
    
    // Add negative prompt if provided
    if (negative_prompt.trim()) {
      params.negative_prompt = negative_prompt
    }
    
    // Add seed if provided
    if (custom_seed !== undefined) {
      params.seed = custom_seed
    } else if (sana.seed !== undefined) {
      params.seed = sana.seed
    }
    
    // Add model-specific params - ONLY if the model supports them
    if (model_config) {
      // Only add guidance_scale if the model explicitly supports it
      if (model_config.supports_cfg) {
        params.guidance_scale = sana.guidance_scale || model_config.default_cfg || 7.5
      }
      
      // Only add num_inference_steps if the model explicitly supports it
      if (model_config.supports_steps) {
        params.num_inference_steps = sana.num_inference_steps || model_config.default_steps || 25
      }
      
      // SANA specific style
      if (model_id.includes('sana') && sana.style_name && sana.style_name !== 'none') {
        params.style_name = sana.style_name
      }
      
      // Add custom model name for LoRA models
      if ((model_config.supports_loras || model_id === 'fal-ai/lora') && 
          model_config.metadata?.allow_custom_model_name && 
          custom_model_name.trim()) {
        params.model_name = custom_model_name.trim()
        console.log('[Image Generator] Using custom model name:', params.model_name)
      }
    } else {
      // If no model config, don't send any advanced parameters
      console.log('[Image Generator] No model config found, using minimal parameters')
    }
      
      // Fast-SDXL specific parameters
      if (model_id === 'fal-ai/fast-sdxl') {
        params.num_images = num_images
        params.enable_safety_checker = enable_safety_checker
        params.expand_prompt = expand_prompt
        params.format = image_format
        
        if (selected_embeddings.length > 0) {
          params.embeddings = selected_embeddings
        }
        if (selected_loras.length > 0) {
          console.log('[Image Generator] Selected LoRAs:', JSON.stringify(selected_loras, null, 2))
          params.loras = selected_loras
        }
      } else if (model_config.metadata?.supports_embeddings && (selected_embeddings.length > 0 || selected_loras.length > 0)) {
        if (selected_embeddings.length > 0) {
          params.embeddings = selected_embeddings
        }
        if (selected_loras.length > 0) {
          console.log('[Image Generator] Selected LoRAs:', JSON.stringify(selected_loras, null, 2))
          params.loras = selected_loras
        }
      }
    }
    
    console.log('[Image Generator] Model config:', model_config)
    console.log('[Image Generator] Final params being sent:', JSON.stringify(params, null, 2))
    const result = await generate_image(params)
    
    if (result) {
      set_generated_images({
        urls: result.images || [result.image_base64],
        prompt: prompt_text,
        model: model_id,
        timestamp: Date.now(),
        total_cost: result.total_cost || result.mana_points_used,
        cost_per_image: result.cost_per_image || result.mana_points_used,
        inference_time: result.inference_time,
        dynamic_pricing: result.dynamic_pricing
      })
      set_selected_image_index(0) // Reset to first image
      
      if (on_mp_update) {
        on_mp_update()
      }
    }
  }
  
  const handle_copy_image = async () => {
    if (!generated_images || generated_images.urls.length === 0) return
    
    try {
      // Convert base64 to blob
      const current_image = generated_images.urls[selected_image_index]
      const base64_data = current_image.split(',')[1] || current_image
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
    if (!generated_images || generated_images.urls.length === 0) return
    
    const current_image = generated_images.urls[selected_image_index]
    const link = document.createElement('a')
    link.href = current_image.startsWith('data:') ? current_image : `data:image/png;base64,${current_image}`
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
                          
                          // Set default model name if available for LoRA models
                          if (model.model_config?.metadata?.default_model_name) {
                            set_custom_model_name(model.model_config.metadata.default_model_name as string)
                          } else {
                            set_custom_model_name('')
                          }
                          
                          // Update sana settings with model defaults
                          if (model.model_config) {
                            if (model.model_config.default_cfg !== undefined) {
                              sana.update_guidance_scale(model.model_config.default_cfg)
                            }
                            if (model.model_config.default_steps !== undefined) {
                              sana.update_inference_steps(model.model_config.default_steps)
                            }
                          }
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
                    
                    {/* Negative Prompt for all models that support it */}
                    <div>
                      <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                        Negative Prompt
                      </label>
                      <textarea
                        value={negative_prompt}
                        onChange={(e) => set_negative_prompt(e.target.value)}
                        placeholder="Things to avoid in the image (optional)..."
                        className="w-full px-3 py-2 bg-base-200/50 rounded-lg
                                 placeholder:text-base-content/40
                                 focus:outline-none focus:ring-2 focus:ring-primary/20
                                 min-h-[60px] text-sm"
                      />
                    </div>
                    
                    {/* Model-specific settings */}
                    {!!selected_model?.model_config?.supports_cfg && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Guidance Scale (CFG): {sana.guidance_scale}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={selected_model.model_config.max_cfg || 20}
                          step="0.5"
                          value={sana.guidance_scale}
                          onChange={(e) => sana.update_guidance_scale(Number(e.target.value))}
                          className="w-full h-2 bg-base-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* Inference Steps */}
                    {!!selected_model?.model_config?.supports_steps && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Inference Steps: {sana.num_inference_steps}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max={selected_model.model_config.max_steps || 50}
                          step="1"
                          value={sana.num_inference_steps}
                          onChange={(e) => sana.update_inference_steps(Number(e.target.value))}
                          className="w-full h-2 bg-base-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                    
                    {/* Fast-SDXL specific settings */}
                    {model_id === 'fal-ai/fast-sdxl' && (
                      <>
                        {/* Number of Images */}
                        <div>
                          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                            Number of Images: {num_images}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            step="1"
                            value={num_images}
                            onChange={(e) => set_num_images(Number(e.target.value))}
                            className="w-full h-2 bg-base-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        
                        {/* Image Format */}
                        <div>
                          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                            Image Format
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => set_image_format('jpeg')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                image_format === 'jpeg' 
                                  ? 'bg-primary text-primary-content' 
                                  : 'bg-base-200/50 hover:bg-base-200'
                              }`}
                            >
                              JPEG
                            </button>
                            <button
                              onClick={() => set_image_format('png')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                image_format === 'png' 
                                  ? 'bg-primary text-primary-content' 
                                  : 'bg-base-200/50 hover:bg-base-200'
                              }`}
                            >
                              PNG
                            </button>
                          </div>
                        </div>
                        
                        {/* Toggle Options */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={expand_prompt}
                              onChange={(e) => set_expand_prompt(e.target.checked)}
                              className="checkbox checkbox-sm checkbox-primary"
                            />
                            <span className="text-xs font-medium">Expand Prompt</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enable_safety_checker}
                              onChange={(e) => set_enable_safety_checker(e.target.checked)}
                              className="checkbox checkbox-sm checkbox-primary"
                            />
                            <span className="text-xs font-medium">Enable Safety Checker</span>
                          </label>
                        </div>
                      </>
                    )}
                    
                    {/* Custom Model Name for LoRA models */}
                    {selected_model?.model_config && 
                     (!!selected_model.model_config.supports_loras || model_id === 'fal-ai/lora') && 
                     !!selected_model.model_config.metadata?.allow_custom_model_name && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Model Name (HuggingFace/CivitAI)
                        </label>
                        <input
                          type="text"
                          value={custom_model_name}
                          onChange={(e) => set_custom_model_name(e.target.value)}
                          placeholder={selected_model.model_config.metadata?.default_model_name as string || "e.g., stabilityai/stable-diffusion-xl-base-1.0"}
                          className="w-full px-3 py-2 bg-base-200/50 rounded-lg
                                   placeholder:text-base-content/40
                                   focus:outline-none focus:ring-2 focus:ring-primary/20
                                   text-sm"
                        />
                        <p className="text-xs text-base-content/40 mt-1">
                          Enter any Stable Diffusion model from HuggingFace or CivitAI
                        </p>
                      </div>
                    )}
                    
                    {/* Seed */}
                    <div>
                      <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                        Seed (Optional)
                      </label>
                      <input
                        type="number"
                        value={custom_seed || ''}
                        onChange={(e) => set_custom_seed(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Random"
                        className="w-full px-3 py-2 bg-base-200/50 rounded-lg
                                 placeholder:text-base-content/40
                                 focus:outline-none focus:ring-2 focus:ring-primary/20
                                 text-sm"
                      />
                    </div>
                    
                    {/* Embeddings for SDXL */}
                    {model_id === 'fal-ai/fast-sdxl' && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Embeddings & LoRAs
                        </label>
                        <EmbeddingsSelector
                          modelId={model_id}
                          selectedEmbeddings={selected_embeddings}
                          selectedLoras={selected_loras}
                          onEmbeddingsChange={set_selected_embeddings}
                          onLorasChange={set_selected_loras}
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
                      <span className="opacity-80">
                        ({selected_model.cost * num_images} MP{num_images > 1 && ` for ${num_images} images`})
                      </span>
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
              {generated_images ? (
                <div className="w-full space-y-4">
                  {/* Multiple images navigation */}
                  {generated_images.urls.length > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => set_selected_image_index(Math.max(0, selected_image_index - 1))}
                        disabled={selected_image_index === 0}
                        className="btn btn-circle btn-sm btn-ghost"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-base-content/60">
                        Image {selected_image_index + 1} of {generated_images.urls.length}
                      </span>
                      <button
                        onClick={() => set_selected_image_index(Math.min(generated_images.urls.length - 1, selected_image_index + 1))}
                        disabled={selected_image_index === generated_images.urls.length - 1}
                        className="btn btn-circle btn-sm btn-ghost"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generated_images.urls[selected_image_index].startsWith('data:') 
                        ? generated_images.urls[selected_image_index] 
                        : `data:image/png;base64,${generated_images.urls[selected_image_index]}`}
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
                        onClick={() => {
                          // Store image data in localStorage for the editor
                          const current_image = generated_images.urls[selected_image_index]
                          const image_data = {
                            base64: current_image.startsWith('data:') 
                              ? current_image 
                              : `data:image/png;base64,${current_image}`,
                            prompt: generated_images.prompt,
                            timestamp: Date.now()
                          }
                          console.log('[Image Generator] Storing image for transfer:', {
                            hasBase64: !!image_data.base64,
                            base64Length: image_data.base64.length,
                            prompt: image_data.prompt,
                            timestamp: image_data.timestamp
                          })
                          localStorage.setItem('imageEditorTransfer', JSON.stringify(image_data))
                          console.log('[Image Generator] Navigating to image editor...')
                          router.push('/tools/image-editor')
                        }}
                        className="p-2 bg-base-100/90 hover:bg-base-100 rounded-lg 
                                 backdrop-blur-sm transition-all"
                        title="Edit image"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60 space-y-2">
                    <div>
                      <p className="font-medium mb-1">Prompt:</p>
                      <p className="text-base-content/80">{generated_images.prompt}</p>
                    </div>
                    <div className="flex items-center gap-4 text-base-content/70">
                      <span>Model: {generated_images.model}</span>
                      <span>•</span>
                      <span>Total Cost: {generated_images.total_cost} MP</span>
                      {generated_images.urls.length > 1 && (
                        <>
                          <span>•</span>
                          <span>{generated_images.cost_per_image} MP per image</span>
                        </>
                      )}
                      {generated_images.dynamic_pricing && generated_images.inference_time && (
                        <>
                          <span>•</span>
                          <span className="text-primary/80">Dynamic pricing: {generated_images.inference_time.toFixed(2)}s</span>
                        </>
                      )}
                    </div>
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