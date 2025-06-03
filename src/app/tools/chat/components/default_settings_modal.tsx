'use client';

import React, { useState, useEffect } from 'react';
import { default_chat_settings } from '../types';

interface DefaultSettingsModalProps {
  is_open: boolean;
  current_settings: default_chat_settings | null;
  loading: boolean;
  on_close: () => void;
  on_save: (settings: Partial<default_chat_settings>) => Promise<void>;
  on_reset: () => Promise<void>;
}

const RESPONSE_STYLES = [
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
  { value: 'concise', label: 'Concise' }
];

const MODEL_OPTIONS = [
  { value: 'grok-3-mini-latest', label: 'Grok 3 Mini Latest' }
];

function DefaultSettingsModal({
  is_open,
  current_settings,
  loading,
  on_close,
  on_save,
  on_reset
}: DefaultSettingsModalProps) {
  const [form_data, set_form_data] = useState<Partial<default_chat_settings>>({});
  const [saving, set_saving] = useState(false);
  const [resetting, set_resetting] = useState(false);

  // Initialize form data when modal opens or settings change
  useEffect(() => {
    if (current_settings) {
      set_form_data({
        system_prompt: current_settings.system_prompt,
        response_style: current_settings.response_style,
        temperature: current_settings.temperature,
        max_tokens: current_settings.max_tokens,
        context_window: current_settings.context_window,
        enable_memory: current_settings.enable_memory,
        enable_web_search: current_settings.enable_web_search,
        enable_code_execution: current_settings.enable_code_execution,
        custom_instructions: current_settings.custom_instructions || '',
        model_preference: current_settings.model_preference
      });
    }
  }, [current_settings]);

  const handle_save = async () => {
    set_saving(true);
    try {
      await on_save(form_data);
      on_close();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      set_saving(false);
    }
  };

  const handle_reset = async () => {
    set_resetting(true);
    try {
      await on_reset();
      on_close();
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      set_resetting(false);
    }
  };

  const update_field = (field: keyof default_chat_settings, value: any) => {
    set_form_data(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!is_open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-base-300">
          <h2 className="text-xl font-semibold text-base-content">
            Default Chat Settings
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Customize your default chat behavior when no specific workflow is selected
          </p>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <span className="loading loading-spinner loading-md"></span>
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* System Prompt */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">System Prompt</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 resize-none"
                placeholder="You are a helpful AI assistant..."
                value={form_data.system_prompt || ''}
                onChange={(e) => update_field('system_prompt', e.target.value)}
                maxLength={2000}
              />
              <label className="label">
                <span className="label-text-alt">
                  {(form_data.system_prompt || '').length}/2000 characters
                </span>
              </label>
            </div>

            {/* Response Style */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Response Style</span>
              </label>
              <select
                className="select select-bordered"
                value={form_data.response_style || 'conversational'}
                onChange={(e) => update_field('response_style', e.target.value)}
              >
                {RESPONSE_STYLES.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Preference */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Model Preference</span>
              </label>
              <select
                className="select select-bordered"
                value={form_data.model_preference || 'grok-3-mini-latest'}
                onChange={(e) => update_field('model_preference', e.target.value)}
              >
                {MODEL_OPTIONS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Temperature</span>
                  <span className="label-text-alt">{form_data.temperature || 0.7}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="range range-primary"
                  value={form_data.temperature || 0.7}
                  onChange={(e) => update_field('temperature', parseFloat(e.target.value))}
                />
                <div className="w-full flex justify-between text-xs px-2">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Max Tokens</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={form_data.max_tokens || 2048}
                  onChange={(e) => update_field('max_tokens', parseInt(e.target.value))}
                  min={1}
                  max={4096}
                />
              </div>

              {/* Context Window */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Context Window</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={form_data.context_window || 20}
                  onChange={(e) => update_field('context_window', parseInt(e.target.value))}
                  min={1}
                  max={50}
                />
                <label className="label">
                  <span className="label-text-alt">Number of previous messages to remember</span>
                </label>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h3 className="font-medium text-base-content">Features</h3>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form_data.enable_memory ?? true}
                    onChange={(e) => update_field('enable_memory', e.target.checked)}
                  />
                  <span className="label-text ml-3">
                    <strong>Memory</strong> - Remember conversation context across sessions
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form_data.enable_web_search ?? false}
                    onChange={(e) => update_field('enable_web_search', e.target.checked)}
                  />
                  <span className="label-text ml-3">
                    <strong>Web Search</strong> - Allow searching the internet for current information
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form_data.enable_code_execution ?? false}
                    onChange={(e) => update_field('enable_code_execution', e.target.checked)}
                  />
                  <span className="label-text ml-3">
                    <strong>Code Execution</strong> - Allow running code to solve problems
                  </span>
                </label>
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Custom Instructions</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-20 resize-none"
                placeholder="Additional instructions for the AI (optional)..."
                value={form_data.custom_instructions || ''}
                onChange={(e) => update_field('custom_instructions', e.target.value)}
                maxLength={1000}
              />
              <label className="label">
                <span className="label-text-alt">
                  {(form_data.custom_instructions || '').length}/1000 characters
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-6 border-t border-base-300 flex flex-col sm:flex-row gap-3 justify-between">
          <button
            className="btn btn-outline btn-warning"
            onClick={handle_reset}
            disabled={saving || resetting || loading}
          >
            {resetting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Resetting...
              </>
            ) : (
              'Reset to Defaults'
            )}
          </button>

          <div className="flex gap-3">
            <button
              className="btn btn-ghost"
              onClick={on_close}
              disabled={saving || resetting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handle_save}
              disabled={saving || resetting || loading}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DefaultSettingsModal;