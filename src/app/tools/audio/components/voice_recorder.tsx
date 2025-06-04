import React from 'react'
import { Mic, Square, Trash2, Upload } from 'lucide-react'
import { useVoiceRecorder } from '../hooks/use_voice_recorder'

interface VoiceRecorderProps {
  on_recording_complete: (base64_url: string) => void
  max_duration?: number
}

export function VoiceRecorder({ 
  on_recording_complete,
  max_duration = 8 
}: VoiceRecorderProps) {
  const {
    is_recording,
    recording_time,
    audio_url,
    audio_base64_url,
    error,
    start_recording,
    stop_recording,
    clear_recording
  } = useVoiceRecorder({ max_duration })
  
  const handle_use_recording = () => {
    if (audio_base64_url) {
      on_recording_complete(audio_base64_url)
    }
  }
  
  const format_time = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const progress_percentage = (recording_time / max_duration) * 100
  
  return (
    <div className="space-y-4">
      {/* Recording Status */}
      {is_recording && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
            <span className="text-sm font-mono">
              {format_time(recording_time)} / {format_time(max_duration)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-error transition-all duration-100 ease-linear"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Recorded Audio Preview */}
      {audio_url && !is_recording && (
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Your Recording</span>
            <span className="text-xs text-base-content/60">
              {format_time(recording_time)}
            </span>
          </div>
          
          <audio 
            controls 
            src={audio_url} 
            className="w-full h-12"
            style={{ height: '48px' }}
          />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handle_use_recording}
              className="btn btn-primary btn-sm flex-1"
            >
              <Upload className="w-4 h-4" />
              Use This Recording
            </button>
            <button
              onClick={clear_recording}
              className="btn btn-ghost btn-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Record Button */}
      {!is_recording && !audio_url && (
        <button
          onClick={start_recording}
          className="btn btn-primary w-full"
        >
          <Mic className="w-5 h-5" />
          Start Recording (Max {max_duration}s)
        </button>
      )}
      
      {/* Stop Button */}
      {is_recording && (
        <button
          onClick={stop_recording}
          className="btn btn-error w-full"
        >
          <Square className="w-5 h-5" />
          Stop Recording
        </button>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}