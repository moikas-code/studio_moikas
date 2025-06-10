'use client'

import React from 'react'
import type { AspectPreset } from '../../types'

interface AspectRatioControlProps {
  presets: AspectPreset[]
  current_index: number
  on_select: (index: number) => void
  get_label: (index: number) => string
}

export function AspectRatioControl({
  presets,
  current_index,
  on_select,
  get_label
}: AspectRatioControlProps) {
  const current = presets[current_index]
  const preview_size = 50
  
  const get_preview_dimensions = (preset: AspectPreset) => {
    const aspect = preset.width / preset.height
    if (aspect > 1) {
      return { width: preview_size, height: preview_size / aspect }
    } else {
      return { width: preview_size * aspect, height: preview_size }
    }
  }
  
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Aspect Ratio</span>
        <span className="label-text-alt">
          {current.width} × {current.height}
        </span>
      </label>
      
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-16 h-16 bg-base-300 rounded">
          <div
            className="bg-primary/20 border border-primary"
            style={get_preview_dimensions(current)}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{get_label(current_index)}</div>
          <div className="text-xs text-base-content/60">
            {current.width} × {current.height} pixels
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-2">
        {presets.slice(0, 8).map((preset, index) => (
          <button
            key={preset.name}
            onClick={() => on_select(index)}
            className={`btn btn-sm ${
              current_index === index ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>
      
      <input
        type="range"
        min="0"
        max={presets.length - 1}
        value={current_index}
        onChange={(e) => on_select(parseInt(e.target.value))}
        className="range range-primary range-sm"
      />
    </div>
  )
}