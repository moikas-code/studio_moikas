import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import * as fal from '@fal-ai/serverless-client'
import { create_service_role_client } from '../../../../lib/supabase_server'
import { track } from '@vercel/analytics/server'
import { z } from 'zod'
import { TTS_LIMITS, calculateTTSCost } from '@/app/tools/audio/types'

fal.config({
  credentials: process.env.FAL_KEY!
})

const tts_params_schema = z.object({
  text: z.string().min(TTS_LIMITS.min_text_length).max(TTS_LIMITS.max_text_length),
  voice: z.string().optional(),
  exaggeration: z.number().min(TTS_LIMITS.min_exaggeration).max(TTS_LIMITS.max_exaggeration).optional(),
  cfg: z.number().min(TTS_LIMITS.min_cfg).max(TTS_LIMITS.max_cfg).optional(),
  high_quality_audio: z.boolean().optional(),
  temperature: z.number().min(TTS_LIMITS.min_temperature).max(TTS_LIMITS.max_temperature).optional(),
  seed: z.number().min(0).max(TTS_LIMITS.max_seed).optional(),
  source_audio_url: z.string().url().optional()
})

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = tts_params_schema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.format() },
        { status: 400 }
      )
    }

    const params = validation.data

    // Get user from database
    const supabase = create_service_role_client()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check token balance and plan type
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('renewable_tokens, permanent_tokens, plan')
      .eq('user_id', userData.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Calculate MP cost based on plan type
    const text_length = params.text.length
    const mp_cost = calculateTTSCost(text_length, subscription.plan)

    const total_tokens = subscription.renewable_tokens + subscription.permanent_tokens
    if (total_tokens < mp_cost) {
      return NextResponse.json(
        { error: 'Insufficient tokens', required: mp_cost, available: total_tokens },
        { status: 403 }
      )
    }

    // Deduct tokens - prioritize renewable tokens first, then permanent
    const renewable_to_deduct = Math.min(mp_cost, subscription.renewable_tokens)
    const permanent_to_deduct = mp_cost - renewable_to_deduct

    const { error: deductError } = await supabase
      .from('subscriptions')
      .update({
        renewable_tokens: subscription.renewable_tokens - renewable_to_deduct,
        permanent_tokens: subscription.permanent_tokens - permanent_to_deduct
      })
      .eq('user_id', userData.id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct tokens' }, { status: 500 })
    }

    // Log the usage
    await supabase
      .from('usage')
      .insert({
        user_id: userData.id,
        tokens_used: mp_cost,
        operation_type: 'audio_generation',
        description: `Text-to-speech: ${text_length} characters`,
        metadata: {
          character_count: text_length,
          voice: params.voice
        }
      })

    try {
      // Prepare fal.ai request
      const fal_params: {
        text: string
        audio_url?: string  // ChatterboxHD uses 'audio_url' for voice cloning
        exaggeration?: number
        cfg?: number
        temperature?: number
      } = {
        text: params.text
      }

      // Add optional parameters
      // Use audio_url for voice cloning (not source_audio_url)
      if (params.source_audio_url) {
        fal_params.audio_url = params.source_audio_url
      }
      if (params.exaggeration !== undefined) fal_params.exaggeration = params.exaggeration
      if (params.cfg !== undefined) fal_params.cfg = params.cfg
      if (params.temperature !== undefined) fal_params.temperature = params.temperature

      // Call fal.ai API with ChatterboxHD model (supports voice cloning)
      const result = await fal.run('resemble-ai/chatterboxhd/text-to-speech', {
        input: fal_params
      }) as { url?: string; data?: { url?: string }; audio?: { url?: string } }

      // Extract audio URL from result (ChatterboxHD has different response structure)
      const audio_url = result.url || result.data?.url || result.audio?.url
      
      if (!audio_url) {
        throw new Error('No audio URL in response')
      }

      // Track successful generation
      track('tts_generated', {
        userId,
        voice: params.source_audio_url ? 'cloned' : (params.voice || 'default'),
        text_length,
        mp_cost,
        high_quality: params.high_quality_audio || false,
        voice_cloning: !!params.source_audio_url
      })

      return NextResponse.json({
        success: true,
        audio_url,
        text_characters: text_length,
        mana_points_used: mp_cost
      })

    } catch (fal_error) {
      // Refund tokens on failure - add back the same way we deducted
      await supabase
        .from('subscriptions')
        .update({
          renewable_tokens: subscription.renewable_tokens, // restore original values
          permanent_tokens: subscription.permanent_tokens
        })
        .eq('user_id', userData.id)

      // Log the refund
      await supabase
        .from('usage')
        .insert({
          user_id: userData.id,
          tokens_used: -mp_cost, // negative for refund
          description: `TTS refund: generation failed`
        })

      console.error('TTS generation error:', fal_error)
      track('tts_generation_error', {
        userId,
        error: fal_error instanceof Error ? fal_error.message : 'Unknown error'
      })

      return NextResponse.json(
        { error: 'Text-to-speech generation failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('TTS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}