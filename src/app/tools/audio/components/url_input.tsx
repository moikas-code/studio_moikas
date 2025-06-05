import React, { useState } from 'react'
import { Link, Loader2, Globe } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UrlInputProps {
  on_text_extracted: (text: string) => void
  is_processing?: boolean
}

export function UrlInput({ 
  on_text_extracted,
  is_processing = false 
}: UrlInputProps) {
  const [url_input, set_url_input] = useState('')
  const [is_extracting, set_is_extracting] = useState(false)
  
  const is_valid_url = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  const handle_extract = async () => {
    if (!url_input || !is_valid_url(url_input)) {
      toast.error('Please enter a valid URL')
      return
    }
    
    set_is_extracting(true)
    
    try {
      const response = await fetch('/api/audio/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url_input })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text from URL')
      }
      
      if (data.text) {
        on_text_extracted(data.text)
        toast.success('Text extracted successfully!')
        set_url_input('') // Clear input after success
      } else if (data.error) {
        // Show detailed error with suggestion
        toast.error(data.error)
        if (data.suggestion) {
          toast(data.suggestion, { icon: '💡' })
        }
        if (data.debug) {
          console.log('Extraction debug info:', data.debug)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extract text'
      toast.error(message)
      
      // Additional help for common issues
      if (url_input.includes('wikipedia.org')) {
        toast('Wikipedia extraction can be tricky. Try copying the article text directly.', { icon: '💡' })
      }
    } finally {
      set_is_extracting(false)
    }
  }
  
  const handle_key_press = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !is_extracting) {
      handle_extract()
    }
  }
  
  if (is_processing || is_extracting) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Extracting content from URL...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Enter URL</span>
        </label>
        
        <div className="input-group">
          <span className="bg-base-200 px-4 flex items-center">
            <Globe className="w-5 h-5 text-base-content/50" />
          </span>
          <input
            type="url"
            value={url_input}
            onChange={(e) => set_url_input(e.target.value)}
            onKeyPress={handle_key_press}
            placeholder="https://example.com/article"
            className="input input-bordered flex-1"
          />
        </div>
        
        <label className="label">
          <span className="label-text-alt text-base-content/60">
            We'll extract the main content from the webpage
          </span>
        </label>
      </div>
      
      <button
        onClick={handle_extract}
        disabled={!url_input || !is_valid_url(url_input)}
        className="btn btn-primary w-full"
      >
        <Link className="w-4 h-4" />
        Extract Text from URL
      </button>
      
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <p className="text-sm">Supported content:</p>
          <ul className="text-xs mt-1 ml-4 list-disc">
            <li>Articles and blog posts</li>
            <li>News pages</li>
            <li>Documentation</li>
            <li>Most text-based web content</li>
          </ul>
        </div>
      </div>
    </div>
  )
}