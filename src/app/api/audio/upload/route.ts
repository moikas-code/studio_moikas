import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { track } from '@vercel/analytics/server'
import { fal } from '@fal-ai/client'

// Configure fal client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  })
}

export const runtime = 'nodejs' // Ensure this runs in Node.js, not Edge

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DURATION_SECONDS = 8 // Maximum audio duration for voice cloning
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

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if FAL_KEY is configured
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: 'Voice cloning is not configured. FAL_KEY is missing.' },
        { status: 503 }
      )
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

    try {
      // Upload file to Fal storage
      const url = await fal.storage.upload(file)

      // Track successful upload
      track('voice_clone_uploaded', {
        userId,
        fileSize: file.size,
        fileType: file.type
      })

      return NextResponse.json({
        success: true,
        url,
        message: `Audio uploaded successfully. Please ensure it's ${MAX_DURATION_SECONDS} seconds or less for optimal voice cloning.`
      })

    } catch (upload_error) {
      console.error('Fal storage upload error:', upload_error)
      return NextResponse.json(
        { error: 'Failed to upload audio file. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}