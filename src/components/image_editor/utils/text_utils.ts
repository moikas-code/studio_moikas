/**
 * Text rendering utilities
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

/**
 * Draw text element on canvas
 */
export function draw_text_element(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  is_selected: boolean = false
): void {
  ctx.save()
  
  // Set text properties
  ctx.font = `${element.weight || 'normal'} ${element.size}px ${element.font}`
  ctx.fillStyle = element.color
  ctx.textBaseline = 'top'
  
  // Apply opacity if set
  if (element.opacity !== undefined) {
    ctx.globalAlpha = element.opacity / 100
  }
  
  // Apply shadow if set
  if (element.shadow) {
    ctx.shadowBlur = element.shadow.blur
    ctx.shadowColor = element.shadow.color
    ctx.shadowOffsetX = element.shadow.offset_x
    ctx.shadowOffsetY = element.shadow.offset_y
  }
  
  // Draw text
  ctx.fillText(element.text, element.x, element.y)
  
  // Draw selection border if selected
  if (is_selected && element.width && element.height) {
    ctx.strokeStyle = '#0066ff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10)
  }
  
  ctx.restore()
}