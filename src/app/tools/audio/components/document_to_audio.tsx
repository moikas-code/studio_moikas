import React, { useState, useContext, useMemo, useEffect } from 'react'
import { Sparkles, Settings, Globe, Upload, History } from 'lucide-react'
import { MpContext } from '@/app/context/mp_context'
import { DocumentUploader } from './document_uploader'
import { UrlInput } from './url_input'
import { VoiceSelectionPanel } from './voice_selection_panel'
import { VoiceCloningPanel } from './voice_cloning_panel'
import { ChunkedAudioPlayer } from './chunked_audio_player'
import { useWebhookChunkedTts } from '../hooks/use_webhook_chunked_tts'
import ErrorDisplay from '@/app/components/error_display'
import { 
  TTS_LIMITS, 
  TTS_MIN_CHARGE_CHARACTERS,
  calculateTTSCost,
  type TTSParams 
} from '../types'
import { AudioJobStorage } from '../utils/audio_job_storage'
import { toast } from 'react-hot-toast'

type InputMethod = 'document' | 'url'

export function DocumentToAudio() {
  const { mp_tokens, plan } = useContext(MpContext)
  
  // Source selection
  const [input_method, set_input_method] = useState<InputMethod>('document')
  const [extracted_text, set_extracted_text] = useState('')
  const [is_extracting, set_is_extracting] = useState(false)
  
  // Voice settings
  const [selected_voice, set_selected_voice] = useState('Richard')
  const [voice_clone_url, set_voice_clone_url] = useState<string | null>(null)
  const [show_advanced, set_show_advanced] = useState(false)
  
  // Advanced settings
  const [exaggeration, set_exaggeration] = useState(TTS_LIMITS.default_exaggeration)
  const [cfg, set_cfg] = useState(TTS_LIMITS.default_cfg)
  const [temperature, set_temperature] = useState(TTS_LIMITS.default_temperature)
  const [high_quality, set_high_quality] = useState(true)
  const [use_seed, set_use_seed] = useState(false)
  const [seed, set_seed] = useState(0)
  
  // Saved jobs state
  const [show_saved_jobs, set_show_saved_jobs] = useState(false)
  interface RecentJob {
    job_id: string
    type: 'document' | 'audio'
    status: string
    text_preview: string
    character_count: number
    chunk_count: number
    created_at: string
    completed_at?: string
    has_audio: boolean
  }
  
  const [saved_jobs, set_saved_jobs] = useState<RecentJob[]>([])
  const [is_loading_jobs, set_is_loading_jobs] = useState(false)
  
  // Hook for webhook-based chunked TTS functionality
  const { 
    is_generating, 
    error_message, 
    generated_audio, 
    progress,
    generate_chunked_speech,
    regenerate_chunk,
    is_regenerating_chunk,
    clear_audio,
    restore_job 
  } = useWebhookChunkedTts()
  
  // Fetch recent jobs from database
  const fetch_recent_jobs = useCallback(async () => {
    set_is_loading_jobs(true)
    try {
      const response = await fetch('/api/audio/recent-jobs?limit=20&days=7')
      if (response.ok) {
        const data = await response.json()
        set_saved_jobs(data.data.jobs)
      }
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error)
    } finally {
      set_is_loading_jobs(false)
    }
  }, [])
  
  // Check for saved jobs on mount
  useEffect(() => {
    fetch_recent_jobs()
  }, [fetch_recent_jobs])
  
  const handle_text_extracted = (text: string) => {
    set_extracted_text(text)
    set_is_extracting(false)
  }
  
  const handle_generate = async () => {
    if (!extracted_text) return
    
    const params: TTSParams = {
      text: extracted_text, // Send full text - chunking will be handled by the hook
      voice: voice_clone_url ? undefined : selected_voice,
      high_quality_audio: high_quality
    }
    
    if (voice_clone_url) {
      params.source_audio_url = voice_clone_url
    }
    
    if (exaggeration !== TTS_LIMITS.default_exaggeration) params.exaggeration = exaggeration
    if (cfg !== TTS_LIMITS.default_cfg) params.cfg = cfg
    if (temperature !== TTS_LIMITS.default_temperature) params.temperature = temperature
    if (use_seed) params.seed = seed
    
    const result = await generate_chunked_speech(params)
    
    // Save job to local storage if successful
    if (result && result.job_id) {
      const voice_settings = {
        selected_voice: voice_clone_url ? undefined : selected_voice,
        voice_clone_url,
        exaggeration,
        cfg,
        temperature,
        high_quality,
        use_seed,
        seed: use_seed ? seed : undefined
      }
      
      AudioJobStorage.save_job(result.job_id, extracted_text, voice_settings, result.chunks.length)
      
      // Refresh the jobs list to include the new job
      fetch_recent_jobs()
    }
  }
  
  const handle_reset = () => {
    set_extracted_text('')
    set_voice_clone_url(null)
    clear_audio()
    
    // Also remove from local storage if there's a current job
    if (generated_audio?.job_id) {
      AudioJobStorage.remove_job(generated_audio.job_id)
      fetch_recent_jobs()
    }
  }
  
  const handle_restore_job = async (job_id: string, job_data?: RecentJob) => {
    // First try to get from local storage for full data
    const stored_job = AudioJobStorage.get_job(job_id)
    
    if (stored_job) {
      // Restore from local storage (has full text and settings)
      set_extracted_text(stored_job.extracted_text)
      if (stored_job.voice_settings.selected_voice) {
        set_selected_voice(stored_job.voice_settings.selected_voice)
      }
      if (stored_job.voice_settings.voice_clone_url) {
        set_voice_clone_url(stored_job.voice_settings.voice_clone_url)
      }
      set_exaggeration(stored_job.voice_settings.exaggeration || TTS_LIMITS.default_exaggeration)
      set_cfg(stored_job.voice_settings.cfg || TTS_LIMITS.default_cfg)
      set_temperature(stored_job.voice_settings.temperature || TTS_LIMITS.default_temperature)
      set_high_quality(stored_job.voice_settings.high_quality ?? true)
      set_use_seed(stored_job.voice_settings.use_seed ?? false)
      if (stored_job.voice_settings.seed !== undefined) {
        set_seed(stored_job.voice_settings.seed)
      }
      
      // Try to restore the job status
      const success = await restore_job(job_id, stored_job.extracted_text)
      if (success) {
        set_show_saved_jobs(false)
        toast.success('Job restored successfully')
      } else {
        toast.error('Failed to restore job status')
      }
    } else if (job_data) {
      // Restore from database (limited data)
      // For database jobs, we can only restore the status, not the full text
      const success = await restore_job(job_id)
      if (success) {
        set_show_saved_jobs(false)
        toast.success('Job status restored')
        
        // If it's a document job, show a note about limited restoration
        if (job_data.type === 'document') {
          toast('Note: Original text not available. Only audio playback restored.', { icon: 'ℹ️' })
        }
      } else {
        toast.error('Failed to restore job status')
      }
    } else {
      toast.error('Job data not available')
    }
  }
  
  // Calculate cost for the full text (all chunks)
  const text_length = extracted_text.length
  const estimated_cost = useMemo(() => calculateTTSCost(text_length, plan), [text_length, plan])
  const num_chunks = useMemo(() => Math.ceil(text_length / 1000), [text_length] ) // 1000 character chunks
  const can_generate = useMemo(() => text_length > 0 && 
                        (mp_tokens ?? 0) >= estimated_cost &&
                        !is_generating, [text_length, mp_tokens, estimated_cost, is_generating])
  
  // Clean up completed jobs from storage after successful completion
  useEffect(() => {
    if (generated_audio?.overall_status === 'completed' && generated_audio.job_id) {
      // Remove from storage after a delay to ensure user has seen the result
      const timer = setTimeout(() => {
        AudioJobStorage.remove_job(generated_audio.job_id)
        fetch_recent_jobs()
      }, 5000) // 5 second delay
      
      return () => clearTimeout(timer)
    }
  }, [generated_audio?.overall_status, generated_audio?.job_id, fetch_recent_jobs])
  
  // If audio is generated, show chunked player
  if (generated_audio) {
    
    const handle_regenerate_chunk = async (chunk_index: number) => {
      const params: Omit<TTSParams, 'text'> = {
        voice: voice_clone_url ? undefined : selected_voice,
        high_quality_audio: high_quality
      }
      
      if (voice_clone_url) {
        params.source_audio_url = voice_clone_url
      }
      
      if (exaggeration !== TTS_LIMITS.default_exaggeration) params.exaggeration = exaggeration
      if (cfg !== TTS_LIMITS.default_cfg) params.cfg = cfg
      if (temperature !== TTS_LIMITS.default_temperature) params.temperature = temperature
      if (use_seed) params.seed = seed
      
      await regenerate_chunk(chunk_index, params)
    }

    return (
      <div className="space-y-6">
        <ChunkedAudioPlayer
          chunked_result={generated_audio}
          text_preview={extracted_text.substring(0, 200) + '...'}
          on_regenerate_chunk={handle_regenerate_chunk}
          is_regenerating_chunk={is_regenerating_chunk}
        />
        
        <div className="flex justify-center mb-16 md:mb-0">
          <button
            onClick={handle_reset}
            className="btn btn-primary"
          >
            Convert Another Document
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Saved Jobs */}
      {!extracted_text && !generated_audio && saved_jobs.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Previous Jobs</h2>
              <button
                onClick={() => set_show_saved_jobs(!show_saved_jobs)}
                className="btn btn-ghost btn-sm gap-2"
              >
                <History className="w-4 h-4" />
                {show_saved_jobs ? 'Hide' : 'Show'} ({saved_jobs.length})
              </button>
            </div>
            
            {show_saved_jobs && (
              <div className="space-y-2">
                {is_loading_jobs ? (
                  <div className="text-center py-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <p className="text-sm mt-2">Loading recent jobs...</p>
                  </div>
                ) : saved_jobs.length === 0 ? (
                  <p className="text-center text-base-content/60 py-4">
                    No recent audio jobs found
                  </p>
                ) : (
                  <>
                    {saved_jobs.slice(0, 10).map((job) => {
                      const created_date = new Date(job.created_at)
                      const is_local = AudioJobStorage.get_job(job.job_id) !== null
                      
                      return (
                        <div key={job.job_id} className="bg-base-200 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {job.type === 'document' ? (
                                    <>{job.chunk_count} chunk{job.chunk_count > 1 ? 's' : ''} • {job.character_count.toLocaleString()} characters</>
                                  ) : (
                                    <>{job.character_count.toLocaleString()} characters</>
                                  )}
                                </p>
                                <span className={`badge badge-xs ${
                                  job.status === 'completed' ? 'badge-success' : 
                                  job.status === 'processing' ? 'badge-warning' : 
                                  job.status === 'failed' ? 'badge-error' : 
                                  'badge-ghost'
                                }`}>
                                  {job.status}
                                </span>
                                {is_local && (
                                  <span className="badge badge-xs badge-primary">Local</span>
                                )}
                              </div>
                              <p className="text-xs text-base-content/60 mt-1">
                                Created {created_date.toLocaleDateString()} at {created_date.toLocaleTimeString()}
                              </p>
                              {job.text_preview && (
                                <p className="text-xs mt-2 line-clamp-2 opacity-70">
                                  {job.text_preview}...
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handle_restore_job(job.job_id, job)}
                              className="btn btn-primary btn-sm ml-2"
                              disabled={job.status === 'failed'}
                            >
                              {job.status === 'completed' ? 'Play' : 'View'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    
                    {saved_jobs.length > 10 && (
                      <p className="text-sm text-center text-base-content/60 mt-2">
                        Showing 10 of {saved_jobs.length} recent jobs
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Input Method Selection */}
      {!extracted_text && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Extract Text From</h2>
            
            {/* Method Tabs */}
            <div className="tabs tabs-boxed mb-6">
              <button
                className={`tab ${input_method === 'document' ? 'tab-active' : ''}`}
                onClick={() => set_input_method('document')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Document
              </button>
              <button
                className={`tab ${input_method === 'url' ? 'tab-active' : ''}`}
                onClick={() => set_input_method('url')}
              >
                <Globe className="w-4 h-4 mr-2" />
                URL
              </button>
            </div>
            
            {/* Input Component */}
            {input_method === 'document' ? (
              <DocumentUploader
                on_text_extracted={handle_text_extracted}
                is_processing={is_extracting}
              />
            ) : (
              <UrlInput
                on_text_extracted={handle_text_extracted}
                is_processing={is_extracting}
              />
            )}
          </div>
        </div>
      )}
      
      
      {/* Text Preview & Voice Settings */}
      {extracted_text && !generated_audio && (
        <>
          {/* Extracted Text Preview */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-4">Extracted Text</h2>
              
              <textarea
                className="textarea textarea-bordered w-full h-64 font-mono text-sm bg-base-200"
                value={extracted_text}
                readOnly
                style={{ resize: 'vertical' }}
              />
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">
                  {text_length.toLocaleString()} characters
                  {num_chunks > 1 && (
                    <span className="text-info"> ({num_chunks} chunks)</span>
                  )}
                </span>
                <div className="text-right">
                  <span className="font-semibold text-sm">
                    Total Cost: <span className="text-primary">{estimated_cost} MP</span>
                  </span>
                  {text_length < TTS_MIN_CHARGE_CHARACTERS && (
                    <div className="text-xs text-base-content/50">
                      Minimum charge: {TTS_MIN_CHARGE_CHARACTERS} characters
                    </div>
                  )}
                </div>
              </div>
              
              {num_chunks > 1 && (
                <div className="alert alert-info mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="font-semibold">Document will be converted in {num_chunks} chunks</p>
                    <p className="text-sm">Each chunk contains up to 1000 characters. Words are kept intact to avoid cut-offs.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Voice Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Voice Settings</h2>
                <button
                  onClick={() => set_show_advanced(!show_advanced)}
                  className="btn btn-ghost btn-sm gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Advanced
                </button>
              </div>
              
              <VoiceSelectionPanel
                selected_voice={selected_voice}
                on_voice_change={set_selected_voice}
                disabled={is_generating || !!voice_clone_url}
              />
              
              <div className="divider">OR</div>
              
              <VoiceCloningPanel
                on_voice_ready={set_voice_clone_url}
                is_uploading={false}
              />
              
              {/* Advanced Settings */}
              {show_advanced && (
                <div className="mt-6 space-y-4 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-semibold">Advanced Settings</h3>
                  
                  <div>
                    <label className="label">
                      <span className="label-text">Emotion Exaggeration</span>
                      <span className="label-text-alt">{exaggeration}</span>
                    </label>
                    <input
                      type="range"
                      min={TTS_LIMITS.min_exaggeration}
                      max={TTS_LIMITS.max_exaggeration}
                      step="0.05"
                      value={exaggeration}
                      onChange={(e) => set_exaggeration(Number(e.target.value))}
                      className="range range-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text">Conditioning Factor (CFG)</span>
                      <span className="label-text-alt">{cfg}</span>
                    </label>
                    <input
                      type="range"
                      min={TTS_LIMITS.min_cfg}
                      max={TTS_LIMITS.max_cfg}
                      step="0.05"
                      value={cfg}
                      onChange={(e) => set_cfg(Number(e.target.value))}
                      className="range range-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text">Temperature</span>
                      <span className="label-text-alt">{temperature}</span>
                    </label>
                    <input
                      type="range"
                      min={TTS_LIMITS.min_temperature}
                      max={TTS_LIMITS.max_temperature}
                      step="0.05"
                      value={temperature}
                      onChange={(e) => set_temperature(Number(e.target.value))}
                      className="range range-primary"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">High Quality Audio (48kHz)</span>
                      <input
                        type="checkbox"
                        checked={high_quality}
                        onChange={(e) => set_high_quality(e.target.checked)}
                        className="checkbox checkbox-primary"
                      />
                    </label>
                  </div>
                  
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Use Fixed Seed</span>
                      <input
                        type="checkbox"
                        checked={use_seed}
                        onChange={(e) => set_use_seed(e.target.checked)}
                        className="checkbox checkbox-primary"
                      />
                    </label>
                    {use_seed && (
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => set_seed(Number(e.target.value))}
                        min="0"
                        max={TTS_LIMITS.max_seed}
                        className="input input-bordered input-sm mt-2"
                        placeholder="Seed value"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar for Multi-chunk Generation */}
          {is_generating && progress.total > 1 && (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="font-semibold mb-2">Generation Progress</h3>
                <div className="w-full">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Chunk {progress.current} of {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <progress 
                    className="progress progress-primary w-full" 
                    value={progress.current} 
                    max={progress.total}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Generate Button */}
          <div className="flex justify-center gap-4 mb-16 md:mb-0">
            <button
              onClick={handle_reset}
              className="btn btn-ghost"
            >
              Start Over
            </button>
            <button
              onClick={handle_generate}
              disabled={!can_generate}
              className="btn btn-primary btn-lg gap-2"
            >
              {is_generating ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {progress.total > 1 ? (
                    <span>Converting Chunk {progress.current} of {progress.total}...</span>
                  ) : (
                    <span>Converting to Audio...</span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {num_chunks > 1 ? (
                    <span>Convert to Audio ({num_chunks} chunks, {estimated_cost} MP)</span>
                  ) : (
                    <span>Convert to Audio ({estimated_cost} MP)</span>
                  )}
                </>
              )}
            </button>
          </div>
        </>
      )}
      
      {/* Error Display */}
      {error_message && (
        <ErrorDisplay error_message={error_message} />
      )}
    </div>
  )
}