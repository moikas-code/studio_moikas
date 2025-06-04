'use client'

import React, { useEffect, useState } from 'react'
import { VIDEO_GENERATION_MESSAGES } from '../utils/video-constants'

interface VideoProgressIndicatorProps {
  job_id: string
  progress?: number
}

export function VideoProgressIndicator({ 
  job_id, 
  progress = 0 
}: VideoProgressIndicatorProps) {
  const [message_index, set_message_index] = useState(0)
  
  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      set_message_index(prev => 
        (prev + 1) % VIDEO_GENERATION_MESSAGES.length
      )
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-base-100 rounded-xl shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">
          Generating Your Video
        </h3>
        <p className="text-base-content/70 animate-pulse">
          {VIDEO_GENERATION_MESSAGES[message_index]}
        </p>
      </div>
      
      <div className="w-full bg-base-300 rounded-full h-3 mb-4 overflow-hidden">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-500
                     animate-pulse relative overflow-hidden"
          style={{ width: `${progress || 30}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                          via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      
      <p className="text-xs text-center text-base-content/50">
        Job ID: {job_id}
      </p>
    </div>
  )
}