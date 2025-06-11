import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@/lib/fal_client'
import { require_auth } from '@/lib/utils/api/auth'
import { api_success, handle_api_error } from '@/lib/utils/api/response'

// Configure the route to handle larger payloads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout for large uploads

// Next.js 13+ API route config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '512mb',
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await require_auth()
    
    // Check content length header first
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength)
      const maxSize = 512 * 1024 * 1024 // 512MB
      
      if (sizeInBytes > maxSize) {
        return NextResponse.json(
          { error: `File too large. Maximum size is 512MB, received ${Math.round(sizeInBytes / 1024 / 1024)}MB` },
          { status: 413 }
        )
      }
    }
    
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