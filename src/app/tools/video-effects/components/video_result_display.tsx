'use client'

import React from 'react'
import { Download, Copy, ExternalLink } from 'lucide-react'

interface VideoResultDisplayProps {
  video_url: string
  on_new_video: () => void
}

export function VideoResultDisplay({ 
  video_url, 
  on_new_video 
}: VideoResultDisplayProps) {
  const handle_download = async () => {
    try {
      const response = await fetch(video_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }
  
  const handle_copy_link = async () => {
    try {
      await navigator.clipboard.writeText(video_url)
      // Could add toast notification here
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-base-100 rounded-xl shadow-lg">
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
        <video
          src={video_url}
          controls
          autoPlay
          loop
          className="w-full h-full"
        />
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={handle_download}
          className="btn btn-primary gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        
        <button
          onClick={handle_copy_link}
          className="btn btn-ghost gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Link
        </button>
        
        <a
          href={video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </a>
        
        <button
          onClick={on_new_video}
          className="btn btn-secondary"
        >
          Generate New Video
        </button>
      </div>
    </div>
  )
}