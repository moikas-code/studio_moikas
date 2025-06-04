import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'

interface GenerationParams {
  prompt: string
  model: string
  width: number
  height: number
  num_inference_steps?: number
  guidance_scale?: number
  style_name?: string
  seed?: number
}

interface GenerationResult {
  image_base64: string
  mana_points_used: number
  backend_cost?: number
}

export function use_image_generation() {
  const [is_loading, set_is_loading] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  
  const generate_image = useCallback(async (
    params: GenerationParams
  ): Promise<GenerationResult | null> => {
    set_is_loading(true)
    set_error_message(null)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
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