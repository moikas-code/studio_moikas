import type { AspectOption } from '../types/video-effects'

export const ASPECT_OPTIONS: AspectOption[] = [
  { label: "16:9 (Landscape)", value: "16:9", slider_value: 0 },
  { label: "1:1 (Square)", value: "1:1", slider_value: 1 },
  { label: "9:16 (Portrait)", value: "9:16", slider_value: 2 },
]

export const DEFAULT_DURATION = 5
export const MIN_DURATION = 1
export const MAX_DURATION = 10

export const POLLING_INTERVAL = 3000 // 3 seconds
export const MAX_POLL_RETRIES = 3

export const VIDEO_GENERATION_MESSAGES = [
  "Creating your masterpiece...",
  "Applying effects...",
  "Processing frames...",
  "Almost there...",
  "Finalizing video..."
]