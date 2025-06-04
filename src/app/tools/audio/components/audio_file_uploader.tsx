import React, { useRef, useState } from 'react'
import { Upload, X, FileAudio } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AudioFileUploaderProps {
  on_file_select: (file: File) => void
  max_file_size?: number // in MB
  accepted_formats?: string[]
}

export function AudioFileUploader({
  on_file_select,
  max_file_size = 10,
  accepted_formats = ['.mp3', '.wav', '.m4a', '.ogg', '.webm']
}: AudioFileUploaderProps) {
  const file_input_ref = useRef<HTMLInputElement>(null)
  const [selected_file, set_selected_file] = useState<File | null>(null)
  const [is_dragging, set_is_dragging] = useState(false)
  
  const validate_file = (file: File): boolean => {
    // Check file size
    const size_in_mb = file.size / (1024 * 1024)
    if (size_in_mb > max_file_size) {
      toast.error(`File too large. Maximum size is ${max_file_size}MB`)
      return false
    }
    
    // Check file type
    const file_extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!accepted_formats.includes(file_extension)) {
      toast.error(`Invalid file format. Accepted formats: ${accepted_formats.join(', ')}`)
      return false
    }
    
    // Check if it's actually an audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return false
    }
    
    return true
  }
  
  const handle_file_select = (file: File) => {
    if (validate_file(file)) {
      set_selected_file(file)
      on_file_select(file)
    }
  }
  
  const handle_input_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handle_file_select(file)
    }
  }
  
  const handle_drag_over = (e: React.DragEvent) => {
    e.preventDefault()
    set_is_dragging(true)
  }
  
  const handle_drag_leave = (e: React.DragEvent) => {
    e.preventDefault()
    set_is_dragging(false)
  }
  
  const handle_drop = (e: React.DragEvent) => {
    e.preventDefault()
    set_is_dragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handle_file_select(file)
    }
  }
  
  const clear_selection = () => {
    set_selected_file(null)
    if (file_input_ref.current) {
      file_input_ref.current.value = ''
    }
  }
  
  const format_file_size = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(1)}KB` : `${mb.toFixed(1)}MB`
  }
  
  return (
    <div className="space-y-4">
      {/* File Input Area */}
      {!selected_file && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${is_dragging 
              ? 'border-primary bg-primary/10' 
              : 'border-base-300 hover:border-primary/50'
            }
          `}
          onDragOver={handle_drag_over}
          onDragLeave={handle_drag_leave}
          onDrop={handle_drop}
        >
          <input
            ref={file_input_ref}
            type="file"
            accept={accepted_formats.join(',')}
            onChange={handle_input_change}
            className="hidden"
            id="audio-file-input"
          />
          
          <label 
            htmlFor="audio-file-input" 
            className="cursor-pointer space-y-4"
          >
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div>
              <p className="text-base font-medium">
                Upload an audio file
              </p>
              <p className="text-sm text-base-content/60 mt-1">
                or drag and drop
              </p>
            </div>
            
            <div className="text-xs text-base-content/50">
              <p>Maximum file size: {max_file_size}MB</p>
              <p>Supported formats: {accepted_formats.join(', ')}</p>
            </div>
          </label>
        </div>
      )}
      
      {/* Selected File Display */}
      {selected_file && (
        <div className="bg-base-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded">
                <FileAudio className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {selected_file.name}
                </p>
                <p className="text-sm text-base-content/60">
                  {format_file_size(selected_file.size)}
                </p>
              </div>
            </div>
            
            <button
              onClick={clear_selection}
              className="btn btn-ghost btn-sm btn-square"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Audio Preview */}
          <div className="mt-4">
            <audio 
              controls 
              src={URL.createObjectURL(selected_file)}
              className="w-full h-12"
              style={{ height: '48px' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}