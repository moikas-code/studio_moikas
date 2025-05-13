import { NextRequest, NextResponse } from 'next/server';
import { generate_flux_image } from '@/lib/fal_client';

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024 } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const image = await generate_flux_image(prompt, width, height);
    // image.uint8Array is a Uint8Array of the image data
    const base64 = Buffer.from(image.uint8Array).toString('base64');
    return NextResponse.json({ image_base64: base64 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 