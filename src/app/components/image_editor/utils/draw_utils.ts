/**
 * Drawing utilities for canvas rendering
 */

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

interface DrawGridOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  grid_size: number
  zoom: number
  pan_x: number
  pan_y: number
  color?: string
  line_width?: number
}

/**
 * Draw grid overlay on canvas
 */
export function draw_grid({
  ctx,
  width,
  height,
  grid_size,
  zoom,
  pan_x,
  pan_y,
  color = 'rgba(128, 128, 128, 0.3)',
  line_width = 1
}: DrawGridOptions): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = line_width / zoom
  
  const start_x = Math.floor(-pan_x / zoom / grid_size) * grid_size
  const start_y = Math.floor(-pan_y / zoom / grid_size) * grid_size
  const end_x = Math.ceil((width - pan_x) / zoom / grid_size) * grid_size
  const end_y = Math.ceil((height - pan_y) / zoom / grid_size) * grid_size
  
  ctx.beginPath()
  for (let x = start_x; x <= end_x; x += grid_size) {
    ctx.moveTo(x, start_y)
    ctx.lineTo(x, end_y)
  }
  for (let y = start_y; y <= end_y; y += grid_size) {
    ctx.moveTo(start_x, y)
    ctx.lineTo(end_x, y)
  }
  ctx.stroke()
  ctx.restore()
}