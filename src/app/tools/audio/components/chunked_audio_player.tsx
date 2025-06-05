import React, { useState, useRef, useEffect } from 'react'
import { Download, Play, Pause, SkipForward, SkipBack, List, Archive } from 'lucide-react'
import { ChunkedTTSResult } from '../hooks/use_chunked_text_to_speech'
import { toast } from 'react-hot-toast'
import JSZip from 'jszip'

interface ChunkedAudioPlayerProps {
  chunked_result: ChunkedTTSResult
  text_preview?: string
}

export function ChunkedAudioPlayer({ chunked_result, text_preview }: ChunkedAudioPlayerProps) {
  const [current_chunk, set_current_chunk] = useState(0)
  const [is_playing, set_is_playing] = useState(false)
  const [show_playlist, set_show_playlist] = useState(false)
  const audio_ref = useRef<HTMLAudioElement>(null)

  const current_audio = chunked_result.chunks[current_chunk]
  const total_chunks = chunked_result.chunks.length

  useEffect(() => {
    // Reset when new result comes in
    set_current_chunk(0)
    set_is_playing(false)
  }, [chunked_result])

  const handle_play_pause = () => {
    if (audio_ref.current) {
      if (is_playing) {
        audio_ref.current.pause()
      } else {
        audio_ref.current.play()
      }
      set_is_playing(!is_playing)
    }
  }

  const handle_next = () => {
    if (current_chunk < total_chunks - 1) {
      set_current_chunk(current_chunk + 1)
      set_is_playing(false)
    }
  }

  const handle_previous = () => {
    if (current_chunk > 0) {
      set_current_chunk(current_chunk - 1)
      set_is_playing(false)
    }
  }

  const handle_chunk_select = (index: number) => {
    set_current_chunk(index)
    set_is_playing(false)
    set_show_playlist(false)
  }

  const handle_ended = () => {
    set_is_playing(false)
    // Auto-play next chunk if available
    if (current_chunk < total_chunks - 1) {
      setTimeout(() => {
        set_current_chunk(current_chunk + 1)
        set_is_playing(true)
      }, 500)
    }
  }

  const handle_download_individual = async () => {
    toast('Downloading all audio chunks...', { icon: '📥' })
    
    for (let i = 0; i < chunked_result.chunks.length; i++) {
      const chunk = chunked_result.chunks[i]
      try {
        const response = await fetch(chunk.audio_url)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audio_chunk_${i + 1}.mp3`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Failed to download chunk ${i + 1}:`, error)
      }
    }
    
    toast.success('All chunks downloaded!')
  }

  const handle_download_zip = async () => {
    const loading_toast = toast.loading('Creating zip file...', { icon: '📦' })
    
    try {
      const zip = new JSZip()
      const audio_folder = zip.folder('audio_chunks')
      
      if (!audio_folder) {
        throw new Error('Failed to create zip folder')
      }

      // Add metadata file
      const metadata = {
        total_chunks: total_chunks,
        total_characters: chunked_result.total_characters,
        total_cost_mp: chunked_result.total_mana_points,
        generated_at: new Date().toISOString(),
        chunks: chunked_result.chunks.map((chunk, index) => ({
          chunk_number: index + 1,
          text_length: chunk.text.length,
          text_preview: chunk.text.substring(0, 100) + '...',
          filename: `chunk_${String(index + 1).padStart(3, '0')}.mp3`
        }))
      }
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2))
      
      // Add transcript file
      const transcript = chunked_result.chunks
        .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.text}\n`)
        .join('\n---\n\n')
      
      zip.file('transcript.txt', transcript)
      
      // Download and add all audio files
      for (let i = 0; i < chunked_result.chunks.length; i++) {
        const chunk = chunked_result.chunks[i]
        try {
          toast.loading(`Processing chunk ${i + 1} of ${total_chunks}...`, { 
            id: loading_toast,
            icon: '🎵' 
          })
          
          const response = await fetch(chunk.audio_url)
          const blob = await response.blob()
          const array_buffer = await blob.arrayBuffer()
          
          // Use padded numbers for better sorting
          const filename = `chunk_${String(i + 1).padStart(3, '0')}.mp3`
          audio_folder.file(filename, array_buffer)
          
        } catch (error) {
          console.error(`Failed to add chunk ${i + 1} to zip:`, error)
          toast.error(`Failed to process chunk ${i + 1}`)
        }
      }
      
      // Generate the zip file
      toast.loading('Compressing files...', { id: loading_toast, icon: '🗜️' })
      
      const zip_blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      // Create download link
      const url = URL.createObjectURL(zip_blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audio_chunks_${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Zip file downloaded successfully!', { id: loading_toast })
      
    } catch (error) {
      console.error('Failed to create zip file:', error)
      toast.error('Failed to create zip file', { id: loading_toast })
    }
  }

  useEffect(() => {
    if (audio_ref.current && is_playing) {
      audio_ref.current.play()
    }
  }, [current_chunk, is_playing])

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Generated Audio</h2>
        
        {/* Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow mb-4">
          <div className="stat">
            <div className="stat-title">Total Chunks</div>
            <div className="stat-value text-primary">{total_chunks}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Characters</div>
            <div className="stat-value text-secondary">{chunked_result.total_characters.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Cost</div>
            <div className="stat-value">{chunked_result.total_mana_points} MP</div>
          </div>
        </div>

        {/* Current chunk info */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">
              Chunk {current_chunk + 1} of {total_chunks}
            </h3>
            <button
              onClick={() => set_show_playlist(!show_playlist)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <List className="w-4 h-4" />
              Playlist
            </button>
          </div>
          <p className="text-sm text-base-content/70 line-clamp-3">
            {current_audio.text}
          </p>
        </div>

        {/* Audio Player */}
        <div className="bg-base-300 rounded-lg p-4">
          <audio
            ref={audio_ref}
            src={current_audio.audio_url}
            onEnded={handle_ended}
            className="hidden"
          />
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={handle_previous}
              disabled={current_chunk === 0}
              className="btn btn-circle btn-sm"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            
            <button
              onClick={handle_play_pause}
              className="btn btn-circle btn-primary"
            >
              {is_playing ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={handle_next}
              disabled={current_chunk === total_chunks - 1}
              className="btn btn-circle btn-sm"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center gap-1">
            {chunked_result.chunks.map((_, index) => (
              <button
                key={index}
                onClick={() => handle_chunk_select(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === current_chunk
                    ? 'bg-primary w-8'
                    : 'bg-base-content/30 hover:bg-base-content/50'
                }`}
                title={`Go to chunk ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Playlist */}
        {show_playlist && (
          <div className="mt-4 max-h-64 overflow-y-auto">
            <h4 className="font-semibold mb-2">All Chunks</h4>
            <div className="space-y-2">
              {chunked_result.chunks.map((chunk, index) => (
                <button
                  key={index}
                  onClick={() => handle_chunk_select(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === current_chunk
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 hover:bg-base-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Chunk {index + 1}</span>
                    <span className="text-xs opacity-70">
                      {chunk.text.length} chars
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-1 opacity-80">
                    {chunk.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions justify-end mt-4 gap-2">
          <div className="dropdown dropdown-top dropdown-end">
            <label tabIndex={0} className="btn btn-outline btn-sm gap-2">
              <Download className="w-4 h-4" />
              Download
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-64 mb-2">
              <li>
                <button onClick={handle_download_zip} className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span>Download as ZIP</span>
                    <span className="text-xs text-base-content/60">All chunks + transcript</span>
                  </div>
                </button>
              </li>
              <li>
                <button onClick={handle_download_individual} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span>Download Individually</span>
                    <span className="text-xs text-base-content/60">Each chunk separately</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}