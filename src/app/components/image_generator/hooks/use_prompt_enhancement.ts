import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export function use_prompt_enhancement() {
  const [is_enhancing, set_is_enhancing] = useState(false)
  const [enhancement_count, set_enhancement_count] = useState(0)
  
  const enhance_prompt = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first')
      return null
    }
    
    set_is_enhancing(true)
    
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enhance prompt')
      }
      
      const data = await response.json()
      set_enhancement_count(prev => prev + 1)
      
      return data.enhanced_prompt
    } catch (error) {
      console.error('Enhancement error:', error)
      toast.error(error instanceof Error ? error.message : 'Enhancement failed')
      return null
    } finally {
      set_is_enhancing(false)
    }
  }, [])
  
  const reset_enhancement_count = useCallback(() => {
    set_enhancement_count(0)
  }, [])
  
  return {
    is_enhancing,
    enhancement_count,
    enhance_prompt,
    reset_enhancement_count
  }
}