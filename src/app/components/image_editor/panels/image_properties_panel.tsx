'use client'

import React from 'react'
import { Move, RotateCw } from 'lucide-react'

interface ImageTransform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

interface ImagePropertiesPanelProps {
  image_transform: ImageTransform
  original_image_size: { width: number; height: number }
  on_transform_change: (transform: Partial<ImageTransform>) => void
  on_reset_transform: () => void
  on_fit_to_canvas: () => void
  on_close: () => void
}

export function ImagePropertiesPanel({
  image_transform,
  original_image_size,
  on_transform_change,
  on_reset_transform,
  on_fit_to_canvas,
  on_close
}: ImagePropertiesPanelProps) {
  const handle_position_change = (axis: 'x' | 'y', value: string) => {
    const num_value = parseInt(value) || 0
    on_transform_change({ [axis]: num_value })
  }
  
  const handle_size_change = (dimension: 'width' | 'height', value: string) => {
    const num_value = parseInt(value) || 100
    const aspect_ratio = original_image_size.width / original_image_size.height
    
    if (dimension === 'width') {
      on_transform_change({ 
        width: num_value,
        height: Math.round(num_value / aspect_ratio)
      })
    } else {
      on_transform_change({ 
        height: num_value,
        width: Math.round(num_value * aspect_ratio)
      })
    }
  }
  
  return (
    <div className="absolute top-16 right-4 w-80 bg-base-200 rounded-lg shadow-xl p-4 z-20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Image Properties</h3>
        <button onClick={on_close} className="btn btn-sm btn-ghost">×</button>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={on_reset_transform} className="btn btn-sm">
            Reset Transform
          </button>
          <button onClick={on_fit_to_canvas} className="btn btn-sm">
            Fit to Canvas
          </button>
        </div>
        
        {/* Position and size controls */}
      </div>
    </div>
  )
}