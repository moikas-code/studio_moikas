import React, { useState } from 'react'
import { Mic, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { VoiceRecorder } from './voice_recorder'
import { AudioFileUploader } from './audio_file_uploader'

interface VoiceCloningPanelProps {
  on_voice_ready: (url: string) => void
  is_uploading?: boolean
}

export function VoiceCloningPanel({ 
  on_voice_ready,
  is_uploading = false 
}: VoiceCloningPanelProps) {
  const [mode, set_mode] = useState<'record' | 'upload' | null>(null)
  const [uploaded_url, set_uploaded_url] = useState<string | null>(null)
  
  const handle_audio_upload = async (audio: Blob | File) => {
    try {
      const formData = new FormData()
      formData.append('audio', audio instanceof Blob ? new File([audio], 'recording.webm', { type: audio.type }) : audio)
      
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      set_uploaded_url(data.url)
      on_voice_ready(data.url)
      toast.success('Voice sample uploaded successfully!')
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload audio'
      toast.error(message)
    }
  }
  
  const clear_voice = () => {
    set_mode(null)
    set_uploaded_url(null)
  }
  
  if (uploaded_url) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span className="text-sm font-medium">Voice sample ready</span>
          </div>
          <button
            onClick={clear_voice}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Remove voice sample"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-base-content/60 mt-1">
          Your voice will be used to generate speech
        </p>
      </div>
    )
  }
  
  if (is_uploading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Uploading voice sample...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Voice Cloning (Optional)</h3>
      <p className="text-sm text-base-content/70">
        Upload or record a voice sample to clone the voice for text-to-speech
      </p>
      
      {!mode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => set_mode('record')}
            className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer p-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Record Voice</p>
                <p className="text-xs text-base-content/60 mt-1">
                  Record up to 8 seconds
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => set_mode('upload')}
            className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer p-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Upload File</p>
                <p className="text-xs text-base-content/60 mt-1">
                  MP3, WAV, M4A up to 10MB
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
      
      {mode === 'record' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Record Your Voice</h4>
            <button
              onClick={() => set_mode(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
          <VoiceRecorder
            on_recording_complete={handle_audio_upload}
            max_duration={8}
          />
        </div>
      )}
      
      {mode === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Upload Audio File</h4>
            <button
              onClick={() => set_mode(null)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
          <AudioFileUploader
            on_file_select={handle_audio_upload}
            max_file_size={10}
          />
        </div>
      )}
    </div>
  )
}