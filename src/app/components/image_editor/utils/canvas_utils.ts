/**
 * Canvas utility functions for the image editor
 * Max 60 lines per function
 */

interface Point {
  x: number
  y: number
}

/**
 * Convert viewport coordinates to canvas coordinates
 */
export function viewport_to_canvas(
  viewport_x: number,
  viewport_y: number,
  canvas_rect: DOMRect,
  zoom: number,
  pan_x: number,
  pan_y: number
): Point {
  const canvas_x = (viewport_x - canvas_rect.left - pan_x) / zoom
  const canvas_y = (viewport_y - canvas_rect.top - pan_y) / zoom
  return { x: canvas_x, y: canvas_y }
}

/**
 * Convert canvas coordinates to viewport coordinates
 */
export function canvas_to_viewport(
  canvas_x: number,
  canvas_y: number,
  canvas_rect: DOMRect,
  zoom: number,
  pan_x: number,
  pan_y: number
): Point {
  const viewport_x = canvas_x * zoom + pan_x + canvas_rect.left
  const viewport_y = canvas_y * zoom + pan_y + canvas_rect.top
  return { x: viewport_x, y: viewport_y }
}

/**
 * Check if a point is inside a rectangle
 */
export function is_point_in_rect(
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}