'use client'

import React from 'react'

interface BackgroundPanelProps {
  background_type: 'none' | 'color' | 'gradient'
  background_color: string
  gradient_start: string
  gradient_end: string
  gradient_direction: string
  user_background_colors: string[]
  on_background_type_change: (type: 'none' | 'color' | 'gradient') => void
  on_background_color_change: (color: string) => void
  on_gradient_start_change: (color: string) => void
  on_gradient_end_change: (color: string) => void
  on_gradient_direction_change: (direction: string) => void
  on_add_user_color: (color: string) => void
  on_close: () => void
}

export function BackgroundPanel({
  background_type,
  background_color,
  gradient_start,
  gradient_end,
  gradient_direction,
  user_background_colors,
  on_background_type_change,
  on_background_color_change,
  on_gradient_start_change,
  on_gradient_end_change,
  on_gradient_direction_change,
  on_add_user_color,
  on_close
}: BackgroundPanelProps) {
  return (
    <div className="absolute top-16 right-4 w-80 bg-base-200 rounded-lg shadow-xl p-4 z-20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Background</h3>
        <button onClick={on_close} className="btn btn-sm btn-ghost">×</button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Background Type</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={background_type}
            onChange={(e) => on_background_type_change(e.target.value as 'none' | 'color' | 'gradient')}
          >
            <option value="none">None</option>
            <option value="color">Solid Color</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        
        {/* Additional controls based on background_type */}
        {background_type === 'color' && (
          <div>
            <label className="label">
              <span className="label-text">Background Color</span>
            </label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={background_color}
                onChange={(e) => on_background_color_change(e.target.value)}
                className="w-full h-10"
              />
              <button 
                onClick={() => on_add_user_color(background_color)}
                className="btn btn-sm btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        )}
        
        {background_type === 'gradient' && (
          <>
            <div>
              <label className="label">
                <span className="label-text">Start Color</span>
              </label>
              <input 
                type="color" 
                value={gradient_start}
                onChange={(e) => on_gradient_start_change(e.target.value)}
                className="w-full h-10"
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">End Color</span>
              </label>
              <input 
                type="color" 
                value={gradient_end}
                onChange={(e) => on_gradient_end_change(e.target.value)}
                className="w-full h-10"
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Direction</span>
              </label>
              <select 
                className="select select-bordered w-full"
                value={gradient_direction}
                onChange={(e) => on_gradient_direction_change(e.target.value)}
              >
                <option value="to bottom">Top to Bottom</option>
                <option value="to right">Left to Right</option>
                <option value="to bottom right">Diagonal</option>
                <option value="radial">Radial</option>
              </select>
            </div>
          </>
        )}
        
        {user_background_colors.length > 0 && (
          <div>
            <label className="label">
              <span className="label-text">Saved Colors</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {user_background_colors.map((color, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded border-2 border-base-300"
                  style={{ backgroundColor: color }}
                  onClick={() => on_background_color_change(color)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}