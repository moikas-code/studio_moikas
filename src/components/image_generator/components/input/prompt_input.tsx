'use client'

import React, { useRef, useEffect } from 'react'
import { Camera } from 'lucide-react'

interface PromptInputProps {
  value: string
  on_change: (value: string) => void
  on_submit: () => void
  is_loading: boolean
  placeholder?: string
  max_length?: number
  auto_resize?: boolean
}

export function PromptInput({
  value,
  on_change,
  on_submit,
  is_loading,
  placeholder = "A futuristic city skyline at sunset...",
  max_length = 100000,
  auto_resize = true
}: PromptInputProps) {
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (auto_resize && textarea_ref.current) {
      textarea_ref.current.style.height = 'auto'
      textarea_ref.current.style.height = `${textarea_ref.current.scrollHeight}px`
    }
  }, [value, auto_resize])
  
  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      on_submit()
    }
  }
  
  return (
    <div className="relative">
      <textarea
        ref={textarea_ref}
        value={value}
        onChange={(e) => on_change(e.target.value)}
        onKeyDown={handle_key_down}
        placeholder={placeholder}
        disabled={is_loading}
        maxLength={max_length}
        className="w-full px-4 py-3 pr-12 text-base rounded-lg 
                   bg-base-200 border border-base-300 
                   focus:outline-none focus:ring-2 focus:ring-primary
                   resize-none min-h-[100px] max-h-[300px]
                   disabled:opacity-50"
        rows={3}
      />
      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        <span className="text-xs text-base-content/50">
          {value.length}/{max_length}
        </span>
        <Camera className="w-5 h-5 text-base-content/30" />
      </div>
    </div>
  )
}