'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Eye, EyeOff, Trash2, Edit2, Check, Link } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Embedding } from '@/types/embeddings'

interface FormData {
  name: string
  description: string
  type: 'embedding' | 'lora'
  model_type: string
  tokens: string[]
  url: string
  is_public: boolean
  is_default: boolean
  tags: string[]
  metadata: {
    recommended_weight?: number
    [key: string]: unknown
  }
}

export default function AdminEmbeddingsPage() {
  const [embeddings, set_embeddings] = useState<Embedding[]>([])
  const [loading, set_loading] = useState(true)
  const [show_form, set_show_form] = useState(false)
  const [editing_id, set_editing_id] = useState<string | null>(null)
  const [form_data, set_form_data] = useState<FormData>({
    name: '',
    description: '',
    type: 'embedding',
    model_type: 'sdxl',
    tokens: ['<s0>', '<s1>'],
    url: '',
    is_public: false,
    is_default: false,
    tags: [],
    metadata: {}
  })
  const [new_tag, set_new_tag] = useState('')

  useEffect(() => {
    fetch_embeddings()
  }, [])

  const fetch_embeddings = async () => {
    try {
      const response = await fetch('/api/admin/embeddings')
      if (response.ok) {
        const data = await response.json()
        set_embeddings(data.embeddings || [])
      }
    } catch (error) {
      console.error('Failed to fetch embeddings:', error)
      toast.error('Failed to load embeddings')
    } finally {
      set_loading(false)
    }
  }

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editing_id 
        ? `/api/admin/embeddings/${editing_id}`
        : '/api/admin/embeddings'
      
      const response = await fetch(url, {
        method: editing_id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form_data)
      })

      if (response.ok) {
        toast.success(editing_id ? 'Embedding updated' : 'Embedding created')
        reset_form()
        fetch_embeddings()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save embedding')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    }
  }

  const handle_delete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this embedding?')) return

    try {
      const response = await fetch(`/api/admin/embeddings/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Embedding deleted')
        fetch_embeddings()
      } else {
        throw new Error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete embedding')
    }
  }

  const handle_toggle_public = async (id: string, is_public: boolean) => {
    try {
      const response = await fetch(`/api/admin/embeddings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !is_public })
      })

      if (response.ok) {
        toast.success(is_public ? 'Made private' : 'Made public')
        fetch_embeddings()
      }
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  const handle_toggle_default = async (id: string, is_default: boolean) => {
    try {
      const response = await fetch(`/api/admin/embeddings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: !is_default })
      })

      if (response.ok) {
        toast.success(is_default ? 'Removed from defaults' : 'Added to defaults')
        fetch_embeddings()
      }
    } catch {
      toast.error('Failed to update default status')
    }
  }

  const handle_edit = (embedding: Embedding) => {
    set_form_data({
      name: embedding.name,
      description: embedding.description || '',
      type: embedding.type,
      model_type: embedding.model_type,
      tokens: embedding.tokens,
      url: embedding.url,
      is_public: embedding.is_public,
      is_default: embedding.is_default,
      tags: embedding.tags,
      metadata: embedding.metadata
    })
    set_editing_id(embedding.id)
    set_show_form(true)
  }

  const reset_form = () => {
    set_form_data({
      name: '',
      description: '',
      type: 'embedding',
      model_type: 'sdxl',
      tokens: ['<s0>', '<s1>'],
      url: '',
      is_public: false,
      is_default: false,
      tags: [],
      metadata: {}
    })
    set_editing_id(null)
    set_show_form(false)
  }

  const add_tag = () => {
    if (new_tag && !form_data.tags.includes(new_tag)) {
      set_form_data({ ...form_data, tags: [...form_data.tags, new_tag] })
      set_new_tag('')
    }
  }

  const remove_tag = (tag: string) => {
    set_form_data({ ...form_data, tags: form_data.tags.filter(t => t !== tag) })
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Embeddings Management</h1>
          <p className="text-base-content/70 mt-2">
            Manage embeddings and LoRAs for SDXL models
          </p>
        </div>
        <button
          onClick={() => set_show_form(true)}
          className="btn btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Embedding
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid gap-4">
          {embeddings.map(embedding => (
            <div key={embedding.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{embedding.name}</h3>
                      <span className="badge badge-sm">
                        {embedding.type === 'embedding' ? 'EMB' : 'LoRA'}
                      </span>
                      {embedding.is_default && (
                        <span className="badge badge-primary badge-sm">Default</span>
                      )}
                      {embedding.is_public && (
                        <span className="badge badge-secondary badge-sm">Public</span>
                      )}
                    </div>
                    <p className="text-sm text-base-content/70 mb-2">
                      {embedding.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-base-content/60">
                        Model: {embedding.model_type}
                      </span>
                      <span className="text-base-content/60">
                        Tokens: {embedding.tokens.join(', ')}
                      </span>
                    </div>
                    {embedding.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {embedding.tags.map(tag => (
                          <span key={tag} className="badge badge-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Link className="w-3 h-3 text-base-content/60" />
                      <a 
                        href={embedding.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate max-w-md"
                      >
                        {embedding.url}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handle_toggle_public(embedding.id, embedding.is_public)}
                      className="btn btn-ghost btn-sm tooltip"
                      data-tip={embedding.is_public ? 'Make Private' : 'Make Public'}
                    >
                      {embedding.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handle_toggle_default(embedding.id, embedding.is_default)}
                      className="btn btn-ghost btn-sm tooltip"
                      data-tip={embedding.is_default ? 'Remove Default' : 'Set as Default'}
                    >
                      <Check className={`w-4 h-4 ${embedding.is_default ? 'text-primary' : ''}`} />
                    </button>
                    <button
                      onClick={() => handle_edit(embedding)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handle_delete(embedding.id)}
                      className="btn btn-ghost btn-sm text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {show_form && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editing_id ? 'Edit Embedding' : 'Add New Embedding'}
            </h3>
            
            <form onSubmit={handle_submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={form_data.name}
                    onChange={(e) => set_form_data({ ...form_data, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={form_data.type}
                    onChange={(e) => set_form_data({ ...form_data, type: e.target.value as 'embedding' | 'lora' })}
                  >
                    <option value="embedding">Embedding</option>
                    <option value="lora">LoRA</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={2}
                  value={form_data.description}
                  onChange={(e) => set_form_data({ ...form_data, description: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://example.com/model.safetensors"
                  value={form_data.url}
                  onChange={(e) => set_form_data({ ...form_data, url: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tokens</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={form_data.tokens.join(', ')}
                  onChange={(e) => set_form_data({ 
                    ...form_data, 
                    tokens: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  placeholder="<s0>, <s1>"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tags</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value={new_tag}
                    onChange={(e) => set_new_tag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), add_tag())}
                    placeholder="Add a tag"
                  />
                  <button type="button" onClick={add_tag} className="btn btn-ghost">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {form_data.tags.map(tag => (
                    <span key={tag} className="badge badge-sm gap-1">
                      {tag}
                      <button type="button" onClick={() => remove_tag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.is_public}
                    onChange={(e) => set_form_data({ ...form_data, is_public: e.target.checked })}
                  />
                  <span>Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.is_default}
                    onChange={(e) => set_form_data({ ...form_data, is_default: e.target.checked })}
                  />
                  <span>Default</span>
                </label>
              </div>

              {form_data.type === 'lora' && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Recommended Weight</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="0"
                    max="1"
                    step="0.1"
                    value={form_data.metadata.recommended_weight || 1}
                    onChange={(e) => set_form_data({ 
                      ...form_data, 
                      metadata: { ...form_data.metadata, recommended_weight: parseFloat(e.target.value) }
                    })}
                  />
                </div>
              )}

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={reset_form}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing_id ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={reset_form} />
        </div>
      )}
    </div>
  )
}