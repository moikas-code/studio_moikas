import React, { useState, useRef, useEffect } from 'react'
import { Download, Play, Pause, SkipForward, SkipBack, List, Archive, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { ChunkedTTSResult } from '../hooks/use_webhook_chunked_tts'
import { toast } from 'react-hot-toast'
import JSZip from 'jszip'

interface ChunkedAudioPlayerProps {
  chunked_result: ChunkedTTSResult
  text_preview?: string
  on_regenerate_chunk?: (chunk_index: number) => Promise<void>
  is_regenerating_chunk?: number | null
}

export function ChunkedAudioPlayer({ 
  chunked_result,
  on_regenerate_chunk,
  is_regenerating_chunk 
}: ChunkedAudioPlayerProps) {
  const [current_chunk, set_current_chunk] = useState(0)
  const [is_playing, set_is_playing] = useState(false)
  const [show_playlist, set_show_playlist] = useState(false)
  const [disabled_chunks, set_disabled_chunks] = useState<Set<number>>(new Set())
  const audio_ref = useRef<HTMLAudioElement>(null)

  const current_audio = chunked_result.chunks[current_chunk]
  const total_chunks = chunked_result.chunks.length
  const all_chunks_ready = chunked_result.chunks.every(chunk => 
    chunk.status === 'completed' && chunk.audio_url
  )
  const ready_chunks_count = chunked_result.chunks.filter(chunk => 
    chunk.status === 'completed' && chunk.audio_url
  ).length

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
    const active_chunks = chunked_result.chunks.filter((_, index) => !disabled_chunks.has(index))
    
    if (active_chunks.length === 0) {
      toast.error('No active chunks to download')
      return
    }
    
    toast(`Downloading ${active_chunks.length} active audio chunks...`, { icon: '📥' })
    
    let file_index = 1
    for (let i = 0; i < chunked_result.chunks.length; i++) {
      if (disabled_chunks.has(i)) continue
      
      const chunk = chunked_result.chunks[i]
      if (!chunk.audio_url) {
        console.warn(`Skipping chunk ${i + 1}: no audio URL`)
        continue
      }
      try {
        const response = await fetch(chunk.audio_url)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audio_chunk_${file_index}.mp3`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        file_index++
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Failed to download chunk ${i + 1}:`, error)
      }
    }
    
    toast.success(`${active_chunks.length} chunks downloaded!`)
  }

  const toggle_chunk = (index: number) => {
    const new_disabled = new Set(disabled_chunks)
    if (new_disabled.has(index)) {
      new_disabled.delete(index)
    } else {
      new_disabled.add(index)
    }
    set_disabled_chunks(new_disabled)
  }

  const handle_regenerate_chunk = async (index: number) => {
    if (on_regenerate_chunk) {
      await on_regenerate_chunk(index)
    }
  }

  const handle_download_zip = async () => {
    const loading_toast = toast.loading('Creating zip file...', { icon: '📦' })
    
    try {
      const zip = new JSZip()
      const audio_folder = zip.folder('audio_chunks')
      
      if (!audio_folder) {
        throw new Error('Failed to create zip folder')
      }

      // Filter active chunks only (must have audio_url)
      const active_chunks = chunked_result.chunks.filter((chunk, index) => 
        !disabled_chunks.has(index) && chunk.audio_url && chunk.status === 'completed'
      )
      
      if (active_chunks.length === 0) {
        toast.error('No active chunks to download', { id: loading_toast })
        return
      }

      // Add metadata file
      const metadata = {
        total_chunks: active_chunks.length,
        total_chunks_original: total_chunks,
        disabled_chunks: Array.from(disabled_chunks),
        total_characters: active_chunks.reduce((sum, chunk) => sum + chunk.text.length, 0),
        total_cost_mp: active_chunks.reduce((sum, chunk) => sum + (chunk.mana_points_used || 0), 0),
        generated_at: new Date().toISOString(),
        chunks: active_chunks.map((chunk, index) => ({
          original_index: chunked_result.chunks.indexOf(chunk) + 1,
          text_length: chunk.text.length,
          text_preview: chunk.text.substring(0, 100) + '...',
          filename: `chunk_${String(index + 1).padStart(3, '0')}.mp3`
        }))
      }
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2))
      
      // Add transcript file (only active chunks)
      const transcript = active_chunks
        .map((chunk, index) => {
          const original_index = chunked_result.chunks.indexOf(chunk)
          return `[Chunk ${original_index + 1} (File: chunk_${String(index + 1).padStart(3, '0')}.mp3)]\n${chunk.text}\n`
        })
        .join('\n---\n\n')
      
      zip.file('transcript.txt', transcript)
      
      // Download and add only active audio files
      for (let i = 0; i < active_chunks.length; i++) {
        const chunk = active_chunks[i]
        try {
          toast.loading(`Processing chunk ${i + 1} of ${active_chunks.length}...`, { 
            id: loading_toast,
            icon: '🎵' 
          })
          
          if (!chunk.audio_url) {
            throw new Error(`Chunk ${i + 1} has no audio URL`)
          }
          
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
            <div className="stat-title">Active Chunks</div>
            <div className="stat-value text-primary">{total_chunks - disabled_chunks.size}/{total_chunks}</div>
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
        <div className={`bg-base-200 rounded-lg p-4 mb-4 ${disabled_chunks.has(current_chunk) ? 'opacity-50' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                Chunk {current_chunk + 1} of {total_chunks}
              </h3>
              {disabled_chunks.has(current_chunk) && (
                <span className="badge badge-warning badge-sm">Disabled</span>
              )}
            </div>
            <div className="flex gap-2">
              {on_regenerate_chunk && (
                <button
                  onClick={() => handle_regenerate_chunk(current_chunk)}
                  disabled={is_regenerating_chunk === current_chunk || disabled_chunks.has(current_chunk)}
                  className="btn btn-ghost btn-sm gap-2"
                  title="Regenerate current chunk"
                >
                  {is_regenerating_chunk === current_chunk ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Redo
                </button>
              )}
              <button
                onClick={() => set_show_playlist(!show_playlist)}
                className="btn btn-ghost btn-sm gap-2"
              >
                <List className="w-4 h-4" />
                Playlist
              </button>
            </div>
          </div>
          <p className={`text-sm text-base-content/70 line-clamp-3 ${disabled_chunks.has(current_chunk) ? 'line-through' : ''}`}>
            {current_audio.text}
          </p>
        </div>

        {/* Audio Player */}
        <div className="bg-base-300 rounded-lg p-4">
          {current_audio.audio_url ? (
            <audio
              ref={audio_ref}
              src={current_audio.audio_url}
              onEnded={handle_ended}
              className="hidden"
            />
          ) : (
            <div className="text-center p-4">
              {current_audio.status === 'processing' ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="text-sm">Processing chunk {current_chunk + 1}...</span>
                </div>
              ) : current_audio.status === 'failed' ? (
                <span className="text-error">Failed to generate this chunk</span>
              ) : (
                <span className="text-base-content/50">Waiting to process...</span>
              )}
            </div>
          )}
          
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
              disabled={!current_audio.audio_url || current_audio.status !== 'completed'}
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
                disabled={disabled_chunks.has(index)}
                className={`rounded-full transition-all ${
                  disabled_chunks.has(index)
                    ? 'w-2 h-2 bg-base-content/10 cursor-not-allowed'
                    : index === current_chunk
                    ? 'w-8 h-2 bg-primary'
                    : 'w-2 h-2 bg-base-content/30 hover:bg-base-content/50'
                }`}
                title={`${disabled_chunks.has(index) ? '[Disabled] ' : ''}Go to chunk ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Playlist */}
        {show_playlist && (
          <div className="mt-4 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">All Chunks</h4>
            <div className="space-y-2">
              {chunked_result.chunks.map((chunk, index) => {
                const is_disabled = disabled_chunks.has(index)
                const is_regenerating = is_regenerating_chunk === index
                
                return (
                  <div
                    key={index}
                    className={`rounded-lg transition-all ${
                      is_disabled ? 'opacity-50' : ''
                    } ${
                      index === current_chunk
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                  >
                    <div className="bg-base-200 p-3 rounded-lg">
                      <div className="flex justify-between items-start gap-2">
                        <button
                          onClick={() => handle_chunk_select(index)}
                          disabled={is_disabled}
                          className="flex-1 text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${is_disabled ? 'line-through' : ''}`}>
                              Chunk {index + 1}
                            </span>
                            <span className="text-xs opacity-70">
                              {chunk.text.length} chars
                              {chunk.mana_points_used !== undefined && ` · ${chunk.mana_points_used} MP`}
                              {chunk.status === 'processing' && ' · Processing...'}
                              {chunk.status === 'failed' && ' · Failed'}
                              {chunk.status === 'pending' && ' · Pending'}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 line-clamp-2 opacity-80 ${is_disabled ? 'line-through' : ''}`}>
                            {chunk.text}
                          </p>
                        </button>
                        
                        <div className="flex gap-1">
                          {on_regenerate_chunk && (
                            <button
                              onClick={() => handle_regenerate_chunk(index)}
                              disabled={is_regenerating || is_disabled}
                              className="btn btn-ghost btn-xs"
                              title="Regenerate this chunk"
                            >
                              {is_regenerating ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => toggle_chunk(index)}
                            className="btn btn-ghost btn-xs"
                            title={is_disabled ? "Enable chunk" : "Disable chunk"}
                          >
                            {is_disabled ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions justify-end mt-4 gap-2">
          <div className="dropdown dropdown-top dropdown-end">
            <button tabIndex={0} className="btn btn-outline btn-sm gap-2" disabled={ready_chunks_count === 0}>
              <Download className="w-4 h-4" />
              Download {!all_chunks_ready && `(${ready_chunks_count}/${total_chunks})`}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
                          </button>
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