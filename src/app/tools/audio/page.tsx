'use client'

import React, { useState, useContext, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Mic, Settings, Sparkles, FileText, Type } from 'lucide-react'
import { MpContext } from '@/context/mp_context'
import ErrorDisplay from '@/components/error_display'
import { AudioPlayer } from './components/audio_player'
import { VoiceSelectionPanel } from './components/voice_selection_panel'
import { VoiceCloningPanel } from './components/voice_cloning_panel'
import { DocumentToAudio } from './components/document_to_audio'
import { useTextToSpeech } from './hooks/use_text_to_speech'
import { useAudioModels } from './hooks/use_audio_models'
import { 
  TTS_LIMITS, 
  TTS_MIN_CHARGE_CHARACTERS,
  calculateTTSCost,
  type TTSParams 
} from './types'

type TabType = 'text-to-speech' | 'document-to-audio'

export default function AudioPage() {
  const { mp_tokens, plan } = useContext(MpContext)
  const [active_tab, set_active_tab] = useState<TabType>('text-to-speech')
  
  // Get audio models from database
  const { models: audio_models, loading: models_loading, default_model_id } = useAudioModels(plan || 'free')
  
  // Form state
  const [text_input, set_text_input] = useState('')
  const [selected_model_id, set_selected_model_id] = useState('')
  const [selected_voice, set_selected_voice] = useState('Richard')
  const [voice_clone_url, set_voice_clone_url] = useState<string | null>(null)
  const [show_advanced, set_show_advanced] = useState(false)
  
  // Set default model when loaded
  useEffect(() => {
    if (default_model_id && !selected_model_id) {
      set_selected_model_id(default_model_id)
      // If model has default voice presets, use the first one
      const model = audio_models.find(m => m.id === default_model_id)
      if (model?.voice_presets && model.voice_presets.length > 0) {
        set_selected_voice(model.voice_presets[0])
      }
    }
  }, [default_model_id, selected_model_id, audio_models])
  
  // Advanced settings
  const [exaggeration, set_exaggeration] = useState(TTS_LIMITS.default_exaggeration)
  const [cfg, set_cfg] = useState(TTS_LIMITS.default_cfg)
  const [temperature, set_temperature] = useState(TTS_LIMITS.default_temperature)
  const [high_quality, set_high_quality] = useState(true)
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
  
  // Calculate cost based on selected model
  const selected_model = audio_models.find(m => m.id === selected_model_id)
  const text_length = text_input.length
  const chars_to_charge = Math.ceil(text_length / TTS_MIN_CHARGE_CHARACTERS) * TTS_MIN_CHARGE_CHARACTERS
  const estimated_cost = selected_model ? Math.ceil(selected_model.cost * chars_to_charge / TTS_MIN_CHARGE_CHARACTERS) : 0
  const can_generate = text_length > 0 && 
                      text_length <= TTS_LIMITS.max_text_length && 
                      (plan === 'admin' || (mp_tokens ?? 0) >= estimated_cost) &&
                      !is_generating &&
                      selected_model_id
  
  const handle_generate = async () => {
    if (!can_generate) return
    
    const params: TTSParams = {
      text: text_input,
      model: selected_model_id,
      voice: voice_clone_url ? undefined : selected_voice, // Don't send voice if using clone
      high_quality_audio: high_quality
    }
    
    // Add voice clone URL if available
    if (voice_clone_url) {
      params.source_audio_url = voice_clone_url
    }
    
    // Add advanced params if modified from defaults
    if (exaggeration !== TTS_LIMITS.default_exaggeration) params.exaggeration = exaggeration
    if (cfg !== TTS_LIMITS.default_cfg) params.cfg = cfg
    if (temperature !== TTS_LIMITS.default_temperature) params.temperature = temperature
    if (use_seed) params.seed = seed
    
    await generate_speech(params)
  }
  
  const handle_new_generation = () => {
    clear_audio()
    set_text_input('')
    set_voice_clone_url(null)
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 mb-4 pb-20 md:pb-4">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Mic className="w-8 h-8 text-primary" />
          Audio
        </h1>
        <p className="text-base-content/70">
          Transform text into natural-sounding speech with AI voices
        </p>
      </div>
      
      {/* Important Notice */}
      <div className="alert alert-warning mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div>
          <h3 className="font-bold">Important: Download your audio files</h3>
          <div className="text-sm">Audio generations are not stored permanently. Please download your audio files immediately after generation if you want to keep them.</div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${active_tab === 'text-to-speech' ? 'tab-active' : ''}`}
          onClick={() => set_active_tab('text-to-speech')}
        >
          <Type className="w-4 h-4 mr-2" />
          Text to Speech
        </button>
        <button
          className={`tab ${active_tab === 'document-to-audio' ? 'tab-active' : ''}`}
          onClick={() => set_active_tab('document-to-audio')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Document to Audio
        </button>
      </div>
      
      {/* Main Content */}
      <div className="space-y-6">
        {active_tab === 'text-to-speech' ? (
          !generated_audio ? (
            <>
              {/* Text Input */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">Enter Your Text</h2>
                
                <textarea
                  value={text_input}
                  onChange={(e) => set_text_input(e.target.value)}
                  placeholder="Type or paste your text here..."
                  className="textarea textarea-bordered w-full h-40 resize-none"
                  maxLength={TTS_LIMITS.max_text_length}
                />
                
                <div className="flex justify-between text-sm text-base-content/60 mt-2">
                  <span>{text_length} / {TTS_LIMITS.max_text_length} characters</span>
                  <div className="text-right">
                    <span className="font-semibold">
                      Cost: <span className="text-primary">{estimated_cost} MP</span>
                    </span>
                    {text_length < TTS_MIN_CHARGE_CHARACTERS && text_length > 0 && (
                      <div className="text-xs text-base-content/50">
                        Minimum charge: {TTS_MIN_CHARGE_CHARACTERS} characters
                      </div>
                    )}
                  </div>
                </div>
                
                {selected_model && (
                  <div className="alert alert-info mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                      <p className="font-semibold text-sm">
                        Pricing: {selected_model.cost} MP per 250 characters
                      </p>
                      <p className="text-xs">Minimum charge of 250 characters applies. Charges are rounded up to the nearest 250 character increment.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Model & Voice Selection */}
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
                
                {/* Model Selection */}
                <div className="mb-4">
                  <label className="label">
                    <span className="label-text">Model</span>
                  </label>
                  <select
                    value={selected_model_id}
                    onChange={(e) => {
                      set_selected_model_id(e.target.value)
                      // Update voice if model has presets
                      const model = audio_models.find(m => m.id === e.target.value)
                      if (model?.voice_presets && model.voice_presets.length > 0) {
                        set_selected_voice(model.voice_presets[0])
                      }
                    }}
                    className="select select-bordered w-full"
                    disabled={models_loading || is_generating}
                  >
                    {models_loading ? (
                      <option value="">Loading models...</option>
                    ) : audio_models.length === 0 ? (
                      <option value="">No models available</option>
                    ) : (
                      audio_models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.cost} MP per 250 chars)
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                {/* Show voice selection only if model has voice presets */}
                {selected_model?.voice_presets && selected_model.voice_presets.length > 0 && (
                  <VoiceSelectionPanel
                    selected_voice={selected_voice}
                    on_voice_change={set_selected_voice}
                    disabled={is_generating || !!voice_clone_url}
                    voice_options={selected_model.voice_presets.map(v => ({ id: v, name: v }))}
                  />
                )}
                
                {/* Voice Cloning Section */}
                <div className="divider">OR</div>
                
                {/* Show voice cloning only if model supports it */}
                {selected_model?.supports_voice_cloning && (
                  <>
                    <VoiceCloningPanel
                      on_voice_ready={set_voice_clone_url}
                      is_uploading={false}
                    />
                  </>
                )}
                
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
            <div className="flex justify-center mb-16 md:mb-0">
              <button
                onClick={handle_generate}
                disabled={!can_generate}
                className="btn btn-primary btn-lg gap-2"
              >
                {is_generating ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Generating Speech...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Speech ({estimated_cost} MP)
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Audio Player */}
            <AudioPlayer
              audio_url={generated_audio.audio_url}
              text_preview={text_input}
              mana_points_used={generated_audio.mana_points_used}
            />
            
            {/* New Generation Button */}
            <div className="flex justify-center mb-16 md:mb-0">
              <button
                onClick={handle_new_generation}
                className="btn btn-primary"
              >
                Generate New Speech
              </button>
            </div>
          </>
        )
        ) : (
          /* Document to Audio Tab */
          <DocumentToAudio />
        )}
        
        {/* Error Display - Only show for text-to-speech tab */}
        {active_tab === 'text-to-speech' && error_message && (
          <ErrorDisplay error_message={error_message} />
        )}
      </div>
    </div>
  )
}