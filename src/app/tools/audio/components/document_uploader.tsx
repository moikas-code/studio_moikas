import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DocumentUploaderProps {
  on_text_extracted: (text: string) => void
  is_processing?: boolean
  max_file_size?: number // in MB
}

export function DocumentUploader({ 
  on_text_extracted,
  is_processing = false,
  max_file_size = 10
}: DocumentUploaderProps) {
  const [selected_file, set_selected_file] = useState<File | null>(null)
  const [drag_active, set_drag_active] = useState(false)
  
  const supported_formats = ['application/pdf', 'text/plain', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text']
  
  const handle_file = useCallback((file: File) => {
    // Validate file type
    if (!supported_formats.includes(file.type)) {
      toast.error('Unsupported file format. Please upload PDF, TXT, DOC, DOCX, or ODT files.')
      return
    }
    
    // Validate file size
    const max_size_bytes = max_file_size * 1024 * 1024
    if (file.size > max_size_bytes) {
      toast.error(`File too large. Maximum size is ${max_file_size}MB`)
      return
    }
    
    set_selected_file(file)
  }, [max_file_size])

  const handle_drag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      set_drag_active(true)
    } else if (e.type === "dragleave") {
      set_drag_active(false)
    }
  }, [])
  
  const handle_drop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    set_drag_active(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handle_file(e.dataTransfer.files[0])
    }
  }, [handle_file])
  
  const handle_file_select = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handle_file(e.target.files[0])
    }
  }
  
  const handle_extract = async () => {
    if (!selected_file) return
    
    try {
      const form_data = new FormData()
      form_data.append('document', selected_file)
      
      const response = await fetch('/api/audio/extract-text', {
        method: 'POST',
        body: form_data
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text')
      }
      
      if (data.text) {
        on_text_extracted(data.text)
        toast.success('Text extracted successfully!')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extract text'
      toast.error(message)
    }
  }
  
  const format_file_size = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
    else return Math.round(bytes / 1048576) + ' MB'
  }
  
  const get_file_icon = (type: string) => {
    if (type === 'application/pdf') return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type === 'text/plain') return '📃'
    return '📎'
  }
  
  if (is_processing) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Processing document...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {!selected_file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            drag_active 
              ? 'border-primary bg-primary/5' 
              : 'border-base-300 hover:border-primary/50'
          }`}
          onDragEnter={handle_drag}
          onDragLeave={handle_drag}
          onDragOver={handle_drag}
          onDrop={handle_drop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
          
          <p className="text-lg font-medium mb-2">
            Drop your document here or click to browse
          </p>
          
          <p className="text-sm text-base-content/60 mb-4">
            Supported formats: PDF, TXT, DOC, DOCX, ODT
          </p>
          
          <input
            type="file"
            onChange={handle_file_select}
            accept=".pdf,.txt,.doc,.docx,.odt"
            className="hidden"
            id="document-upload"
          />
          
          <label
            htmlFor="document-upload"
            className="btn btn-primary btn-sm"
          >
            Select Document
          </label>
        </div>
      ) : (
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{get_file_icon(selected_file.type)}</span>
              <div>
                <p className="font-medium">{selected_file.name}</p>
                <p className="text-sm text-base-content/60">
                  {format_file_size(selected_file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => set_selected_file(null)}
              className="btn btn-ghost btn-sm btn-square"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handle_extract}
              className="btn btn-primary w-full"
            >
              <FileText className="w-4 h-4" />
              Extract Text
            </button>
          </div>
        </div>
      )}
    </div>
  )
}