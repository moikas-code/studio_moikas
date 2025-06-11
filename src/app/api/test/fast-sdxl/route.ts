import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@/lib/fal_client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Test minimal payload
    const test_payload = {
      prompt: "1 anime girl on beach in a bikini, 8k",
      image_size: {
        width: 1024,
        height: 1024
      }
    }
    
    console.log('Testing Fast-SDXL with minimal payload:', JSON.stringify(test_payload, null, 2))
    
    try {
      const result = await fal.subscribe('fal-ai/fast-sdxl', {
        input: test_payload,
        logs: true
      })
      
      return NextResponse.json({
        success: true,
        message: 'Minimal payload worked!',
        result
      })
    } catch (minimalError: any) {
      console.error('Minimal payload failed:', minimalError)
      
      // Now test with the problematic payload
      const problematic_payload = {
        prompt: body.prompt || "1 anime girl on beach in a bikini, 8k",
        negative_prompt: body.negative_prompt || "cartoon, illustration, animation. face. male, female",
        image_size: {
          width: body.width || 1024,
          height: body.height || 1024
        },
        guidance_scale: body.guidance_scale || 7.5,
        num_inference_steps: body.num_inference_steps || 28,
        num_images: body.num_images || 1,
        enable_safety_checker: body.enable_safety_checker ?? false,
        expand_prompt: body.expand_prompt ?? true,
        format: body.format || "jpeg"
      }
      
      // Add loras only if they're valid
      if (body.loras && Array.isArray(body.loras)) {
        const valid_loras = body.loras.filter((l: any) => l && l.path && typeof l.path === 'string')
        if (valid_loras.length > 0) {
          problematic_payload.loras = valid_loras
        }
      }
      
      console.log('Testing with full payload:', JSON.stringify(problematic_payload, null, 2))
      
      try {
        const result2 = await fal.subscribe('fal-ai/fast-sdxl', {
          input: problematic_payload,
          logs: true
        })
        
        return NextResponse.json({
          success: true,
          message: 'Full payload worked!',
          result: result2
        })
      } catch (fullError: any) {
        return NextResponse.json({
          success: false,
          message: 'Both payloads failed',
          minimal_error: minimalError.message || 'Unknown error',
          full_error: fullError.message || 'Unknown error',
          problematic_payload
        }, { status: 500 })
      }
    }
    
  } catch (error) {
    console.error('Test route error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}