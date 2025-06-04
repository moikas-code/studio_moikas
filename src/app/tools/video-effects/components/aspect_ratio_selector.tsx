'use client'

import React from 'react'
import { ASPECT_OPTIONS } from '../utils/video-constants'

interface AspectRatioSelectorProps {
  value: number
  on_change: (value: number) => void
}

export function AspectRatioSelector({ 
  value, 
  on_change 
}: AspectRatioSelectorProps) {
  const current_option = ASPECT_OPTIONS.find(opt => opt.slider_value === value)
  
  const get_preview_size = (aspect: string) => {
    switch (aspect) {
      case '16:9':
        return { width: 64, height: 36 }
      case '1:1':
        return { width: 48, height: 48 }
      case '9:16':
        return { width: 36, height: 64 }
      default:
        return { width: 48, height: 48 }
    }
  }
  
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Aspect Ratio</span>
        <span className="label-text-alt">{current_option?.label}</span>
      </label>
      
      <div className="flex items-center justify-center mb-4 py-4">
        <div className="relative">
          {ASPECT_OPTIONS.map((option) => {
            const size = get_preview_size(option.value)
            const is_active = option.slider_value === value
            
            return (
              <div
                key={option.value}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 
                           -translate-y-1/2 border-2 rounded transition-all
                           ${is_active 
                             ? 'border-primary bg-primary/10 scale-110' 
                             : 'border-base-300 bg-base-200 scale-90 opacity-50'}`}
                style={{ 
                  width: `${size.width}px`, 
                  height: `${size.height}px`,
                  display: is_active ? 'block' : 'none'
                }}
              />
            )
          })}
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={value}
          onChange={(e) => on_change(parseInt(e.target.value))}
          className="range range-primary"
        />
        <div className="flex justify-between text-xs px-2 mt-1">
          {ASPECT_OPTIONS.map((option) => (
            <span 
              key={option.value}
              className={value === option.slider_value ? 'text-primary' : ''}
            >
              {option.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}