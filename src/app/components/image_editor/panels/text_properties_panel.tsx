'use client'

import React from 'react'

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
  on_text_shadow_change: (shadow: {
    blur: number
    color: string
    offset_x: number
    offset_y: number
  }) => void
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
      
      <div className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Text</span>
          </label>
          <textarea 
            className="textarea textarea-bordered w-full"
            rows={3}
            value={text_input}
            onChange={(e) => on_text_input_change(e.target.value)}
            placeholder="Enter text..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">
              <span className="label-text">Color</span>
            </label>
            <input 
              type="color" 
              className="w-full h-10 cursor-pointer"
              value={text_color}
              onChange={(e) => on_text_color_change(e.target.value)}
            />
          </div>
          
          <div>
            <label className="label">
              <span className="label-text">Size</span>
            </label>
            <input 
              type="number" 
              className="input input-sm input-bordered w-full"
              value={text_size}
              onChange={(e) => on_text_size_change(parseInt(e.target.value) || 16)}
              min="8"
              max="200"
            />
          </div>
        </div>
        
        <div>
          <label className="label">
            <span className="label-text">Font</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={text_font}
            onChange={(e) => on_text_font_change(e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        
        <div>
          <label className="label">
            <span className="label-text">Weight</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={text_weight}
            onChange={(e) => on_text_weight_change(e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="lighter">Light</option>
          </select>
        </div>
        
        <div>
          <label className="label">
            <span className="label-text">Opacity ({text_opacity}%)</span>
          </label>
          <input 
            type="range" 
            className="range range-sm"
            value={text_opacity}
            onChange={(e) => on_text_opacity_change(parseInt(e.target.value))}
            min="0"
            max="100"
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Shadow</h4>
          <div className="space-y-2">
            <div>
              <label className="label text-xs">
                <span className="label-text">Blur</span>
              </label>
              <input 
                type="range" 
                className="range range-xs"
                value={text_shadow.blur}
                onChange={(e) => on_text_shadow_change({ ...text_shadow, blur: parseInt(e.target.value) })}
                min="0"
                max="20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label text-xs">
                  <span className="label-text">Offset X</span>
                </label>
                <input 
                  type="number" 
                  className="input input-xs input-bordered w-full"
                  value={text_shadow.offset_x}
                  onChange={(e) => on_text_shadow_change({ ...text_shadow, offset_x: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label text-xs">
                  <span className="label-text">Offset Y</span>
                </label>
                <input 
                  type="number" 
                  className="input input-xs input-bordered w-full"
                  value={text_shadow.offset_y}
                  onChange={(e) => on_text_shadow_change({ ...text_shadow, offset_y: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="label text-xs">
                <span className="label-text">Shadow Color</span>
              </label>
              <input 
                type="color" 
                className="w-full h-8"
                value={text_shadow.color}
                onChange={(e) => on_text_shadow_change({ ...text_shadow, color: e.target.value })}
              />
            </div>
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="space-y-2">
          <button onClick={on_update_text} className="btn btn-sm btn-primary w-full">
            Update Text
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={on_duplicate_text} className="btn btn-sm">
              Duplicate
            </button>
            <button onClick={on_delete_text} className="btn btn-sm btn-error">
              Delete
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={on_move_layer_up} className="btn btn-sm">
              Move Up
            </button>
            <button onClick={on_move_layer_down} className="btn btn-sm">
              Move Down
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={on_bring_to_front} className="btn btn-sm">
              To Front
            </button>
            <button onClick={on_send_to_back} className="btn btn-sm">
              To Back
            </button>
          </div>
        </div>
        
        <div className="text-xs text-base-content/60">
          Selected: {selected_element.text.substring(0, 20)}{selected_element.text.length > 20 ? '...' : ''}
        </div>
      </div>
    </div>
  )
}