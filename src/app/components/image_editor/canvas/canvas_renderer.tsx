'use client'

import React, { useEffect, useRef } from 'react'
import { draw_grid } from '../utils/draw_utils'
import { draw_text_element } from '../utils/text_utils'

interface CanvasState {
  image_base64: string | null
  background_base64: string | null
  text_elements: any[]
  canvas_width: number
  canvas_height: number
  zoom: number
  pan_x: number
  pan_y: number
  image_transform: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }
  show_grid: boolean
}

interface CanvasRendererProps {
  canvas_state: CanvasState
  selected_text_id: string | null
  is_image_selected: boolean
  viewport_width: number
  viewport_height: number
}

export function CanvasRenderer({
  canvas_state,
  selected_text_id,
  is_image_selected,
  viewport_width,
  viewport_height
}: CanvasRendererProps) {
  const canvas_ref = useRef<HTMLCanvasElement>(null)
  const image_cache = useRef<{ [key: string]: HTMLImageElement }>({})
  
  useEffect(() => {
    const canvas = canvas_ref.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, viewport_width, viewport_height)
    
    // Apply zoom and pan
    ctx.save()
    ctx.translate(canvas_state.pan_x, canvas_state.pan_y)
    ctx.scale(canvas_state.zoom, canvas_state.zoom)
    
    // Draw background
    if (canvas_state.background_base64) {
      // Background drawing logic here
    }
    
    // Draw image
    if (canvas_state.image_base64) {
      // Image drawing logic here
    }
    
    // Draw text elements
    canvas_state.text_elements.forEach(element => {
      draw_text_element(ctx, element, element.id === selected_text_id)
    })
    
    // Draw grid if enabled
    if (canvas_state.show_grid) {
      draw_grid({
        ctx,
        width: viewport_width,
        height: viewport_height,
        grid_size: 50,
        zoom: canvas_state.zoom,
        pan_x: canvas_state.pan_x,
        pan_y: canvas_state.pan_y
      })
    }
    
    ctx.restore()
  }, [canvas_state, selected_text_id, viewport_width, viewport_height])
  
  return (
    <canvas
      ref={canvas_ref}
      width={viewport_width}
      height={viewport_height}
      className="absolute top-0 left-0"
    />
  )
}