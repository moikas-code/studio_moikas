'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useJobBasedImageGeneration } from './hooks/use_job_based_image_generation'
import { usePromptEnhancement } from './hooks/use_prompt_enhancement'
import { useAspectRatio } from './hooks/use_aspect_ratio'
import { useSanaSettings } from './hooks/use_sana_settings'
import { Toaster, toast } from 'react-hot-toast'
import { Sparkles, Settings2, ChevronDown, Download, Copy, Edit2, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { EmbeddingInput, LoraWeight } from './types'
import type { ModelConfig } from '@/types/models'
import type { GenerationParams } from './hooks/use_image_generation'
import EmbeddingsSelector from './components/settings/embeddings_selector'
import { JobHistoryPanel } from './components/display/job_history_panel'

interface ImageGeneratorProps {
  available_mp: number
  on_mp_update?: () => void
  user_plan?: string
  use_job_system?: boolean // Toggle between immediate and job-based generation
}

export function ImageGeneratorWithJobs({
  available_mp,
  on_mp_update,
  user_plan = 'free',
  use_job_system = true
}: ImageGeneratorProps) {
  const router = useRouter()
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  const { isLoaded: auth_loaded, isSignedIn } = useAuth()

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
  const [model_id, set_model_id] = useState<string | null>(null)
  const [show_settings, set_show_settings] = useState(false)
  const [show_model_dropdown, set_show_model_dropdown] = useState(false)
  const [show_job_history, set_show_job_history] = useState(false)
  const [generated_images, set_generated_images] = useState<{
    urls: string[]
    prompt: string
    model: string
    timestamp: number
    total_cost: number
    inference_time?: number
  } | null>(null)
  const [current_image_index, set_current_image_index] = useState(0)
  const [selected_embeddings, set_selected_embeddings] = useState<EmbeddingInput[]>([])
  const [selected_loras, set_selected_loras] = useState<LoraWeight[]>([])
  const [negative_prompt, set_negative_prompt] = useState('')
  const [num_images, set_num_images] = useState(1)
  const [enable_safety_checker, set_enable_safety_checker] = useState(true)
  const [expand_prompt, set_expand_prompt] = useState(true)
  const [image_format, set_image_format] = useState<'jpeg' | 'png'>('jpeg')
  const [custom_seed, set_custom_seed] = useState<number | undefined>(undefined)
  const [custom_model_name, set_custom_model_name] = useState<string>('')
  const [generation_start_time, set_generation_start_time] = useState<number | null>(null)
  const [elapsed_seconds, set_elapsed_seconds] = useState<number>(0)

  // Hooks
  const job_generation = useJobBasedImageGeneration()
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
    // Wait for auth to be loaded
    if (!auth_loaded) return

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
          }
        } else {
          console.error('Invalid models response:', data)
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        set_available_models([])
      } finally {
        set_models_loading(false)
      }
    }

    fetch_models()
  }, [user_plan, auth_loaded])

  // Set initial sana settings when models are loaded and model_id is set
  useEffect(() => {
    if (!models_loading && available_models.length > 0 && model_id) {
      const selected_model = available_models.find(m => m.id === model_id)
      if (selected_model?.model_config) {
        if (selected_model.model_config.default_cfg !== undefined) {
          sana.update_guidance_scale(selected_model.model_config.default_cfg)
        }
        if (selected_model.model_config.default_steps !== undefined) {
          sana.update_inference_steps(selected_model.model_config.default_steps)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model_id, models_loading])

  // Update generated images when job completes
  useEffect(() => {
    if (job_generation.current_job?.status === 'completed') {
      // Stop the timer
      set_generation_start_time(null)

      // Extract job details from the current job's metadata or use current values
      const job_prompt = job_generation.current_job.prompt || prompt_text
      const job_model = job_generation.current_job.model || model_id

      // Handle both single and multiple images
      let image_urls: string[] = []
      if (job_generation.current_job.images && job_generation.current_job.images.length > 0) {
        image_urls = job_generation.current_job.images
      } else if (job_generation.current_job.image_url) {
        image_urls = [job_generation.current_job.image_url]
      }

      // Calculate elapsed time from job timestamps if available
      let elapsed_time: number | undefined
      if (job_generation.current_job.created_at && job_generation.current_job.completed_at) {
        const created = new Date(job_generation.current_job.created_at).getTime()
        const completed = new Date(job_generation.current_job.completed_at).getTime()
        elapsed_time = (completed - created) / 1000 // Convert to seconds
      }

      if (image_urls.length > 0) {
        set_generated_images({
          urls: image_urls,
          prompt: job_prompt,
          model: job_model,
          timestamp: Date.now(),
          total_cost: job_generation.current_job.cost,
          inference_time: job_generation.current_job.metadata?.inference_time || elapsed_time
        })
        set_current_image_index(0) // Reset to first image

        if (on_mp_update) {
          on_mp_update()
        }
      }
    } else if (job_generation.current_job?.status === 'failed') {
      // Stop the timer on failure
      set_generation_start_time(null)
    }
  }, [job_generation.current_job?.status, job_generation.current_job?.images, job_generation.current_job?.image_url])

  // Timer effect for tracking elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (generation_start_time) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - generation_start_time) / 1000
        set_elapsed_seconds(elapsed)
      }, 100) // Update every 100ms for smooth display
    } else {
      set_elapsed_seconds(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [generation_start_time])

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

    if (!model_id) return

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

    // Add model-specific params
    if (model_config) {
      if (model_config.supports_cfg) {
        params.guidance_scale = sana.guidance_scale || model_config.default_cfg || 7.5
      }

      if (model_config.supports_steps) {
        params.num_inference_steps = sana.num_inference_steps || model_config.default_steps || 25
      }

      if (model_id.includes('sana') && sana.style_name && sana.style_name !== 'none') {
        params.style_name = sana.style_name
      }

      // For fal-ai/lora, model_name is required
      if (model_id === 'fal-ai/lora') {
        params.model_name = custom_model_name.trim() ||
          (model_config.metadata?.default_model_name as string) ||
          'stabilityai/stable-diffusion-xl-base-1.0'
      } else if (model_config.supports_loras &&
        model_config.metadata?.allow_custom_model_name &&
        custom_model_name.trim()) {
        params.model_name = custom_model_name.trim()
      }
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
        params.loras = selected_loras
      }
    } else if (model_config?.metadata?.supports_embeddings && (selected_embeddings.length > 0 || selected_loras.length > 0)) {
      if (selected_embeddings.length > 0) {
        params.embeddings = selected_embeddings
      }
      if (selected_loras.length > 0) {
        params.loras = selected_loras
      }
    }

    // Clear previous result
    set_generated_images(null)

    // Start the timer
    set_generation_start_time(Date.now())

    // Submit job
    const result = await job_generation.submit_job(params)

    if (result) {
      // Generate a new seed for the next generation
      const new_seed = Math.floor(Math.random() * 2147483647)
      set_custom_seed(new_seed)
    }
  }

  const handle_copy_image = async () => {
    if (!generated_images) return

    try {
      const current_url = generated_images.urls[current_image_index]
      let blob: Blob

      if (current_url.startsWith('http')) {
        // For external URLs, fetch the image
        const response = await fetch(current_url)
        blob = await response.blob()
      } else if (current_url.startsWith('data:')) {
        // For data URLs, convert to blob
        const base64_data = current_url.split(',')[1]
        const binary_string = window.atob(base64_data)
        const bytes = new Uint8Array(binary_string.length)
        for (let i = 0; i < binary_string.length; i++) {
          bytes[i] = binary_string.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: 'image/png' })
      } else {
        // Assume it's raw base64
        const binary_string = window.atob(current_url)
        const bytes = new Uint8Array(binary_string.length)
        for (let i = 0; i < binary_string.length; i++) {
          bytes[i] = binary_string.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: 'image/png' })
      }

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ])
      toast.success('Image copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy image:', error)
      toast.error('Failed to copy image')
    }
  }

  const handle_download_image = async () => {
    if (!generated_images) return

    const current_url = generated_images.urls[current_image_index]

    try {
      if (current_url.startsWith('http')) {
        // For external URLs, fetch and create a blob
        const response = await fetch(current_url)
        const blob = await response.blob()
        const blob_url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = blob_url
        link.download = `generated-${Date.now()}.png`
        link.click()

        // Clean up
        URL.revokeObjectURL(blob_url)
      } else {
        // For data URLs, download directly
        const link = document.createElement('a')
        link.href = current_url
        link.download = `generated-${Date.now()}.png`
        link.click()
      }

      toast.success('Image downloaded!')
    } catch (error) {
      console.error('Failed to download image:', error)
      toast.error('Failed to download image')
    }
  }

  const selected_model = model_id ? available_models.find(m => m.id === model_id) : null
  const can_generate = useMemo(() => {
    console.log('can_generate', prompt_text.trim(), job_generation.is_loading)
    return prompt_text.trim() &&
      !job_generation.is_loading && (!job_generation.current_job || job_generation.current_job.status === 'completed' || job_generation.current_job.status === 'failed') &&
      selected_model &&
      (user_plan === 'admin' || (available_mp >= selected_model.cost))
  }, [prompt_text, job_generation.is_loading, job_generation.current_job, selected_model, available_mp, user_plan])

  // Loading state
  if (!auth_loaded || models_loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-base-content/60">{!auth_loaded ? 'Authenticating...' : 'Loading models...'}</p>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="text-center">
          <p className="text-base-content/60 mb-4">Please sign in to use the image generator</p>
          <button
            onClick={() => router.push('/sign-in')}
            className="btn btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-base-100 flex flex-col lg:flex-row">
      <Toaster position="top-center" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Image Generator</h1>
            <p className="text-base-content/60">Create stunning images with AI</p>
          </div>

          {/* Controls */}
          <div className="bg-base-200/30 rounded-2xl p-4 sm:p-6 backdrop-blur">
            <div className="space-y-6">
              {/* Model Selection & Job History Toggle */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                    Model
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => set_show_model_dropdown(!show_model_dropdown)}
                      className="w-full px-4 py-3 bg-base-200/50 rounded-xl
                               text-left flex items-center justify-between
                               hover:bg-base-200/70 transition-colors"
                      disabled={models_loading}
                    >
                      <span className="flex items-center gap-3">
                        {selected_model ? (
                          <>
                            <span className="font-medium">{selected_model.name}</span>
                            <span className="text-xs text-base-content/60">
                              {selected_model.model_config?.billing_type === 'time_based' ? (
                                `${selected_model.cost} MP/s`
                              ) : (
                                `${selected_model.cost} MP`
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="text-base-content/40">Select a model...</span>
                        )}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${show_model_dropdown ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {show_model_dropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-base-200 rounded-xl 
                                    shadow-xl border border-base-300/50 overflow-hidden">
                        {available_models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              set_model_id(model.id)
                              set_show_model_dropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-base-300/50 
                                     transition-colors flex items-center justify-between
                                     ${model.id === model_id ? 'bg-primary/10' : ''}`}
                          >
                            <span className="font-medium">{model.name}</span>
                            <span className="text-sm text-base-content/60">
                              {model.model_config?.billing_type === 'time_based' ? (
                                `${model.cost} MP/s`
                              ) : (
                                `${model.cost} MP`
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => set_show_job_history(!show_job_history)}
                  className={`btn btn-ghost btn-sm ${show_job_history ? 'btn-active' : ''}`}
                  title="Job History"
                >
                  <Clock className="w-4 h-4" />
                </button>
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
                      if (can_generate && (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
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
                    disabled={job_generation.is_loading}
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
                    <Sparkles className={`w-4 h-4 ${is_enhancing ? 'animate-pulse text-primary' : 'text-base-content/60 group-hover:text-primary'
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
                  <Settings2 className={`w-4 h-4 transition-transform ${show_settings ? 'rotate-90' : ''
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
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${index === aspect_ratio.aspect_index
                              ? 'bg-primary text-primary-content'
                              : 'bg-base-200/50 hover:bg-base-200 text-base-content/80'
                              }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Negative Prompt */}
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

                    {/* SANA Settings */}
                    {selected_model?.id.includes('sana') && (
                      <>
                        {selected_model.model_config?.supports_steps && (
                          <div>
                            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                              Inference Steps ({sana.num_inference_steps})
                            </label>
                            <input
                              type="range"
                              min={selected_model.model_config.min_steps || 20}
                              max={selected_model.model_config.max_steps || 40}
                              value={sana.num_inference_steps}
                              onChange={(e) => sana.update_inference_steps(parseInt(e.target.value))}
                              className="range range-primary range-sm"
                            />
                          </div>
                        )}

                        {selected_model.model_config?.supports_cfg && (
                          <div>
                            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                              Guidance Scale ({sana.guidance_scale})
                            </label>
                            <input
                              type="range"
                              min={selected_model.model_config.min_cfg || 4}
                              max={selected_model.model_config.max_cfg || 10}
                              step="0.5"
                              value={sana.guidance_scale}
                              onChange={(e) => sana.update_guidance_scale(parseFloat(e.target.value))}
                              className="range range-primary range-sm"
                            />
                          </div>
                        )}

                        {selected_model.model_config?.metadata?.style_presets && (
                          <div>
                            <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                              Style Preset
                            </label>
                            <select
                              value={sana.style_name || 'none'}
                              onChange={(e) => sana.update_style(e.target.value)}
                              className="select select-bordered select-sm w-full"
                            >
                              <option value="none">None</option>
                              {(selected_model.model_config.metadata.style_presets as string[]).map((style) => (
                                <option key={style} value={style}>
                                  {style.charAt(0).toUpperCase() + style.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* Fast-SDXL Settings */}
                    {selected_model?.id === 'fal-ai/fast-sdxl' && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                            Number of Images
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="4"
                            value={num_images}
                            onChange={(e) => set_num_images(parseInt(e.target.value) || 1)}
                            className="input input-bordered input-sm w-full"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="label cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enable_safety_checker}
                              onChange={(e) => set_enable_safety_checker(e.target.checked)}
                              className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="label-text ml-2">Enable Safety Checker</span>
                          </label>

                          <label className="label cursor-pointer">
                            <input
                              type="checkbox"
                              checked={expand_prompt}
                              onChange={(e) => set_expand_prompt(e.target.checked)}
                              className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="label-text ml-2">Expand Prompt</span>
                          </label>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                            Output Format
                          </label>
                          <select
                            value={image_format}
                            onChange={(e) => set_image_format(e.target.value as 'jpeg' | 'png')}
                            className="select select-bordered select-sm w-full"
                          >
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Any LoRA Settings */}
                    {selected_model?.id === 'fal-ai/lora' && selected_model.model_config?.metadata?.allow_custom_model_name && (
                      <div>
                        <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                          Custom Model Name
                        </label>
                        <input
                          type="text"
                          value={custom_model_name}
                          onChange={(e) => set_custom_model_name(e.target.value)}
                          placeholder={selected_model.model_config.metadata.default_model_name as string || "stabilityai/stable-diffusion-xl-base-1.0"}
                          className="input input-bordered input-sm w-full"
                        />
                        <p className="text-xs text-base-content/40 mt-1">
                          Enter a Hugging Face model ID or leave blank for default
                        </p>
                      </div>
                    )}

                    {/* Embeddings and LoRAs for SDXL models */}
                    {(selected_model?.model_config?.metadata?.supports_embeddings ||
                      selected_model?.id === 'fal-ai/fast-sdxl') && (
                        <div>
                          <EmbeddingsSelector
                            modelId={model_id || ''}
                            selectedEmbeddings={selected_embeddings}
                            onEmbeddingsChange={set_selected_embeddings}
                            selectedLoras={selected_loras}
                            onLorasChange={set_selected_loras}
                          />
                        </div>
                      )}

                    {/* Seed Control */}
                    <div>
                      <label className="text-xs font-medium text-base-content/60 uppercase tracking-wider block mb-2">
                        Seed (Optional)
                      </label>
                      <input
                        type="number"
                        value={custom_seed || ''}
                        onChange={(e) => set_custom_seed(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Random seed"
                        className="input input-bordered input-sm w-full"
                      />
                      <p className="text-xs text-base-content/40 mt-1">
                        Leave empty for random seed
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handle_generate}
                disabled={!can_generate}
                className="btn btn-primary w-full relative overflow-hidden group"
              >
                {job_generation.current_job && job_generation.current_job.status === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="flex items-center gap-2">
                      Generating... {job_generation.current_job.progress}%
                      {generation_start_time && (
                        <span className="text-sm opacity-80">
                          ({elapsed_seconds.toFixed(1)}s)
                        </span>
                      )}
                    </span>
                  </>
                ) : job_generation.current_job && job_generation.current_job.status === 'pending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="flex items-center gap-2">
                      Queued...
                      {generation_start_time && (
                        <span className="text-sm opacity-80">
                          ({elapsed_seconds.toFixed(1)}s)
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    {job_generation.current_job && job_generation.current_job.status === 'completed' ? 'Generate New Image' : 'Generate'}
                  </>
                )}
              </button>

              {/* Error Message */}
              {job_generation.error_message && (
                <div className="alert alert-error">
                  <span>{job_generation.error_message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Generated Images Display */}
          {generated_images && (
            <div className="mt-8 bg-base-200/30 rounded-2xl p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Generated Image{generated_images.urls.length > 1 ? 's' : ''}
                    {generated_images.urls.length > 1 && (
                      <span className="text-sm text-base-content/60 ml-2">
                        ({current_image_index + 1} of {generated_images.urls.length})
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handle_copy_image}
                      className="btn btn-sm btn-ghost"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handle_download_image}
                      className="btn btn-sm btn-ghost"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-base-300">
                  {/* Navigation buttons for multiple images */}
                  {generated_images.urls.length > 1 && (
                    <>
                      <button
                        onClick={() => set_current_image_index(Math.max(0, current_image_index - 1))}
                        disabled={current_image_index === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100/80 hover:bg-base-100"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => set_current_image_index(Math.min(generated_images.urls.length - 1, current_image_index + 1))}
                        disabled={current_image_index === generated_images.urls.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100/80 hover:bg-base-100"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <img
                    src={generated_images.urls[current_image_index]}
                    alt={`Generated ${current_image_index + 1}`}
                    className="w-full h-auto"
                  />
                </div>

                {/* Thumbnail navigation for multiple images */}
                {generated_images.urls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {generated_images.urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => set_current_image_index(index)}
                        className={`relative flex-shrink-0 rounded-lg overflow-hidden ${index === current_image_index
                          ? 'ring-2 ring-primary'
                          : 'opacity-60 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-20 h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-sm text-base-content/60">
                  <p>Model: {generated_images.model}</p>
                  <p>Cost: {generated_images.total_cost} MP{generated_images.urls.length > 1 ? ` (${generated_images.urls.length} images)` : ''}</p>
                  {generated_images.inference_time && (
                    <p>Processing time: {generated_images.inference_time.toFixed(2)}s</p>
                  )}
                  {/* Show billing details */}
                  {(user_plan === 'free' || user_plan === 'standard') && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs hover:text-primary transition-colors">
                        Billing details
                      </summary>
                      <div className="mt-1 p-2 bg-base-200/50 rounded-lg text-xs space-y-1">
                        {job_generation.current_job?.metadata?.time_based_billing ? (
                          <>
                            <p>Generation time: {job_generation.current_job.metadata.billable_seconds?.toFixed(1)}s</p>
                            {user_plan === 'free' || user_plan === 'standard' ? (
                              <p>Cost: {job_generation.current_job.metadata.base_mp_per_second} MP/s × {job_generation.current_job.metadata.billable_seconds?.toFixed(1)}s × {user_plan === 'free' ? '4' : '1.5'} = {job_generation.current_job.metadata.final_cost_mp || generated_images.total_cost} MP</p>
                            ) : (
                              <p>Cost: {job_generation.current_job.metadata.base_mp_per_second} MP/s × {job_generation.current_job.metadata.billable_seconds?.toFixed(1)}s = {generated_images.total_cost} MP</p>
                            )}
                          </>
                        ) : (
                          <>
                            {/* For flat rate, calculate and show base price */}
                            {user_plan === 'free' || user_plan === 'standard' ? (
                              <p>Base price: {Math.round(generated_images.total_cost / (user_plan === 'free' ? 4 : 1.5))} MP × {user_plan === 'free' ? '4' : '1.5'} (plan multiplier) = {generated_images.total_cost} MP</p>
                            ) : (
                              <p>Price: {generated_images.total_cost} MP</p>
                            )}
                            {generated_images.urls.length > 1 && (
                              <p>Quantity: {generated_images.urls.length} images</p>
                            )}
                          </>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job History Sidebar */}
      {show_job_history && (
        <div className="w-full lg:w-96 p-4 bg-base-200/20 border-l border-base-300">
          <JobHistoryPanel
            jobs={job_generation.job_history}
            current_job={job_generation.current_job}
            on_restore_job={job_generation.restore_job}
            on_refresh={job_generation.load_job_history}
          />
        </div>
      )}
    </div>
  )
}