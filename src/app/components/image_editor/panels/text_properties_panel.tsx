'use client'

import React from 'react'
import { ChevronUp, ChevronDown, Trash2, Copy } from 'lucide-react'

interface TextElement {
  id: string
  text: string
  x: number
  y: number
  color: string
  size: number
  font: string
  weight: string
  width?: number
  height?: number
  opacity?: number
  shadow?: {
    blur: number
    color: string
    offset_x: number
    offset_y: number
  }
}

interface TextPropertiesPanelProps {
  text_elements: TextElement[]
  selected_text_id: string | null
  text_input: string
  text_color: string
  text_size: number
  text_font: string
  text_weight: string
  text_opacity: number
  text_shadow: {
    blur: number
    color: string
    offset_x: number
    offset_y: number
  }
  on_text_input_change: (value: string) => void
  on_text_color_change: (value: string) => void
  on_text_size_change: (value: number) => void
  on_text_font_change: (value: string) => void
  on_text_weight_change: (value: string) => void
  on_text_opacity_change: (value: number) => void
  on_text_shadow_change: (shadow: any) => void
  on_update_text: () => void
  on_delete_text: () => void
  on_duplicate_text: () => void
  on_move_layer_up: () => void
  on_move_layer_down: () => void
  on_bring_to_front: () => void
  on_send_to_back: () => void
  on_close: () => void
}

export function TextPropertiesPanel({
  text_elements,
  selected_text_id,
  text_input,
  text_color,
  text_size,
  text_font,
  text_weight,
  text_opacity,
  text_shadow,
  on_text_input_change,
  on_text_color_change,
  on_text_size_change,
  on_text_font_change,
  on_text_weight_change,
  on_text_opacity_change,
  on_text_shadow_change,
  on_update_text,
  on_delete_text,
  on_duplicate_text,
  on_move_layer_up,
  on_move_layer_down,
  on_bring_to_front,
  on_send_to_back,
  on_close
}: TextPropertiesPanelProps) {
  const selected_element = text_elements.find(t => t.id === selected_text_id)
  
  if (!selected_element) return null
  
  return (
    <div className="absolute top-16 right-4 w-80 bg-base-200 rounded-lg shadow-xl p-4 z-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Text Properties</h3>
        <button onClick={on_close} className="btn btn-sm btn-ghost">×</button>
      </div>
      
      {/* Text input and controls will go here */}
      {/* This is a placeholder - actual implementation would include all the form controls */}
    </div>
  )
}