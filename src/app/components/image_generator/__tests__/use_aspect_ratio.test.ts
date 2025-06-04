import { describe, test, expect } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useAspectRatio } from '../hooks/use_aspect_ratio'

describe('useAspectRatio hook', () => {
  test('initializes with default values', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    expect(result.current.aspect_index).toBe(0)
    expect(result.current.current_preset.name).toBe('1:1')
    expect(result.current.aspect_presets.length).toBeGreaterThan(0)
  })
  
  test('set_aspect_preset updates the index', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    act(() => {
      result.current.set_aspect_preset(2)
    })
    
    expect(result.current.aspect_index).toBe(2)
    expect(result.current.current_preset.name).toBe('9:16')
  })
  
  test('set_aspect_preset ignores invalid indices', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    act(() => {
      result.current.set_aspect_preset(-1)
    })
    expect(result.current.aspect_index).toBe(0)
    
    act(() => {
      result.current.set_aspect_preset(999)
    })
    expect(result.current.aspect_index).toBe(0)
  })
  
  test('get_aspect_label returns correct label', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    const label = result.current.get_aspect_label(0)
    expect(label).toBe('1:1 Square')
  })
  
  test('find_preset_index finds correct preset', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    expect(result.current.find_preset_index('16:9')).toBe(1)
    expect(result.current.find_preset_index('9:16')).toBe(2)
    expect(result.current.find_preset_index('invalid')).toBe(-1)
  })
  
  test('get_dimensions returns current dimensions', () => {
    const { result } = renderHook(() => useAspectRatio())
    
    const dims = result.current.get_dimensions()
    expect(dims.width).toBe(1024)
    expect(dims.height).toBe(1024)
    
    act(() => {
      result.current.set_aspect_preset(1) // 16:9
    })
    
    const new_dims = result.current.get_dimensions()
    expect(new_dims.width).toBe(1920)
    expect(new_dims.height).toBe(1080)
  })
})