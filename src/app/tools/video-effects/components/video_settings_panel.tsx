'use client'

import React from 'react'
import { AspectRatioSelector } from './aspect_ratio_selector'
import { FaClock } from 'react-icons/fa'
import CostDisplay from '@/components/CostDisplay'

interface VideoSettingsPanelProps {
  is_open: boolean
  aspect_slider: number
  duration: number
  on_aspect_change: (value: number) => void
  on_duration_change: (value: number) => void
  model_cost: number
}

export function VideoSettingsPanel({
  is_open,
  aspect_slider,
  duration,
  on_aspect_change,
  on_duration_change,
  model_cost
}: VideoSettingsPanelProps) {
  if (!is_open) return null
  
  const total_cost = model_cost * duration
  
  return (
    <div className={`mt-6 overflow-hidden transition-all duration-500 
                     ${is_open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="bg-base-100 rounded-xl p-6 shadow-lg space-y-6">
        <AspectRatioSelector
          value={aspect_slider}
          on_change={on_aspect_change}
        />
        
        <div className="form-control">
          <label className="label">
            <span className="label-text flex items-center gap-2">
              <FaClock className="w-4 h-4" />
              Duration
            </span>
            <span className="label-text-alt">{duration} seconds</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={duration}
            onChange={(e) => on_duration_change(parseInt(e.target.value))}
            className="range range-primary"
          />
          <div className="flex justify-between text-xs px-2 mt-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i + 1}>{i + 1}s</span>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-base-300">
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">
              Estimated Cost:
            </span>
            <CostDisplay cost={total_cost} />
          </div>
        </div>
      </div>
    </div>
  )
}