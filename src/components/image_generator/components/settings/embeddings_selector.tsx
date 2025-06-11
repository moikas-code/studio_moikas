'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Upload, Link, Loader2, Package } from 'lucide-react'
import type { Embedding, EmbeddingInput, LoraWeight } from '@/types/embeddings'
import { toast } from 'react-hot-toast'

interface EmbeddingsSelectorProps {
  modelId: string
  selectedEmbeddings: EmbeddingInput[]
  selectedLoras: LoraWeight[]
  onEmbeddingsChange: (embeddings: EmbeddingInput[]) => void
  onLorasChange: (loras: LoraWeight[]) => void
}

export default function EmbeddingsSelector({
  modelId,
  selectedEmbeddings,
  selectedLoras,
  onEmbeddingsChange,
  onLorasChange
}: EmbeddingsSelectorProps) {
  const [embeddings, setEmbeddings] = useState<Embedding[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState<'embedding' | 'lora'>('embedding')
  const [customUrl, setCustomUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch available embeddings
  useEffect(() => {
    fetchEmbeddings()
  }, [])

  const fetchEmbeddings = async () => {
    try {
      const response = await fetch('/api/embeddings')
      const data = await response.json()
      if (data.embeddings) {
        setEmbeddings(data.embeddings)
      }
    } catch (error) {
      console.error('Failed to fetch embeddings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEmbedding = (embedding: Embedding) => {
    if (embedding.type === 'embedding') {
      const exists = selectedEmbeddings.find(e => e.path === embedding.url)
      if (exists) {
        onEmbeddingsChange(selectedEmbeddings.filter(e => e.path !== embedding.url))
      } else {
        onEmbeddingsChange([...selectedEmbeddings, {
          path: embedding.url,
          tokens: embedding.tokens
        }])
      }
    } else {
      const exists = selectedLoras.find(l => l.path === embedding.url)
      if (exists) {
        onLorasChange(selectedLoras.filter(l => l.path !== embedding.url))
      } else {
        const new_lora = {
          path: embedding.url,
          scale: embedding.metadata?.recommended_weight || 1
        }
        console.log('Adding LoRA:', new_lora)
        onLorasChange([...selectedLoras, new_lora])
      }
    }
  }

  const isValidHuggingFaceId = (input: string): boolean => {
    // Check if it's a Hugging Face model ID (format: user/model or org/model)
    const hfPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/
    return hfPattern.test(input)
  }

  const isValidUrl = (input: string): boolean => {
    try {
      new URL(input)
      return true
    } catch {
      return false
    }
  }

  const addCustomUrl = () => {
    if (!customUrl) return

    let finalPath = customUrl

    // Check if it's a Hugging Face ID
    if (isValidHuggingFaceId(customUrl)) {
      // For Hugging Face models, just use the ID as the path
      // The fal.ai API will handle the resolution
      finalPath = customUrl
    } else if (!isValidUrl(customUrl)) {
      toast.error('Please enter a valid URL or Hugging Face model ID (e.g., ntc-ai/SDXL-LoRA-slider.anime)')
      return
    }
    
    if (uploadType === 'embedding') {
      onEmbeddingsChange([...selectedEmbeddings, {
        path: finalPath,
        tokens: ['<s0>', '<s1>']
      }])
    } else {
      const new_custom_lora = {
        path: finalPath,
        scale: 1
      }
      console.log('Adding custom LoRA:', new_custom_lora)
      onLorasChange([...selectedLoras, new_custom_lora])
    }
    
    setCustomUrl('')
    setShowUploadModal(false)
    toast.success(`Custom ${uploadType} added`)
  }

  const uploadFileInChunks = async (file: File): Promise<string> => {
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadId = Math.random().toString(36).substring(2, 15)
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', i.toString())
      formData.append('totalChunks', totalChunks.toString())
      formData.append('fileName', file.name)
      formData.append('uploadId', uploadId)
      
      const response = await fetch('/api/embeddings/upload-chunk', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Chunk upload failed')
      }
      
      const result = await response.json()
      
      // Update progress
      const progress = Math.round(((i + 1) / totalChunks) * 100)
      toast.loading(`Uploading... ${progress}%`, { id: 'upload-progress' })
      
      if (result.data.complete) {
        toast.dismiss('upload-progress')
        return result.data.url
      }
    }
    
    throw new Error('Upload incomplete')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.endsWith('.safetensors')) {
      toast.error('Please upload a .safetensors file')
      return
    }

    // Validate file size (max 512MB)
    const maxSize = 512 * 1024 * 1024 // 512MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 512MB')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Uploading file...')

    try {
      let url: string
      
      // Use chunked upload for files larger than 50MB
      if (file.size > 50 * 1024 * 1024) {
        url = await uploadFileInChunks(file)
      } else {
        // Regular upload for smaller files
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/embeddings/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
        
        const result = await response.json()
        url = result.data.url
      }
      
      console.log('File uploaded to:', url)

      if (uploadType === 'embedding') {
        onEmbeddingsChange([...selectedEmbeddings, {
          path: url,
          tokens: ['<s0>', '<s1>']
        }])
      } else {
        const new_uploaded_lora = {
          path: url,
          scale: 1
        }
        console.log('Adding uploaded LoRA:', new_uploaded_lora)
        onLorasChange([...selectedLoras, new_uploaded_lora])
      }

      toast.success(`${file.name} uploaded successfully!`, { id: toastId })
      setShowUploadModal(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const updateLoraScale = (path: string, scale: number) => {
    onLorasChange(selectedLoras.map(lora => 
      lora.path === path ? { ...lora, scale } : lora
    ))
  }

  const defaultEmbeddings = embeddings.filter(e => e.is_default)
  const publicEmbeddings = embeddings.filter(e => e.is_public && !e.is_default)

  // Only show for SDXL models
  if (!modelId || !modelId.includes('sdxl')) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Embeddings & LoRAs</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-ghost btn-xs gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Custom
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Default Embeddings */}
          {defaultEmbeddings.length > 0 && (
            <div>
              <p className="text-xs text-base-content/60 mb-2">Recommended</p>
              <div className="space-y-2">
                {defaultEmbeddings.map(embedding => {
                  const isSelected = embedding.type === 'embedding' 
                    ? selectedEmbeddings.some(e => e.path === embedding.url)
                    : selectedLoras.some(l => l.path === embedding.url)
                  
                  return (
                    <div key={embedding.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={isSelected}
                          onChange={() => toggleEmbedding(embedding)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{embedding.name}</p>
                          <p className="text-xs text-base-content/60">{embedding.description}</p>
                        </div>
                        <span className="badge badge-xs">
                          {embedding.type === 'embedding' ? 'EMB' : 'LoRA'}
                        </span>
                      </label>
                      
                      {embedding.type === 'lora' && isSelected && (
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={selectedLoras.find(l => l.path === embedding.url)?.scale || 1}
                          onChange={(e) => updateLoraScale(embedding.url, parseFloat(e.target.value))}
                          className="range range-xs w-20"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Public Embeddings */}
          {publicEmbeddings.length > 0 && (
            <div>
              <p className="text-xs text-base-content/60 mb-2">Community</p>
              <div className="space-y-2">
                {publicEmbeddings.map(embedding => {
                  const isSelected = embedding.type === 'embedding' 
                    ? selectedEmbeddings.some(e => e.path === embedding.url)
                    : selectedLoras.some(l => l.path === embedding.url)
                  
                  return (
                    <div key={embedding.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={isSelected}
                          onChange={() => toggleEmbedding(embedding)}
                        />
                        <div className="flex-1">
                          <p className="text-sm">{embedding.name}</p>
                          {embedding.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {embedding.tags.map(tag => (
                                <span key={tag} className="badge badge-xs">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom URLs */}
          {(selectedEmbeddings.filter(e => !embeddings.some(emb => emb.url === e.path)).length > 0 ||
            selectedLoras.filter(l => !embeddings.some(emb => emb.url === l.path)).length > 0) && (
            <div>
              <p className="text-xs text-base-content/60 mb-2">Custom</p>
              <div className="space-y-2">
                {selectedEmbeddings.filter(e => !embeddings.some(emb => emb.url === e.path)).map((embedding, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Link className="w-3 h-3" />
                    <span className="flex-1 truncate">{embedding.path}</span>
                    <button
                      onClick={() => onEmbeddingsChange(selectedEmbeddings.filter((_, i) => i !== idx))}
                      className="btn btn-ghost btn-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {selectedLoras.filter(l => !embeddings.some(emb => emb.url === l.path)).map((lora, idx) => {
                  const isHuggingFace = isValidHuggingFaceId(lora.path)
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {isHuggingFace ? (
                        <Package className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <Link className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate" title={lora.path}>
                        {isHuggingFace ? lora.path : lora.path.split('/').pop() || lora.path}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={lora.scale}
                        onChange={(e) => updateLoraScale(lora.path, parseFloat(e.target.value))}
                        className="range range-xs w-20"
                      />
                      <button
                        onClick={() => onLorasChange(selectedLoras.filter((_, i) => i !== idx))}
                        className="btn btn-ghost btn-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowUploadModal(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-xl mb-6 text-base-content">Add Custom Embedding/LoRA</h3>
            
            <div className="space-y-6">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as 'embedding' | 'lora')}
                >
                  <option value="embedding">Embedding</option>
                  <option value="lora">LoRA</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">URL or Hugging Face ID</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    {isValidHuggingFaceId(customUrl) ? (
                      <Package className="w-5 h-5 text-base-content/60" />
                    ) : (
                      <Link className="w-5 h-5 text-base-content/60" />
                    )}
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 pr-3"
                    placeholder="ntc-ai/SDXL-LoRA-slider.anime or https://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt text-base-content/70">
                    Enter a Hugging Face model ID (e.g., ntc-ai/SDXL-LoRA-slider.anime) or direct URL
                  </span>
                </label>
              </div>

              <div className="divider text-base-content/50">OR</div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Upload .safetensors file</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".safetensors"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button 
                  className="btn btn-outline btn-block gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose File
                    </>
                  )}
                </button>
                <label className="label">
                  <span className="label-text-alt text-base-content/70">Max file size: 512MB</span>
                </label>
              </div>
            </div>

            <div className="modal-action mt-8">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={addCustomUrl}
                disabled={!customUrl || isUploading}
              >
                Add
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-base-content/20 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
        </div>
      )}
    </div>
  )
}