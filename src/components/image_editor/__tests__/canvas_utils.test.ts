import { describe, test, expect } from 'bun:test'
import { 
  viewport_to_canvas, 
  canvas_to_viewport, 
  is_point_in_rect 
} from '../utils/canvas_utils'

describe('Canvas Utilities', () => {
  const mock_rect: DOMRect = {
    left: 100,
    top: 50,
    width: 800,
    height: 600,
    right: 900,
    bottom: 650,
    x: 100,
    y: 50,
    toJSON: () => ({})
  }
  
  describe('viewport_to_canvas', () => {
    test('converts viewport coordinates to canvas coordinates', () => {
      const result = viewport_to_canvas(
        200, // viewport_x
        150, // viewport_y
        mock_rect,
        1,   // zoom
        0,   // pan_x
        0    // pan_y
      )
      
      expect(result.x).toBe(100) // 200 - 100 (rect.left)
      expect(result.y).toBe(100) // 150 - 50 (rect.top)
    })
    
    test('handles zoom correctly', () => {
      const result = viewport_to_canvas(
        300, 250, mock_rect, 2, 0, 0
      )
      
      expect(result.x).toBe(100) // (300 - 100) / 2
      expect(result.y).toBe(100) // (250 - 50) / 2
    })
    
    test('handles pan correctly', () => {
      const result = viewport_to_canvas(
        200, 150, mock_rect, 1, 10, 20
      )
      
      expect(result.x).toBe(90)  // (200 - 100 - 10) / 1
      expect(result.y).toBe(80)  // (150 - 50 - 20) / 1
    })
  })
  
  describe('canvas_to_viewport', () => {
    test('converts canvas coordinates to viewport coordinates', () => {
      const result = canvas_to_viewport(
        100, 100, mock_rect, 1, 0, 0
      )
      
      expect(result.x).toBe(200) // 100 * 1 + 0 + 100
      expect(result.y).toBe(150) // 100 * 1 + 0 + 50
    })
    
    test('handles zoom in reverse', () => {
      const result = canvas_to_viewport(
        100, 100, mock_rect, 2, 0, 0
      )
      
      expect(result.x).toBe(300) // 100 * 2 + 0 + 100
      expect(result.y).toBe(250) // 100 * 2 + 0 + 50
    })
  })
  
  describe('is_point_in_rect', () => {
    const rect = { x: 10, y: 10, width: 50, height: 30 }
    
    test('returns true for point inside rect', () => {
      expect(is_point_in_rect({ x: 20, y: 20 }, rect)).toBe(true)
      expect(is_point_in_rect({ x: 10, y: 10 }, rect)).toBe(true) // top-left
      expect(is_point_in_rect({ x: 60, y: 40 }, rect)).toBe(true) // bottom-right
    })
    
    test('returns false for point outside rect', () => {
      expect(is_point_in_rect({ x: 5, y: 20 }, rect)).toBe(false)  // left
      expect(is_point_in_rect({ x: 65, y: 20 }, rect)).toBe(false) // right
      expect(is_point_in_rect({ x: 20, y: 5 }, rect)).toBe(false)  // above
      expect(is_point_in_rect({ x: 20, y: 45 }, rect)).toBe(false) // below
    })
  })
})