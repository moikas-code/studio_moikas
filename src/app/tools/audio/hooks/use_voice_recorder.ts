import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export interface VoiceRecorderOptions {
  max_duration?: number // in seconds
  audio_format?: 'webm' | 'wav'
}

export function useVoiceRecorder(options: VoiceRecorderOptions = {}) {
  const { max_duration = 8, audio_format = 'webm' } = options
  
  const [is_recording, set_is_recording] = useState(false)
  const [recording_time, set_recording_time] = useState(0)
  const [audio_blob, set_audio_blob] = useState<Blob | null>(null)
  const [audio_url, set_audio_url] = useState<string | null>(null)
  const [audio_base64_url, set_audio_base64_url] = useState<string | null>(null)
  const [error, set_error] = useState<string | null>(null)
  
  const media_recorder_ref = useRef<MediaRecorder | null>(null)
  const chunks_ref = useRef<Blob[]>([])
  const timer_ref = useRef<number | null>(null)
  const start_time_ref = useRef<number | null>(null)
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (timer_ref.current) {
      clearInterval(timer_ref.current)
      timer_ref.current = null
    }
    if (audio_url) {
      URL.revokeObjectURL(audio_url)
    }
  }, [audio_url])
  
  // Stop recording
  const stop_recording = useCallback(() => {
    if (media_recorder_ref.current && media_recorder_ref.current.state !== 'inactive') {
      media_recorder_ref.current.stop()
      set_is_recording(false)
      
      if (timer_ref.current) {
        clearInterval(timer_ref.current)
        timer_ref.current = null
      }
    }
  }, [])
  
  // Start recording
  const start_recording = useCallback(async () => {
    try {
      set_error(null)
      cleanup()
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      // Determine MIME type
      const mime_type = audio_format === 'wav' ? 'audio/wav' : 'audio/webm'
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mime_type) ? mime_type : 'audio/webm'
      })
      
      chunks_ref.current = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks_ref.current.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks_ref.current, { type: recorder.mimeType })
        set_audio_blob(blob)
        set_audio_url(URL.createObjectURL(blob))
        
        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64_url = reader.result as string
          set_audio_base64_url(base64_url)
        }
        reader.readAsDataURL(blob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Start recording
      recorder.start()
      media_recorder_ref.current = recorder
      set_is_recording(true)
      start_time_ref.current = Date.now()
      
      // Start timer
      timer_ref.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - start_time_ref.current!) / 1000)
        set_recording_time(elapsed)
        
        // Auto-stop at max duration
        if (elapsed >= max_duration) {
          stop_recording()
          toast(`Recording stopped at ${max_duration} seconds`)
        }
      }, 100)
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      set_error(message)
      toast.error(message)
    }
  }, [audio_format, cleanup, max_duration, stop_recording])
  
  // Clear recording
  const clear_recording = useCallback(() => {
    cleanup()
    set_audio_blob(null)
    set_audio_url(null)
    set_audio_base64_url(null)
    set_recording_time(0)
    set_error(null)
    chunks_ref.current = []
  }, [cleanup])
  
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])
  
  return {
    is_recording,
    recording_time,
    audio_blob,
    audio_url,
    audio_base64_url,
    error,
    start_recording,
    stop_recording,
    clear_recording,
    max_duration
  }
}