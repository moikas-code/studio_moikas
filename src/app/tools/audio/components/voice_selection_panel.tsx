import React, { useState } from 'react'
import { User, Bot, Info } from 'lucide-react'
import { VOICE_OPTIONS } from '../types'

interface VoiceSelectionPanelProps {
  selected_voice: string
  on_voice_change: (voice: string) => void
  disabled?: boolean
}

export function VoiceSelectionPanel({ 
  selected_voice,
  on_voice_change,
  disabled = false
}: VoiceSelectionPanelProps) {
  const [show_descriptions, set_show_descriptions] = useState(false)
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Voice Selection</h3>
        <button
          type="button"
          onClick={() => set_show_descriptions(!show_descriptions)}
          className="btn btn-ghost btn-sm gap-1"
          aria-label="Toggle voice descriptions"
        >
          <Info className="w-4 h-4" />
          {show_descriptions ? 'Hide' : 'Show'} Info
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {VOICE_OPTIONS.map((voice) => {
          const is_selected = selected_voice === voice.id
          
          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => on_voice_change(voice.id)}
              disabled={disabled}
              className={`
                card p-4 text-left transition-all cursor-pointer
                ${is_selected 
                  ? 'bg-primary/10 border-primary shadow-sm' 
                  : 'bg-base-200 hover:bg-base-300 border-base-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-pressed={is_selected}
              aria-label={`Select ${voice.name} voice`}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-full transition-colors
                  ${is_selected ? 'bg-primary/20' : 'bg-base-300'}
                `}>
                  {voice.name.match(/^(Aurora|Britney|Siobhan|Vicky)$/) ? (
                    <User className={`w-5 h-5 ${is_selected ? 'text-primary' : 'text-base-content/60'}`} />
                  ) : (
                    <Bot className={`w-5 h-5 ${is_selected ? 'text-primary' : 'text-base-content/60'}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${is_selected ? 'text-primary' : ''}`}>
                    {voice.name}
                  </p>
                  {show_descriptions && voice.description && (
                    <p className="text-xs text-base-content/60 mt-1">
                      {voice.description}
                    </p>
                  )}
                </div>
                
                {is_selected && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {!disabled && (
        <p className="text-sm text-base-content/60">
          Select a voice for text-to-speech generation
        </p>
      )}
      
      {disabled && (
        <div className="alert alert-info">
          <Info className="w-4 h-4" />
          <p className="text-sm">
            Voice selection is disabled when using voice cloning
          </p>
        </div>
      )}
    </div>
  )
}