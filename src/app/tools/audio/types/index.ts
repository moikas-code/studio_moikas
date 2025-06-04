export type VoiceOption = {
  id: string
  name: string
  description?: string
}

export type TTSParams = {
  text: string
  voice?: string
  exaggeration?: number
  cfg?: number
  high_quality_audio?: boolean
  temperature?: number
  seed?: number
  source_audio_url?: string
}

export type TTSResult = {
  audio_url: string
  duration?: number
  text_characters: number
  mana_points_used: number
}

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac'

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Aurora', name: 'Aurora', description: 'Warm and friendly female voice' },
  { id: 'Blade', name: 'Blade', description: 'Deep and authoritative male voice' },
  { id: 'Britney', name: 'Britney', description: 'Youthful and energetic female voice' },
  { id: 'Carl', name: 'Carl', description: 'Professional male voice' },
  { id: 'Cliff', name: 'Cliff', description: 'Mature and confident male voice' },
  { id: 'Richard', name: 'Richard', description: 'Clear and articulate male voice' },
  { id: 'Rico', name: 'Rico', description: 'Smooth and charismatic male voice' },
  { id: 'Siobhan', name: 'Siobhan', description: 'Elegant and refined female voice' },
  { id: 'Vicky', name: 'Vicky', description: 'Cheerful and expressive female voice' }
]

export const TTS_LIMITS = {
  max_text_length: 5000,
  min_text_length: 1,
  max_exaggeration: 2.0,
  min_exaggeration: 0.25,
  default_exaggeration: 0.5,
  max_cfg: 1.0,
  min_cfg: 0.0,
  default_cfg: 0.5,
  max_temperature: 5.0,
  min_temperature: 0.05,
  default_temperature: 0.8,
  max_seed: 2147483647
}

// Cost calculation: $0.016 per 250 characters (includes 1.6x markup)
// 1 MP = $0.001
// $0.016 = 16 MP for 250 characters
// Charges are rounded up to the nearest 250 character increment
export const TTS_MP_COST_PER_CHARACTER = 0.04
export const TTS_MIN_CHARGE_CHARACTERS = 250
export const TTS_MIN_CHARGE_MP = 16 // $0.016 in MP (includes 1.6x markup)
export const TTS_MARKUP_MULTIPLIER = 1.6

// Helper function to calculate actual cost with minimum charge and markup
export function calculateTTSCost(characterCount: number): number {
  // Round up to nearest 250 character increment
  const chargeableCharacters = Math.ceil(characterCount / TTS_MIN_CHARGE_CHARACTERS) * TTS_MIN_CHARGE_CHARACTERS
  const baseCost = chargeableCharacters * TTS_MP_COST_PER_CHARACTER
  return Math.ceil(baseCost * TTS_MARKUP_MULTIPLIER)
}