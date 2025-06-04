import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { track } from '@vercel/analytics/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/m4a'
]

// Since fal.ai doesn't support base64 URLs, we need to provide a temporary upload solution
// In production, you would use a temporary file hosting service like:
// - Cloudflare R2 with temporary URLs
// - AWS S3 with pre-signed URLs
// - Google Cloud Storage with temporary access
// For now, we'll return an error message explaining this limitation

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('audio') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      )
    }

    // Track the attempt
    track('voice_clone_attempted', {
      userId,
      fileSize: file.size,
      fileType: file.type
    })

    // For now, return an informative error
    // In production, implement temporary file hosting here
    return NextResponse.json({
      error: 'Voice cloning requires a temporary file hosting service. Please use the pre-defined voices for now.',
      suggestion: 'To enable voice cloning, configure a temporary file hosting service (e.g., Cloudflare R2, AWS S3) in production.'
    }, { status: 501 })

  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}