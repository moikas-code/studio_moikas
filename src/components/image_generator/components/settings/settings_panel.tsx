'use client'

import React from 'react'
import { Settings, X } from 'lucide-react'
import { AspectRatioControl } from './aspect_ratio_control'
import { ModelSelector } from './model_selector'
import { SanaAdvancedOptions } from './sana_advanced_options'
import EmbeddingsSelector from './embeddings_selector'
import type { ModelOption, AspectPreset, EmbeddingInput, LoraWeight } from '../../types'

interface SettingsPanelProps {
  is_open: boolean
  on_close: () => void
  // Model settings
  models: ModelOption[]
  selected_model_id: string
  on_model_change: (id: string) => void
  user_mp: number
  // Aspect ratio
  aspect_presets: AspectPreset[]
  aspect_index: number
  on_aspect_change: (index: number) => void
  get_aspect_label: (index: number) => string
  // SANA settings
  show_sana_options: boolean
  sana_settings: {
    num_inference_steps: number
    guidance_scale: number
    style_name: string
    seed: number | undefined
  }
  on_sana_change: {
    steps: (n: number) => void
    scale: (n: number) => void
    style: (s: string) => void
    seed: (n: number | undefined) => void
  }
  // Embeddings & LoRAs
  selected_embeddings: EmbeddingInput[]
  selected_loras: LoraWeight[]
  on_embeddings_change: (embeddings: EmbeddingInput[]) => void
  on_loras_change: (loras: LoraWeight[]) => void
}

export function SettingsPanel({
  is_open,
  on_close,
  models,
  selected_model_id,
  on_model_change,
  user_mp,
  aspect_presets,
  aspect_index,
  on_aspect_change,
  get_aspect_label,
  show_sana_options,
  sana_settings,
  on_sana_change,
  selected_embeddings,
  selected_loras,
  on_embeddings_change,
  on_loras_change
}: SettingsPanelProps) {
  if (!is_open) return null

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-base-200 
                    shadow-xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-base-200 p-4 border-b border-base-300
                      flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 z-50">
          <Settings className="w-5 h-5" />
          Generation Settings
        </h3>
        <button onClick={on_close} className="btn btn-ghost btn-sm btn-circle">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <AspectRatioControl
          presets={aspect_presets}
          current_index={aspect_index}
          on_select={on_aspect_change}
          get_label={get_aspect_label}
        />

        <ModelSelector
          models={models}
          selected_model_id={selected_model_id}
          on_select={on_model_change}
          user_mp={user_mp}
        />

        {show_sana_options && (
          <SanaAdvancedOptions
            {...sana_settings}
            on_steps_change={on_sana_change.steps}
            on_scale_change={on_sana_change.scale}
            on_style_change={on_sana_change.style}
            on_seed_change={on_sana_change.seed}
          />
        )}

        <EmbeddingsSelector
          modelId={selected_model_id}
          selectedEmbeddings={selected_embeddings}
          selectedLoras={selected_loras}
          onEmbeddingsChange={on_embeddings_change}
          onLorasChange={on_loras_change}
        />
      </div>
    </div>
  )
}