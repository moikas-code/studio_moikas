'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

interface EnhanceButtonProps {
  on_click: () => void
  is_enhancing: boolean
  enhancement_count: number
  disabled?: boolean
}

export function EnhanceButton({
  on_click,
  is_enhancing,
  enhancement_count,
  disabled = false
}: EnhanceButtonProps) {
  return (
    <button
      onClick={on_click}
      disabled={disabled || is_enhancing}
      className="btn btn-secondary btn-sm gap-2"
      title="Enhance your prompt with AI"
    >
      <Sparkles className={`w-4 h-4 ${is_enhancing ? 'animate-pulse' : ''}`} />
      <span className="hidden sm:inline">
        {is_enhancing ? 'Enhancing...' : 'Enhance'}
      </span>
      {enhancement_count > 0 && (
        <div className="badge badge-secondary badge-xs">
          {enhancement_count}
        </div>
      )}
    </button>
  )
}