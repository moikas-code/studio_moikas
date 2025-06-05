import React, { useState, useContext } from 'react'
import { FileText, Link, ArrowRight, Sparkles, Settings } from 'lucide-react'
import { MpContext } from '@/app/context/mp_context'
import { DocumentUploader } from './document_uploader'
import { UrlInput } from './url_input'
import { VoiceSelectionPanel } from './voice_selection_panel'
import { VoiceCloningPanel } from './voice_cloning_panel'
import { AudioPlayer } from './audio_player'
import { useTextToSpeech } from '../hooks/use_text_to_speech'
import ErrorDisplay from '@/app/components/error_display'
import { 
  TTS_LIMITS, 
  TTS_MIN_CHARGE_CHARACTERS,
  calculateTTSCost,
  type TTSParams 
} from '../types'

type SourceType = 'document' | 'url' | null

export function DocumentToAudio() {
  const { mp_tokens } = useContext(MpContext)
  
  // Source selection
  const [source_type, set_source_type] = useState<SourceType>(null)
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
  const [high_quality, set_high_quality] = useState(false)
  const [use_seed, set_use_seed] = useState(false)
  const [seed, set_seed] = useState(0)
  
  // Hook for TTS functionality
  const { 
    is_generating, 
    error_message, 
    generated_audio, 
    generate_speech,
    clear_audio 
  } = useTextToSpeech()
  
  const handle_text_extracted = (text: string) => {
    set_extracted_text(text)
    set_is_extracting(false)
  }
  
  const handle_generate = async () => {
    if (!extracted_text) return
    
    const params: TTSParams = {
      text: extracted_text,
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
    
    await generate_speech(params)
  }
  
  const handle_reset = () => {
    set_source_type(null)
    set_extracted_text('')
    set_voice_clone_url(null)
    clear_audio()
  }
  
  // Calculate cost
  const text_length = extracted_text.length
  const estimated_cost = calculateTTSCost(text_length)
  const can_generate = text_length > 0 && 
                      text_length <= TTS_LIMITS.max_text_length && 
                      (mp_tokens ?? 0) >= estimated_cost &&
                      !is_generating
  
  // If audio is generated, show player
  if (generated_audio) {
    return (
      <div className="space-y-6">
        <AudioPlayer
          audio_url={generated_audio.audio_url}
          text_preview={extracted_text.substring(0, 200) + '...'}
          mana_points_used={generated_audio.mana_points_used}
        />
        
        <div className="flex justify-center">
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
      {/* Source Selection */}
      {!source_type && !extracted_text && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => set_source_type('document')}
            className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer p-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">Upload Document</p>
                <p className="text-xs text-base-content/60 mt-1">
                  PDF, TXT, DOC, DOCX, ODT
                </p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => set_source_type('url')}
            className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer p-6"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Link className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium">From URL</p>
                <p className="text-xs text-base-content/60 mt-1">
                  Articles, blogs, documentation
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
      
      {/* Document Upload */}
      {source_type === 'document' && !extracted_text && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Upload Document</h2>
              <button
                onClick={() => set_source_type(null)}
                className="btn btn-ghost btn-sm"
              >
                Back
              </button>
            </div>
            <DocumentUploader
              on_text_extracted={handle_text_extracted}
              is_processing={is_extracting}
            />
          </div>
        </div>
      )}
      
      {/* URL Input */}
      {source_type === 'url' && !extracted_text && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title">Extract from URL</h2>
              <button
                onClick={() => set_source_type(null)}
                className="btn btn-ghost btn-sm"
              >
                Back
              </button>
            </div>
            <UrlInput
              on_text_extracted={handle_text_extracted}
              is_processing={is_extracting}
            />
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
              
              <div className="bg-base-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap">{extracted_text}</p>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">
                  {text_length} characters
                </span>
                <div className="text-right">
                  <span className="font-semibold text-sm">
                    Cost: <span className="text-primary">{estimated_cost} MP</span>
                  </span>
                  {text_length < TTS_MIN_CHARGE_CHARACTERS && (
                    <div className="text-xs text-base-content/50">
                      Minimum charge: {TTS_MIN_CHARGE_CHARACTERS} characters
                    </div>
                  )}
                </div>
              </div>
              
              {text_length > TTS_LIMITS.max_text_length && (
                <div className="alert alert-warning mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Text exceeds maximum length. Only first {TTS_LIMITS.max_text_length} characters will be converted.</span>
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
          
          {/* Generate Button */}
          <div className="flex justify-center gap-4">
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
                  Converting to Audio...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Convert to Audio ({estimated_cost} MP)
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