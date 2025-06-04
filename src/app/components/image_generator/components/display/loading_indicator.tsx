'use client'

import React from 'react'

interface LoadingIndicatorProps {
  message?: string
}

export function LoadingIndicator({ 
  message = 'Creating your masterpiece...' 
}: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent 
                        rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-base-content/70 text-center">
        {message}
      </p>
      <div className="flex gap-1 mt-2">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  )
}