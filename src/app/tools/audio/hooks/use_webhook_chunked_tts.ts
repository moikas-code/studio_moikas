import { useState, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'
import { TTSParams } from '../types'
import { useJobPolling } from './use_job_polling'

export interface ChunkedTTSResult {
  job_id: string
  chunks: Array<{
    index: number
    text: string
    audio_url?: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    mana_points_used?: number
  }>
  total_characters: number
  total_mana_points: number
  overall_status: 'pending' | 'processing' | 'completed' | 'failed'
  overall_progress: number
}

export function useWebhookChunkedTts() {
  const [is_generating, set_is_generating] = useState(false)
  const [error_message, set_error_message] = useState<string | null>(null)
  const [generated_audio, set_generated_audio] = useState<ChunkedTTSResult | null>(null)
  const [is_regenerating_chunk, set_is_regenerating_chunk] = useState<number | null>(null)

  // Job polling hook
  const {
    start_polling,
    stop_polling
  } = useJobPolling({
    onComplete: (audio_url: string) => {
      // audio_url is intentionally unused here - we check document status instead
      void audio_url
      // This is called when a single job completes
      // For documents, we need to check all chunks
      check_document_status()
    },
    onError: (error: string) => {
      set_error_message(error)
      toast.error(error)
      set_is_generating(false)
    },
    onProgress: (progress: number) => {
      // progress is intentionally unused here - we track progress differently for documents
      void progress
      // Update UI progress if needed
    }
  })

  const chunk_text = (text: string, chunk_size: number = 1000): string[] => {
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
      
      const chunk_end = current_position + chunk_size
      
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

  const check_document_status = useCallback(async () => {
    if (!generated_audio?.job_id) {
      console.log('No job ID, skipping status check')
      return
    }

    console.log('Checking document status for job:', generated_audio.job_id)

    try {
      // Determine which endpoint to use based on job ID pattern
      const is_document_job = generated_audio.job_id.startsWith('audio_doc_')
      const status_endpoint = is_document_job 
        ? `/api/audio/document/status?job_id=${generated_audio.job_id}`
        : `/api/audio/status?job_id=${generated_audio.job_id}`
      
      console.log('Fetching from endpoint:', status_endpoint)
      const response = await fetch(status_endpoint)
      
      if (!response.ok) {
        console.error('Status check failed:', response.status, response.statusText)
        throw new Error('Failed to check status')
      }

      const data = await response.json()
      const status = data.data
      console.log('Status response:', {
        job_id: status.job_id,
        status: status.status,
        progress: status.progress,
        chunks_count: status.chunks?.length,
        total_cost: status.metadata?.total_cost,
        total_text_length: status.metadata?.total_text_length
      })

      // Update generated audio based on job type
      if (is_document_job) {
        // Multi-chunk document job
        const updated_chunks = generated_audio.chunks.map((chunk, index) => {
          const chunk_status = status.chunks.find((c: { chunk_index: number; status: string; audio_url?: string }) => c.chunk_index === index)
          if (chunk_status) {
            console.log(`Updating chunk ${index}:`, {
              old_status: chunk.status,
              new_status: chunk_status.status,
              has_audio: !!chunk_status.audio_url
            })
            return {
              ...chunk,
              status: chunk_status.status,
              audio_url: chunk_status.audio_url
            }
          }
          return chunk
        })

        const updated_audio = {
          ...generated_audio,
          chunks: updated_chunks,
          overall_status: status.status,
          overall_progress: status.progress,
          total_mana_points: status.metadata?.total_cost || generated_audio.total_mana_points,
          total_characters: status.metadata?.total_text_length || generated_audio.total_characters
        }
        console.log('Setting updated audio state:', {
          overall_status: updated_audio.overall_status,
          chunks_with_audio: updated_audio.chunks.filter(c => c.audio_url).length,
          total_chunks: updated_audio.chunks.length
        })
        set_generated_audio(updated_audio)
      } else {
        // Single chunk regular audio job
        const updated_audio = {
          ...generated_audio,
          chunks: [{
            ...generated_audio.chunks[0],
            status: status.status,
            audio_url: status.audio_url
          }],
          overall_status: status.status,
          overall_progress: status.status === 'completed' ? 100 : 0,
          total_mana_points: status.metadata?.total_cost || generated_audio.total_mana_points,
          total_characters: status.metadata?.total_text_length || generated_audio.total_characters
        }
        console.log('Setting updated audio state (single chunk):', {
          status: updated_audio.overall_status,
          has_audio: !!status.audio_url
        })
        set_generated_audio(updated_audio)
      }

      // Check if all chunks are complete
      if (status.status === 'completed') {
        set_is_generating(false)
        stop_polling()
        toast.success('All audio chunks generated successfully!')
        
        track('document_tts_success', {
          total_chunks: generated_audio.chunks.length,
          total_characters: generated_audio.total_characters,
          total_cost: generated_audio.total_mana_points
        })
      } else if (status.status === 'failed') {
        set_is_generating(false)
        stop_polling()
        set_error_message(status.error || 'Document generation failed')
        toast.error('Some chunks failed to generate')
        
        track('document_tts_error', {
          error: status.error || 'Unknown error'
        })
      }
    } catch (error) {
      console.error('Error checking document status:', error)
    }
  }, [generated_audio, stop_polling])

  // Poll for document status updates
  useEffect(() => {
    if (generated_audio?.job_id && is_generating) {
      console.log('Starting status polling for job:', generated_audio.job_id)
      const interval = setInterval(() => {
        console.log('Polling status for job:', generated_audio.job_id)
        check_document_status()
      }, 3000) // Check every 3 seconds
      return () => {
        console.log('Stopping status polling')
        clearInterval(interval)
      }
    }
  }, [generated_audio?.job_id, is_generating, check_document_status])

  const generate_chunked_speech = useCallback(async (params: TTSParams): Promise<ChunkedTTSResult | null> => {
    set_is_generating(true)
    set_error_message(null)
    set_generated_audio(null)

    try {
      const chunks = chunk_text(params.text)
      const total_chunks = chunks.length

      if (total_chunks === 1) {
        // Single chunk, use regular webhook-based TTS
        const response = await fetch('/api/audio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...params, 
            text: chunks[0],
            use_webhook: true
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }

        const result: ChunkedTTSResult = {
          job_id: data.data.job_id,
          chunks: [{
            index: 0,
            text: chunks[0],
            status: 'processing',
            mana_points_used: 0 // Will be updated when complete
          }],
          total_characters: chunks[0].length,
          total_mana_points: 0, // Will be updated when complete
          overall_status: 'processing',
          overall_progress: 0
        }

        set_generated_audio(result)
        start_polling(data.data.job_id)
        toast('Speech generation started...', { icon: '🎙️' })
        
        return result
      }

      // Multiple chunks - use document endpoint
      toast(`Converting ${total_chunks} chunks...`, { icon: '🎙️' })
      
      const response = await fetch('/api/audio/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunks: chunks.map((text, index) => ({ text, index })),
          voice: params.voice,
          source_audio_url: params.source_audio_url,
          high_quality_audio: params.high_quality_audio,
          exaggeration: params.exaggeration,
          cfg: params.cfg,
          temperature: params.temperature,
          seed: params.seed
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      const result: ChunkedTTSResult = {
        job_id: data.data.job_id,
        chunks: chunks.map((text, index) => ({
          index,
          text,
          status: 'pending' as const,
          mana_points_used: 0
        })),
        total_characters: params.text.length,
        total_mana_points: 0, // Will be calculated from chunk costs
        overall_status: 'processing',
        overall_progress: 0
      }

      set_generated_audio(result)
      toast(`Document processing started with ${total_chunks} chunks`, { icon: '📄' })
      
      // Start checking document status
      setTimeout(check_document_status, 2000)

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speech generation failed'
      set_error_message(message)
      toast.error(message)
      
      track('chunked_tts_error', {
        error: message
      })
      
      set_is_generating(false)
      return null
    }
  }, [start_polling, check_document_status])

  const clear_error = useCallback(() => {
    set_error_message(null)
  }, [])

  const clear_audio = useCallback(() => {
    set_generated_audio(null)
    stop_polling()
  }, [stop_polling])
  
  const restore_job = useCallback(async (job_id: string, extracted_text?: string): Promise<boolean> => {
    set_is_generating(true)
    set_error_message(null)
    
    try {
      // Determine which endpoint to use based on job ID pattern
      const is_document_job = job_id.startsWith('audio_doc_')
      const status_endpoint = is_document_job 
        ? `/api/audio/document/status?job_id=${job_id}`
        : `/api/audio/status?job_id=${job_id}`
      
      // Get job status from appropriate API endpoint
      const response = await fetch(status_endpoint)
      
      if (!response.ok) {
        throw new Error('Failed to restore job')
      }
      
      const data = await response.json()
      const status = data.data
      
      // Split the extracted text into chunks if provided
      let chunk_texts: string[] = []
      if (extracted_text) {
        chunk_texts = chunk_text(extracted_text)
      }
      
      // Reconstruct the ChunkedTTSResult from the status
      let result: ChunkedTTSResult
      
      if (is_document_job) {
        // Multi-chunk document job
        result = {
          job_id: status.job_id,
          chunks: status.chunks.map((chunk: { chunk_index?: number; audio_url?: string; status: string }, index: number) => ({
            index: chunk.chunk_index || index,
            text: chunk_texts[chunk.chunk_index || index] || '',
            audio_url: chunk.audio_url,
            status: chunk.status,
            mana_points_used: chunk_texts[chunk.chunk_index || index] 
              ? Math.ceil(chunk_texts[chunk.chunk_index || index].length / 10) 
              : 0
          })),
          total_characters: status.metadata?.total_text_length || 0,
          total_mana_points: status.metadata?.total_cost || 0,
          overall_status: status.status,
          overall_progress: status.progress
        }
      } else {
        // Single chunk regular audio job
        result = {
          job_id: status.job_id,
          chunks: [{
            index: 0,
            text: extracted_text || '',
            audio_url: status.audio_url,
            status: status.status,
            mana_points_used: extracted_text ? Math.ceil(extracted_text.length / 10) : 0
          }],
          total_characters: extracted_text?.length || 0,
          total_mana_points: 0, // Will be calculated
          overall_status: status.status,
          overall_progress: status.status === 'completed' ? 100 : 0
        }
      }
      
      set_generated_audio(result)
      
      // If still processing, ensure is_generating is true to trigger polling
      if (status.status === 'processing' || status.status === 'pending') {
        set_is_generating(true)
        console.log('Job is still processing, polling will continue')
        // Do an immediate check
        check_document_status()
      } else {
        set_is_generating(false)
        console.log('Job is complete or failed, stopping polling')
      }
      
      return true
    } catch (error) {
      console.error('Failed to restore job:', error)
      set_is_generating(false)
      set_error_message('Failed to restore previous job')
      return false
    }
  }, [check_document_status])

  const regenerate_chunk = useCallback(async (
    chunk_index: number, 
    params: Omit<TTSParams, 'text'>
  ): Promise<boolean> => {
    if (!generated_audio || chunk_index >= generated_audio.chunks.length) {
      toast.error('Invalid chunk index')
      return false
    }

    set_is_regenerating_chunk(chunk_index)
    set_error_message(null)

    try {
      const chunk = generated_audio.chunks[chunk_index]
      toast.loading(`Regenerating chunk ${chunk_index + 1}...`, { icon: '🔄' })
      
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...params, 
          text: chunk.text,
          use_webhook: false // Use sync for regeneration
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      // Update the generated audio with the new chunk
      const updated_chunks = [...generated_audio.chunks]
      updated_chunks[chunk_index] = {
        ...updated_chunks[chunk_index],
        audio_url: data.data.audio_url,
        status: 'completed'
      }

      set_generated_audio({
        ...generated_audio,
        chunks: updated_chunks
      })

      toast.success(`Chunk ${chunk_index + 1} regenerated successfully!`)
      
      track('chunk_regenerate_success', {
        chunk_index
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate chunk'
      set_error_message(message)
      toast.error(message)
      
      track('chunk_regenerate_error', {
        chunk_index,
        error: message
      })
      
      return false
    } finally {
      set_is_regenerating_chunk(null)
    }
  }, [generated_audio])

  // Check for existing job on mount
  useEffect(() => {
    const stored_job_id = localStorage.getItem('audio_document_job_id')
    if (stored_job_id && !is_generating) {
      // Recover from stored job
      set_is_generating(true)
      set_generated_audio({
        job_id: stored_job_id,
        chunks: [],
        total_characters: 0,
        total_mana_points: 0,
        overall_status: 'processing',
        overall_progress: 0
      })
      setTimeout(check_document_status, 1000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Store job ID when it changes
  useEffect(() => {
    if (generated_audio?.job_id) {
      localStorage.setItem('audio_document_job_id', generated_audio.job_id)
    } else {
      localStorage.removeItem('audio_document_job_id')
    }
  }, [generated_audio?.job_id])

  return {
    is_generating,
    error_message,
    generated_audio,
    progress: {
      current: generated_audio?.chunks.filter(c => c.status === 'completed').length || 0,
      total: generated_audio?.chunks.length || 0
    },
    generate_chunked_speech,
    regenerate_chunk,
    is_regenerating_chunk,
    clear_error,
    clear_audio,
    restore_job
  }
}