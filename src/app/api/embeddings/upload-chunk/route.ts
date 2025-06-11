import { NextRequest, NextResponse } from 'next/server'
import { require_auth } from '@/lib/utils/api/auth'
import { api_success, handle_api_error } from '@/lib/utils/api/response'
import { get_redis_client } from '@/lib/utils/database/redis'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await require_auth()
    
    const formData = await request.formData()
    const chunk = formData.get('chunk') as Blob
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)
    const totalChunks = parseInt(formData.get('totalChunks') as string)
    const fileName = formData.get('fileName') as string
    const uploadId = formData.get('uploadId') as string
    
    if (!chunk || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || !uploadId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Store chunk in Redis temporarily
    const redis = get_redis_client()
    if (!redis) {
      return NextResponse.json(
        { error: 'Chunked upload not available' },
        { status: 503 }
      )
    }
    
    const chunkKey = `upload:${user.user_id}:${uploadId}:chunk:${chunkIndex}`
    const chunkData = await chunk.arrayBuffer()
    
    // Store chunk (expire in 1 hour)
    await redis.setex(chunkKey, 3600, Buffer.from(chunkData).toString('base64'))
    
    // Track upload progress
    const progressKey = `upload:${user.user_id}:${uploadId}:progress`
    await redis.sadd(progressKey, chunkIndex.toString())
    await redis.expire(progressKey, 3600)
    
    // Check if all chunks are uploaded
    const uploadedChunks = await redis.scard(progressKey)
    
    if (uploadedChunks === totalChunks) {
      // All chunks uploaded, now combine them
      const chunks: Buffer[] = []
      
      for (let i = 0; i < totalChunks; i++) {
        const chunkKey = `upload:${user.user_id}:${uploadId}:chunk:${i}`
        const chunkData = await redis.get(chunkKey) as string | null
        if (chunkData) {
          chunks.push(Buffer.from(chunkData, 'base64'))
          // Clean up chunk
          await redis.del(chunkKey)
        }
      }
      
      // Clean up progress tracking
      await redis.del(progressKey)
      
      // Combine chunks into file
      const completeFile = Buffer.concat(chunks)
      const file = new File([completeFile], fileName, { type: 'application/octet-stream' })
      
      // Upload to fal.ai
      const { fal } = await import('@/lib/fal_client')
      const url = await fal.storage.upload(file)
      
      return api_success({ 
        url,
        complete: true 
      })
    }
    
    return api_success({ 
      chunkIndex,
      totalChunks,
      complete: false 
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}