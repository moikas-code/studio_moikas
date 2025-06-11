import { NextRequest, NextResponse } from 'next/server'

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
      const { generate_flux_image } = await import('@/lib/fal_client')
      const result = await generate_flux_image(
        test_payload.prompt,
        test_payload.image_size.width,
        test_payload.image_size.height,
        'fal-ai/fast-sdxl'
      )
      
      return NextResponse.json({
        success: true,
        message: 'Minimal payload worked!',
        result
      })
    } catch (minimalError) {
      console.error('Minimal payload failed:', minimalError)
      
      // Now test with the problematic payload
      const problematic_payload: Record<string, unknown> = {
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
        const valid_loras = body.loras.filter((l: unknown) => {
          if (!l || typeof l !== 'object') return false
          const lora = l as Record<string, unknown>
          return lora.path && typeof lora.path === 'string'
        })
        if (valid_loras.length > 0) {
          problematic_payload.loras = valid_loras
        }
      }
      
      console.log('Testing with full payload:', JSON.stringify(problematic_payload, null, 2))
      
      try {
        // Use the generate_flux_image function from our fal_client
        const { generate_flux_image } = await import('@/lib/fal_client')
        const result2 = await generate_flux_image(
          problematic_payload.prompt as string,
          (problematic_payload.image_size as {width: number, height: number}).width,
          (problematic_payload.image_size as {width: number, height: number}).height,
          'fal-ai/fast-sdxl',
          {
            negative_prompt: problematic_payload.negative_prompt as string,
            guidance_scale: problematic_payload.guidance_scale as number,
            num_inference_steps: problematic_payload.num_inference_steps as number,
            num_images: problematic_payload.num_images as number,
            enable_safety_checker: problematic_payload.enable_safety_checker as boolean,
            expand_prompt: problematic_payload.expand_prompt as boolean,
            format: problematic_payload.format as 'jpeg' | 'png',
            loras: problematic_payload.loras as Array<{path: string, scale?: number}>
          }
        )
        
        return NextResponse.json({
          success: true,
          message: 'Full payload worked!',
          result: result2
        })
      } catch (fullError) {
        const minimalErrorMsg = minimalError instanceof Error ? minimalError.message : 'Unknown error'
        const fullErrorMsg = fullError instanceof Error ? fullError.message : 'Unknown error'
        
        return NextResponse.json({
          success: false,
          message: 'Both payloads failed',
          minimal_error: minimalErrorMsg,
          full_error: fullErrorMsg,
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