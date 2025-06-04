import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Download, Volume2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { track } from '@vercel/analytics'

interface AudioPlayerProps {
  audio_url: string
  text_preview?: string
  mana_points_used?: number
  on_download?: (format: string) => void
}

export function AudioPlayer({ 
  audio_url, 
  text_preview,
  mana_points_used 
}: AudioPlayerProps) {
  const audio_ref = useRef<HTMLAudioElement>(null)
  const [is_playing, set_is_playing] = useState(false)
  const [current_time, set_current_time] = useState(0)
  const [duration, set_duration] = useState(0)
  const [volume, set_volume] = useState(1)
  const [show_volume, set_show_volume] = useState(false)

  useEffect(() => {
    const audio = audio_ref.current
    if (!audio) return

    const update_time = () => set_current_time(audio.currentTime)
    const update_duration = () => set_duration(audio.duration)
    const handle_ended = () => set_is_playing(false)

    audio.addEventListener('timeupdate', update_time)
    audio.addEventListener('loadedmetadata', update_duration)
    audio.addEventListener('ended', handle_ended)

    return () => {
      audio.removeEventListener('timeupdate', update_time)
      audio.removeEventListener('loadedmetadata', update_duration)
      audio.removeEventListener('ended', handle_ended)
    }
  }, [audio_url])

  const toggle_playback = () => {
    const audio = audio_ref.current
    if (!audio) return

    if (is_playing) {
      audio.pause()
    } else {
      audio.play()
    }
    set_is_playing(!is_playing)
  }

  const handle_seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audio_ref.current
    if (!audio) return

    const new_time = Number(e.target.value)
    audio.currentTime = new_time
    set_current_time(new_time)
  }

  const handle_volume_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audio_ref.current
    if (!audio) return

    const new_volume = Number(e.target.value)
    audio.volume = new_volume
    set_volume(new_volume)
  }

  const handle_download = async () => {
    try {
      const response = await fetch(audio_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `speech_${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Audio downloaded successfully!')
      track('audio_downloaded', { format: 'mp3' })
    } catch {
      toast.error('Failed to download audio')
    }
  }

  const format_time = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <audio ref={audio_ref} src={audio_url} preload="metadata" />
          
          {/* Player Controls */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={toggle_playback}
              className="btn btn-circle btn-primary"
              aria-label={is_playing ? 'Pause' : 'Play'}
            >
              {is_playing ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={current_time}
                onChange={handle_seek}
                className="range range-primary range-xs"
              />
              <div className="flex justify-between text-xs text-base-content/70 mt-1">
                <span>{format_time(current_time)}</span>
                <span>{format_time(duration)}</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => set_show_volume(!show_volume)}
                className="btn btn-ghost btn-sm"
                aria-label="Volume control"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              
              {show_volume && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-base-200 rounded-lg p-2 shadow-lg">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handle_volume_change}
                    className="range range-xs w-24"
                    style={{ writingMode: 'vertical-lr' as React.CSSProperties['writingMode'] }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handle_download}
              className="btn btn-ghost btn-sm"
              aria-label="Download audio"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Text Preview */}
          {text_preview && (
            <div className="bg-base-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-base-content/80 line-clamp-3">
                &quot;{text_preview}&quot;
              </p>
            </div>
          )}

          {/* MP Usage */}
          {mana_points_used !== undefined && (
            <div className="text-sm text-base-content/70">
              Mana Points used: <span className="text-primary font-bold">{mana_points_used}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}