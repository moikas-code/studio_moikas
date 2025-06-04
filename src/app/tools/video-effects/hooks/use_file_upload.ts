import { useState, useCallback } from 'react'

export function useFileUpload() {
  const [image_file, set_image_file] = useState<File | null>(null)
  const [upload_error, set_upload_error] = useState<string>('')
  
  const handle_file_select = useCallback(async (file: File): Promise<string | null> => {
    set_upload_error('')
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      set_upload_error('Please select an image file')
      return null
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      set_upload_error('Image must be less than 10MB')
      return null
    }
    
    set_image_file(file)
    
    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        resolve(base64)
      }
      reader.onerror = () => {
        set_upload_error('Failed to read file')
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }, [])
  
  const clear_file = useCallback(() => {
    set_image_file(null)
    set_upload_error('')
  }, [])
  
  return {
    image_file,
    upload_error,
    handle_file_select,
    clear_file
  }
}