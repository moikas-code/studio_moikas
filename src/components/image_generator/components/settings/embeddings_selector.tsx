'use client'

import React, { useState, useEffect } from 'react'
import { Plus, X, Upload, Link, Loader2 } from 'lucide-react'
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
        onLorasChange([...selectedLoras, {
          path: embedding.url,
          scale: embedding.metadata?.recommended_weight || 1
        }])
      }
    }
  }

  const addCustomUrl = () => {
    if (!customUrl) return

    try {
      new URL(customUrl) // Validate URL
      
      if (uploadType === 'embedding') {
        onEmbeddingsChange([...selectedEmbeddings, {
          path: customUrl,
          tokens: ['<s0>', '<s1>']
        }])
      } else {
        onLorasChange([...selectedLoras, {
          path: customUrl,
          scale: 1
        }])
      }
      
      setCustomUrl('')
      setShowUploadModal(false)
      toast.success(`Custom ${uploadType} added`)
    } catch {
      toast.error('Please enter a valid URL')
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
                          max="1"
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
                {selectedLoras.filter(l => !embeddings.some(emb => emb.url === l.path)).map((lora, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Link className="w-3 h-3" />
                    <span className="flex-1 truncate">{lora.path}</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
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
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Custom Embedding/LoRA</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as 'embedding' | 'lora')}
                >
                  <option value="embedding">Embedding</option>
                  <option value="lora">LoRA</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://example.com/model.safetensors"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt">Enter a direct URL to your .safetensors file</span>
                </label>
              </div>

              <div className="divider">OR</div>

              <div className="text-center">
                <button className="btn btn-outline gap-2" disabled>
                  <Upload className="w-4 h-4" />
                  Upload File (Coming Soon)
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={addCustomUrl}
                disabled={!customUrl}
              >
                Add
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowUploadModal(false)} />
        </div>
      )}
    </div>
  )
}