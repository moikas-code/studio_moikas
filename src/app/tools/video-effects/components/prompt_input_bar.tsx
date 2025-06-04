'use client'

import React, { useRef, useEffect } from 'react'
import { FaImage, FaMagic } from 'react-icons/fa'
import { Settings } from 'lucide-react'

interface PromptInputBarProps {
  prompt: string
  on_prompt_change: (prompt: string) => void
  on_submit: () => void
  on_enhance: () => void
  on_file_select: (file: File) => void
  on_settings_toggle: () => void
  is_loading: boolean
  is_enhancing: boolean
  has_image: boolean
  disabled?: boolean
}

export function PromptInputBar({
  prompt,
  on_prompt_change,
  on_submit,
  on_enhance,
  on_file_select,
  on_settings_toggle,
  is_loading,
  is_enhancing,
  has_image,
  disabled = false
}: PromptInputBarProps) {
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  const file_input_ref = useRef<HTMLInputElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textarea_ref.current
    if (!textarea) return
    
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [prompt])
  
  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      on_submit()
    }
  }
  
  const handle_file_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      on_file_select(file)
    }
  }
  
  return (
    <div className="w-full bg-base-100 rounded-2xl shadow-xl p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textarea_ref}
            value={prompt}
            onChange={(e) => on_prompt_change(e.target.value)}
            onKeyDown={handle_key_down}
            placeholder="Describe your video..."
            disabled={disabled || is_loading}
            className="w-full px-4 py-3 pr-12 text-base 
                       bg-base-200 rounded-lg border border-base-300
                       focus:outline-none focus:ring-2 focus:ring-primary
                       resize-none min-h-[56px] max-h-[200px]
                       disabled:opacity-50"
            rows={1}
          />
          {has_image && (
            <div className="absolute right-3 top-3 badge badge-success badge-sm">
              Image attached
            </div>
          )}
        </div>
        
        <input
          ref={file_input_ref}
          type="file"
          accept="image/*"
          onChange={handle_file_change}
          className="hidden"
        />
        
        <button
          onClick={() => file_input_ref.current?.click()}
          disabled={disabled || is_loading}
          className="btn btn-circle btn-ghost"
          title="Upload image"
        >
          <FaImage className="w-5 h-5" />
        </button>
        
        <button
          onClick={on_enhance}
          disabled={disabled || is_loading || is_enhancing || !prompt.trim()}
          className="btn btn-circle btn-ghost"
          title="Enhance prompt"
        >
          <FaMagic className={`w-5 h-5 ${is_enhancing ? 'animate-spin' : ''}`} />
        </button>
        
        <button
          onClick={on_settings_toggle}
          className="btn btn-circle btn-ghost"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        
        <button
          onClick={on_submit}
          disabled={disabled || is_loading || !prompt.trim()}
          className="btn btn-primary"
        >
          {is_loading ? (
            <>
              <span className="loading loading-spinner"></span>
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </button>
      </div>
    </div>
  )
}