/**
 * Mouse event handlers for image editor
 */

import { viewport_to_canvas, is_point_in_rect } from './canvas_utils'

interface TextElement {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  [key: string]: unknown
}

interface ImageTransform {
  x: number
  y: number
  width: number
  height: number
  [key: string]: unknown
}

interface MouseHandlerOptions {
  canvas_rect: DOMRect
  zoom: number
  pan_x: number
  pan_y: number
  active_tool: 'select' | 'text' | 'pan'
  text_elements: TextElement[]
  image_transform: ImageTransform | null
  on_text_select: (id: string | null) => void
  on_image_select: (selected: boolean) => void
  on_text_drag_start: (id: string, offset: { x: number; y: number }) => void
  on_image_drag_start: (offset: { x: number; y: number }) => void
  on_pan_start: (x: number, y: number) => void
}

/**
 * Handle mouse down events on canvas
 */
export function handle_mouse_down(
  e: React.MouseEvent,
  options: MouseHandlerOptions
): void {
  const {
    canvas_rect,
    zoom,
    pan_x,
    pan_y,
    active_tool,
    text_elements,
    image_transform,
    on_text_select,
    on_image_select,
    on_text_drag_start,
    on_image_drag_start,
    on_pan_start
  } = options
  
  const canvas_point = viewport_to_canvas(
    e.clientX,
    e.clientY,
    canvas_rect,
    zoom,
    pan_x,
    pan_y
  )
  
  if (active_tool === 'pan') {
    on_pan_start(e.clientX, e.clientY)
    return
  }
  
  if (active_tool === 'select') {
    // Check text elements first (in reverse order for top-most)
    for (let i = text_elements.length - 1; i >= 0; i--) {
      const element = text_elements[i]
      if (is_point_in_rect(canvas_point, {
        x: element.x,
        y: element.y,
        width: element.width || 100,
        height: element.height || 30
      })) {
        on_text_select(element.id)
        on_text_drag_start(element.id, {
          x: canvas_point.x - element.x,
          y: canvas_point.y - element.y
        })
        return
      }
    }
    
    // Check image
    if (image_transform && is_point_in_rect(canvas_point, image_transform)) {
      on_image_select(true)
      on_image_drag_start({
        x: canvas_point.x - image_transform.x,
        y: canvas_point.y - image_transform.y
      })
      return
    }
    
    // Deselect all
    on_text_select(null)
    on_image_select(false)
  }
}