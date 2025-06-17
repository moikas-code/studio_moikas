"use client";

import React, { useState, useContext, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Mic, Settings, Sparkles, FileText, Type } from "lucide-react";
import { MpContext } from "@/context/mp_context";
import ErrorDisplay from "@/components/error_display";
import { AudioPlayer } from "./components/audio_player";
import { VoiceSelectionPanel } from "./components/voice_selection_panel";
import { VoiceCloningPanel } from "./components/voice_cloning_panel";
import { DocumentToAudio } from "./components/document_to_audio";
import { useTextToSpeech } from "./hooks/use_text_to_speech";
import { useAudioModels } from "./hooks/use_audio_models";
import { TTS_LIMITS, TTS_MIN_CHARGE_CHARACTERS, type TTSParams } from "./types";

type TabType = "text-to-speech" | "document-to-audio";

export default function AudioToolsClient() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  const { models, loading: models_loading, error: models_error } = useAudioModels(plan || "free");
  const [active_tab, set_active_tab] = useState<TabType>("text-to-speech");
  const [text, set_text] = useState("");
  const [show_voice_settings, set_show_voice_settings] = useState(false);
  const [selected_model_id, set_selected_model_id] = useState("");
  const [selected_voice, set_selected_voice] = useState("");
  const [custom_voice_id, set_custom_voice_id] = useState<string | null>(null);
  const [show_cloning_panel, set_show_cloning_panel] = useState(false);
  const [character_count, set_character_count] = useState(0);

  // Find default model
  const default_model = models.find((m) => m.is_default);

  // Set default model and voice when models load
  useEffect(() => {
    if (default_model && !selected_model_id) {
      set_selected_model_id(default_model.id);
      // Set first voice as default
      if (default_model.voices && default_model.voices.length > 0) {
        set_selected_voice(default_model.voices[0].id);
      }
    }
  }, [default_model, selected_model_id]);

  const selected_model = models.find((m) => m.id === selected_model_id);

  const {
    generate,
    is_generating,
    error: generation_error,
    audio_url,
    job_id,
  } = useTextToSpeech({
    on_tokens_update: refresh_mp,
  });

  const handle_generate = async () => {
    if (!text.trim() || !selected_voice || !selected_model_id) return;

    const params: TTSParams = {
      text: text.trim(),
      model_id: selected_model_id,
      voice_id: custom_voice_id || selected_voice,
    };

    await generate(params);
  };

  const handle_voice_clone = (voice_id: string) => {
    set_custom_voice_id(voice_id);
    set_show_cloning_panel(false);
  };

  const handle_text_change = (value: string) => {
    set_text(value);
    set_character_count(value.length);
  };

  const get_estimated_cost = () => {
    if (!selected_model || character_count === 0) return 0;

    const base_cost = selected_model.base_cost || 0;
    const char_divisor = selected_model.char_divisor || 250;

    // Characters are charged in minimum blocks
    const charged_chars = Math.max(character_count, TTS_MIN_CHARGE_CHARACTERS);

    return Math.ceil(base_cost * (charged_chars / char_divisor));
  };

  const can_generate = text.trim() && selected_voice && selected_model_id && !is_generating;
  const estimated_cost = get_estimated_cost();

  if (models_loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading loading-spinner loading-lg text-jade"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audio Tools</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Sparkles className="w-4 h-4" />
          <span>{mp_tokens || 0} MP</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 glass dark:glass-dark rounded-2xl shadow-macos">
        <button
          onClick={() => set_active_tab("text-to-speech")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            active_tab === "text-to-speech"
              ? "bg-white dark:bg-gray-800 shadow-sm text-jade"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Type className="w-4 h-4" />
          Text to Speech
        </button>
        <button
          onClick={() => set_active_tab("document-to-audio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            active_tab === "document-to-audio"
              ? "bg-white dark:bg-gray-800 shadow-sm text-jade"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Document to Audio
        </button>
      </div>

      {/* Error Display */}
      {(models_error || generation_error) && (
        <ErrorDisplay
          error={models_error || generation_error}
          on_retry={models_error ? () => window.location.reload() : undefined}
        />
      )}

      {/* Content Area */}
      {active_tab === "text-to-speech" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enter Your Text
                </h2>
                <span className="text-sm text-gray-500">
                  {character_count} / {TTS_LIMITS.MAX_CHARS} characters
                </span>
              </div>

              <textarea
                value={text}
                onChange={(e) => handle_text_change(e.target.value)}
                placeholder="Type or paste your text here..."
                maxLength={TTS_LIMITS.MAX_CHARS}
                className="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-jade focus:border-transparent"
                disabled={is_generating}
              />

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Min charge: {TTS_MIN_CHARGE_CHARACTERS} characters
                </div>
                {estimated_cost > 0 && (
                  <div className="text-sm font-medium text-jade">
                    Estimated cost: {estimated_cost} MP
                  </div>
                )}
              </div>
            </div>

            {/* Audio Player */}
            {(audio_url || job_id) && (
              <AudioPlayer audio_url={audio_url} job_id={job_id} on_tokens_update={refresh_mp} />
            )}

            {/* Generate Button */}
            <button
              onClick={handle_generate}
              disabled={!can_generate}
              className="w-full py-4 bg-gradient-to-r from-jade to-jade-dark text-white font-medium rounded-2xl shadow-macos hover:shadow-macos-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {is_generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating Audio...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Mic className="w-5 h-5" />
                  Generate Audio
                </span>
              )}
            </button>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Model</h3>
              <select
                value={selected_model_id}
                onChange={(e) => {
                  set_selected_model_id(e.target.value);
                  // Reset voice selection when model changes
                  const new_model = models.find((m) => m.id === e.target.value);
                  if (new_model?.voices && new_model.voices.length > 0) {
                    set_selected_voice(new_model.voices[0].id);
                  }
                }}
                className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-jade"
                disabled={is_generating}
              >
                <option value="">Select a model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.is_default && "(Recommended)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Settings */}
            <div className="glass dark:glass-dark rounded-2xl p-6 shadow-macos">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Voice Settings
                </h3>
                <button
                  onClick={() => set_show_voice_settings(!show_voice_settings)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {selected_model && (
                <VoiceSelectionPanel
                  voices={selected_model.voices || []}
                  selected_voice={selected_voice}
                  custom_voice_id={custom_voice_id}
                  on_voice_select={set_selected_voice}
                  on_clone_voice={() => set_show_cloning_panel(true)}
                  expanded={show_voice_settings}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <DocumentToAudio on_tokens_update={refresh_mp} />
      )}

      {/* Voice Cloning Panel */}
      {show_cloning_panel && (
        <VoiceCloningPanel
          on_close={() => set_show_cloning_panel(false)}
          on_voice_cloned={handle_voice_clone}
        />
      )}
    </div>
  );
}
