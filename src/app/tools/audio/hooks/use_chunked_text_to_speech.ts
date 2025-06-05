import { useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'
import { TTSParams, TTSResult, TTS_LIMITS } from '../types'

export interface ChunkedTTSResult {
  chunks: Array<{
    index: number
    text: string
    audio_url: string
    mana_points_used: number
  }>
  total_characters: number
  total_mana_points: number
}

export function useChunkedTextToSpeech() {
  const [is_generating, set_is_generating] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  const [progress, set_progress] = useState({ current: 0, total: 0 })
  const [generated_audio, set_generated_audio] = useState<ChunkedTTSResult | null>(null)

  const chunk_text = (text: string, chunk_size: number = 675): string[] => {
    const chunks: string[] = []
    let current_position = 0

    while (current_position < text.length) {
      // Skip any leading spaces
      while (current_position < text.length && text[current_position] === ' ') {
        current_position++
      }
      
      if (current_position >= text.length) {
        break
      }
      
      let chunk_end = current_position + chunk_size
      
      if (chunk_end >= text.length) {
        // Last chunk
        chunks.push(text.substring(current_position).trim())
        break
      }

      // Since we removed all newlines, we only need to look for sentence endings and word boundaries
      let best_break = -1

      // Look for sentence endings first (. ! ?)
      const sentence_endings = ['. ', '! ', '? ']
      for (const ending of sentence_endings) {
        const pos = text.lastIndexOf(ending, chunk_end)
        if (pos > current_position + chunk_size * 0.6) { // At least 60% of chunk size
          best_break = pos + ending.length - 1
          break
        }
      }

      // If no sentence ending found, look for word boundary
      if (best_break === -1) {
        // Find the last space before or at chunk_end
        const space_break = text.lastIndexOf(' ', chunk_end)
        if (space_break > current_position) {
          best_break = space_break - 1 // Position before the space
        } else {
          // If no space found, look for the next space after chunk_end
          const next_space = text.indexOf(' ', chunk_end)
          if (next_space !== -1) {
            best_break = next_space - 1
          } else {
            // No more spaces, take the rest
            best_break = text.length - 1
          }
        }
      }

      // Extract chunk and trim
      const chunk = text.substring(current_position, best_break + 1).trim()
      if (chunk.length > 0) {
        chunks.push(chunk)
      }
      
      // Move to the next position (skip the space/break)
      current_position = best_break + 1
      while (current_position < text.length && text[current_position] === ' ') {
        current_position++
      }
    }

    return chunks
  }

  const generate_speech_chunk = async (text: string, params: Omit<TTSParams, 'text'>): Promise<TTSResult | null> => {
    try {
      const response = await fetch('/api/audio/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, text })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return {
        audio_url: data.audio_url,
        text_characters: data.text_characters,
        mana_points_used: data.mana_points_used
      }
    } catch (error) {
      throw error
    }
  }

  const generate_chunked_speech = useCallback(async (params: TTSParams): Promise<ChunkedTTSResult | null> => {
    set_is_generating(true)
    set_error_message(null)
    set_generated_audio(null)

    try {
      const chunks = chunk_text(params.text)
      const total_chunks = chunks.length

      if (total_chunks === 1) {
        // Single chunk, use regular TTS
        const result = await generate_speech_chunk(chunks[0], params)
        if (result) {
          const chunked_result: ChunkedTTSResult = {
            chunks: [{
              index: 0,
              text: chunks[0],
              audio_url: result.audio_url,
              mana_points_used: result.mana_points_used
            }],
            total_characters: result.text_characters,
            total_mana_points: result.mana_points_used
          }
          set_generated_audio(chunked_result)
          toast.success('Speech generated successfully!')
          return chunked_result
        }
        return null
      }

      // Multiple chunks
      toast(`Converting ${total_chunks} chunks...`, { icon: '🎙️' })
      
      const results: ChunkedTTSResult = {
        chunks: [],
        total_characters: 0,
        total_mana_points: 0
      }

      for (let i = 0; i < chunks.length; i++) {
        set_progress({ current: i + 1, total: total_chunks })
        
        const chunk_result = await generate_speech_chunk(chunks[i], params)
        
        if (!chunk_result) {
          throw new Error(`Failed to generate chunk ${i + 1}`)
        }

        results.chunks.push({
          index: i,
          text: chunks[i],
          audio_url: chunk_result.audio_url,
          mana_points_used: chunk_result.mana_points_used
        })
        
        results.total_characters += chunk_result.text_characters
        results.total_mana_points += chunk_result.mana_points_used

        // Small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      set_generated_audio(results)
      toast.success(`Generated ${total_chunks} audio chunks successfully!`)
      
      track('chunked_tts_success', {
        total_chunks,
        total_characters: results.total_characters,
        total_cost: results.total_mana_points
      })

      return results
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speech generation failed'
      set_error_message(message)
      toast.error(message)
      
      track('chunked_tts_error', {
        error: message
      })
      
      return null
    } finally {
      set_is_generating(false)
      set_progress({ current: 0, total: 0 })
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
    progress,
    generate_chunked_speech,
    clear_error,
    clear_audio
  }
}