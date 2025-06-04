import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'
import { TTSParams, TTSResult } from '../types'

export function useTextToSpeech() {
  const [is_generating, set_is_generating] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  const [generated_audio, set_generated_audio] = useState<TTSResult | null>(null)

  const generate_speech = useCallback(async (params: TTSParams): Promise<TTSResult | null> => {
    set_is_generating(true)
    set_error_message(null)

    try {
      const response = await fetch('/api/audio/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const result: TTSResult = {
        audio_url: data.audio_url,
        text_characters: data.text_characters,
        mana_points_used: data.mana_points_used
      }

      set_generated_audio(result)
      toast.success('Speech generated successfully!')
      
      track('tts_success', {
        voice: params.voice || 'default',
        text_length: params.text.length
      })

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speech generation failed'
      set_error_message(message)
      toast.error(message)
      
      track('tts_error', {
        error: message
      })
      
      return null
    } finally {
      set_is_generating(false)
    }
  }, [])

  const clear_error = useCallback(() => {
    set_error_message(null)
  }, [])

  const clear_audio = useCallback(() => {
    set_generated_audio(null)
  }, [])

  return {
    is_generating,
    error_message,
    generated_audio,
    generate_speech,
    clear_error,
    clear_audio
  }
}