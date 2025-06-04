'use client'

import React, { useState } from 'react'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'

interface Layer {
  id: string
  type: 'text' | 'image' | 'background'
  name: string
  visible: boolean
  locked: boolean
}

interface LayersPanelProps {
  layers: Layer[]
  selected_layer_id: string | null
  on_layer_select: (id: string) => void
  on_layer_visibility_toggle: (id: string) => void
  on_layer_lock_toggle: (id: string) => void
  on_layer_delete: (id: string) => void
  on_layer_reorder: (from_index: number, to_index: number) => void
  on_close: () => void
}

export function LayersPanel({
  layers,
  selected_layer_id,
  on_layer_select,
  on_layer_visibility_toggle,
  on_layer_lock_toggle,
  on_layer_delete,
  on_layer_reorder,
  on_close
}: LayersPanelProps) {
  const [drag_index, set_drag_index] = useState<number | null>(null)
  
  const handle_drag_start = (index: number) => {
    set_drag_index(index)
  }
  
  const handle_drag_over = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handle_drop = (drop_index: number) => {
    if (drag_index !== null && drag_index !== drop_index) {
      on_layer_reorder(drag_index, drop_index)
    }
    set_drag_index(null)
  }
  
  return (
    <div className="absolute top-16 right-4 w-80 bg-base-200 rounded-lg shadow-xl p-4 z-20 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Layers</h3>
        <button onClick={on_close} className="btn btn-sm btn-ghost">×</button>
      </div>
      
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={() => handle_drag_start(index)}
            onDragOver={handle_drag_over}
            onDrop={() => handle_drop(index)}
            className={`
              flex items-center p-2 rounded cursor-pointer
              ${selected_layer_id === layer.id ? 'bg-primary/20' : 'hover:bg-base-300'}
              ${drag_index === index ? 'opacity-50' : ''}
            `}
            onClick={() => on_layer_select(layer.id)}
          >
            <GripVertical className="w-4 h-4 mr-2 text-base-content/50" />
            <span className="flex-1">{layer.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                on_layer_visibility_toggle(layer.id)
              }}
              className="btn btn-ghost btn-xs"
            >
              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                on_layer_delete(layer.id)
              }}
              className="btn btn-ghost btn-xs text-error"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}