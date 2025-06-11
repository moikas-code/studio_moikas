import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'
import type { EmbeddingInput, LoraWeight } from '../types'

export interface GenerationParams {
  prompt: string
  model: string
  width: number
  height: number
  negative_prompt?: string
  num_inference_steps?: number
  guidance_scale?: number
  style_name?: string
  seed?: number
  embeddings?: EmbeddingInput[]
  loras?: LoraWeight[]
  // Fast-SDXL specific
  num_images?: number
  enable_safety_checker?: boolean
  expand_prompt?: boolean
  format?: 'jpeg' | 'png'
}

export interface GenerationResult {
  image_base64: string
  mana_points_used: number
  backend_cost?: number
}

export function useImageGeneration() {
  const [is_loading, set_is_loading] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  
  const generate_image = useCallback(async (
    params: GenerationParams
  ): Promise<GenerationResult | null> => {
    set_is_loading(true)
    set_error_message(null)
    
    try {
      // Clean up params before sending
      const cleaned_params = {
        ...params,
        // Filter out invalid loras
        loras: params.loras?.filter(l => l && l.path && typeof l.path === 'string') || undefined,
        // Filter out invalid embeddings
        embeddings: params.embeddings?.filter(e => e && e.path && typeof e.path === 'string') || undefined
      }
      
      // Remove undefined values
      Object.keys(cleaned_params).forEach(key => {
        if (cleaned_params[key as keyof typeof cleaned_params] === undefined) {
          delete cleaned_params[key as keyof typeof cleaned_params]
        }
      })
      
      console.log('[useImageGeneration] Cleaned params:', JSON.stringify(cleaned_params, null, 2))
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned_params)
      })
      
      const response_data = await response.json()
      
      if (!response.ok) {
        throw new Error(response_data.error || `HTTP error! status: ${response.status}`)
      }
      
      // Debug logging
      console.log('API Response:', response_data)
      
      // Extract data from the success response wrapper
      const data = response_data.data || response_data
      
      console.log('Extracted data:', {
        hasBase64: !!data.base64Image,
        base64Length: data.base64Image?.length || 0,
        model: data.model,
        mpUsed: data.mpUsed
      })
      
      if (!data || !data.base64Image) {
        console.error('No base64Image in response data:', data)
        throw new Error('Invalid response from server - missing image data')
      }
      
      track('image_generated', {
        model: params.model,
        width: params.width,
        height: params.height
      })
      
      toast.success('Image generated successfully!')
      
      return {
        image_base64: data.base64Image,
        mana_points_used: data.mpUsed || 0,
        backend_cost: data.backendCost
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      set_error_message(message)
      toast.error(message)
      
      track('image_generation_error', {
        error: message,
        model: params.model
      })
      
      return null
    } finally {
      set_is_loading(false)
    }
  }, [])
  
  const clear_error = useCallback(() => {
    set_error_message(null)
  }, [])
  
  return {
    is_loading,
    error_message,
    generate_image,
    clear_error
  }
}