import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@/lib/fal_client'
import { require_auth } from '@/lib/utils/api/auth'
import { api_success, handle_api_error } from '@/lib/utils/api/response'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await require_auth()
    
    // Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    if (!file.name.endsWith('.safetensors')) {
      return NextResponse.json(
        { error: 'Only .safetensors files are allowed' },
        { status: 400 }
      )
    }
    
    // Validate file size (512MB limit)
    const maxSize = 512 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 512MB' },
        { status: 400 }
      )
    }
    
    try {
      // Upload to fal.ai storage
      console.log('[Embeddings Upload] Uploading file:', file.name, 'Size:', file.size)
      const url = await fal.storage.upload(file)
      console.log('[Embeddings Upload] File uploaded successfully:', url)
      
      return api_success({ url })
    } catch (uploadError) {
      console.error('[Embeddings Upload] Upload failed:', uploadError)
      throw new Error('Failed to upload file to storage')
    }
    
  } catch (error) {
    return handle_api_error(error)
  }
}