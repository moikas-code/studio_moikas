'use client'

import React from 'react'
import { Info } from 'lucide-react'
import { SANA_STYLE_OPTIONS } from '../../utils/constants'

interface SanaAdvancedOptionsProps {
  num_inference_steps: number
  guidance_scale: number
  style_name: string
  seed: number | undefined
  on_steps_change: (steps: number) => void
  on_scale_change: (scale: number) => void
  on_style_change: (style: string) => void
  on_seed_change: (seed: number | undefined) => void
}

export function SanaAdvancedOptions({
  num_inference_steps,
  guidance_scale,
  style_name,
  seed,
  on_steps_change,
  on_scale_change,
  on_style_change,
  on_seed_change
}: SanaAdvancedOptionsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-base-300">
      <h4 className="text-sm font-medium flex items-center gap-2">
        Advanced Options
        <Info className="w-4 h-4 text-base-content/50" />
      </h4>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Inference Steps</span>
          <span className="label-text-alt">{num_inference_steps}</span>
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={num_inference_steps}
          onChange={(e) => on_steps_change(parseInt(e.target.value))}
          className="range range-sm"
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Guidance Scale</span>
          <span className="label-text-alt">{guidance_scale.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={guidance_scale}
          onChange={(e) => on_scale_change(parseFloat(e.target.value))}
          className="range range-sm"
        />
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Style Preset</span>
        </label>
        <select
          value={style_name}
          onChange={(e) => on_style_change(e.target.value)}
          className="select select-bordered select-sm w-full"
        >
          {SANA_STYLE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Seed (optional)</span>
        </label>
        <input
          type="number"
          placeholder="Random"
          value={seed || ''}
          onChange={(e) => {
            const val = e.target.value
            on_seed_change(val ? parseInt(val) : undefined)
          }}
          className="input input-bordered input-sm w-full"
          min="0"
          max="2147483647"
        />
      </div>
    </div>
  )
}