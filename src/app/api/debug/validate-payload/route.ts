import { NextRequest, NextResponse } from 'next/server'
import { image_generation_schema } from '@/lib/utils/api/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Raw payload:', JSON.stringify(body, null, 2))
    
    // Check specific fields
    console.log('Checking loras array:')
    if (body.loras && Array.isArray(body.loras)) {
      body.loras.forEach((lora: unknown, index: number) => {
        const loraObj = lora as Record<string, unknown>
        console.log(`LoRA ${index}:`, JSON.stringify(lora))
        console.log(`  - Has path: ${!!loraObj.path}`)
        console.log(`  - Path value: ${loraObj.path}`)
        console.log(`  - Has scale: ${!!loraObj.scale}`)
        console.log(`  - Scale value: ${loraObj.scale}`)
        console.log(`  - All keys: ${Object.keys(loraObj).join(', ')}`)
      })
    }
    
    // Try to validate with Zod
    try {
      const validated = image_generation_schema.parse(body)
      console.log('Validation passed!')
      console.log('Validated loras:', JSON.stringify(validated.loras, null, 2))
      
      return NextResponse.json({
        success: true,
        message: 'Payload is valid',
        validated_loras: validated.loras,
        raw_loras: body.loras
      })
    } catch (zodError) {
      console.error('Zod validation error:', zodError)
      const errorMessage = zodError instanceof Error ? zodError.message : 'Validation failed'
      const zodErrorDetails = zodError && typeof zodError === 'object' && 'errors' in zodError 
        ? (zodError as { errors: unknown }).errors 
        : undefined
      
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        error: zodErrorDetails || errorMessage,
        raw_loras: body.loras
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Debug route error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}