import { describe, test, expect, beforeEach } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useFileUpload } from '../hooks/use_file_upload'

describe('useFileUpload hook', () => {
  let mock_file: File
  
  beforeEach(() => {
    mock_file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
  })
  
  test('initializes with default values', () => {
    const { result } = renderHook(() => useFileUpload())
    
    expect(result.current.image_file).toBeNull()
    expect(result.current.upload_error).toBe('')
  })
  
  test('accepts valid image file', async () => {
    const { result } = renderHook(() => useFileUpload())
    
    let base64_result: string | null = null
    await act(async () => {
      base64_result = await result.current.handle_file_select(mock_file)
    })
    
    expect(result.current.image_file).toBe(mock_file)
    expect(result.current.upload_error).toBe('')
    expect(base64_result).toContain('data:image/jpeg;base64,')
  })
  
  test('rejects non-image file', async () => {
    const { result } = renderHook(() => useFileUpload())
    const text_file = new File(['text'], 'test.txt', { type: 'text/plain' })
    
    let base64_result: string | null = null
    await act(async () => {
      base64_result = await result.current.handle_file_select(text_file)
    })
    
    expect(result.current.image_file).toBeNull()
    expect(result.current.upload_error).toBe('Please select an image file')
    expect(base64_result).toBeNull()
  })
  
  test('rejects oversized file', async () => {
    const { result } = renderHook(() => useFileUpload())
    // Create a mock large file
    const large_content = new Array(11 * 1024 * 1024).fill('x').join('')
    const large_file = new File([large_content], 'large.jpg', { type: 'image/jpeg' })
    
    let base64_result: string | null = null
    await act(async () => {
      base64_result = await result.current.handle_file_select(large_file)
    })
    
    expect(result.current.image_file).toBeNull()
    expect(result.current.upload_error).toBe('Image must be less than 10MB')
    expect(base64_result).toBeNull()
  })
  
  test('clear_file resets state', async () => {
    const { result } = renderHook(() => useFileUpload())
    
    // First upload a file
    await act(async () => {
      await result.current.handle_file_select(mock_file)
    })
    
    expect(result.current.image_file).toBe(mock_file)
    
    // Then clear it
    act(() => {
      result.current.clear_file()
    })
    
    expect(result.current.image_file).toBeNull()
    expect(result.current.upload_error).toBe('')
  })
})