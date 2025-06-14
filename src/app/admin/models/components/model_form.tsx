'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Minus, Save, X } from 'lucide-react';
import type { 
  ModelConfig,
  ModelFormData,
  ModelType,
  SizeMode,
  PixelSize
} from '@/types/models';
import {
  MODEL_TYPE_OPTIONS,
  SIZE_MODE_OPTIONS,
  DEFAULT_ASPECT_RATIOS,
  DEFAULT_DURATION_OPTIONS,
  SCHEDULER_OPTIONS,
  PREDICTION_TYPE_OPTIONS
} from '@/types/models';
import MetadataEditor from './metadata_editor';

interface ModelFormProps {
  model?: ModelConfig;
  on_submit?: (data: ModelFormData) => Promise<void>;
}

export default function ModelForm({ model, on_submit }: ModelFormProps) {
  const router = useRouter();
  const [loading, set_loading] = useState(false);
  
  // Form state
  const [form_data, set_form_data] = useState<ModelFormData>({
    model_id: '',
    name: '',
    type: 'image',
    cost_per_mp: 0.001,
    custom_cost: 0.001,
    supports_image_input: false,
    is_text_only: false,
    size_mode: 'aspect_ratio',
    supported_pixel_sizes: [],
    supported_aspect_ratios: DEFAULT_ASPECT_RATIOS,
    supports_both_size_modes: false,
    supports_cfg: false,
    supports_steps: false,
    max_images: 1,
    duration_options: DEFAULT_DURATION_OPTIONS,
    supports_audio_generation: false,
    // LoRA/SD specific
    supports_loras: false,
    supports_embeddings: false,
    supports_controlnet: false,
    supports_ip_adapter: false,
    supported_schedulers: [],
    supported_prediction_types: ['epsilon'],
    supports_clip_skip: false,
    supports_eta: false,
    supports_prompt_weighting: false,
    supported_variants: [],
    has_safety_checker: true,
    supports_custom_sigmas: false,
    supports_custom_timesteps: false,
    supports_tile_size: false,
    metadata: {},
    tags: [],
    display_order: 0
  });
  
  // Custom pixel size input
  const [custom_pixel_size, set_custom_pixel_size] = useState<PixelSize>({
    width: 1024,
    height: 1024,
    label: ''
  });
  
  // Custom aspect ratio input
  const [custom_aspect_ratio, set_custom_aspect_ratio] = useState('');
  
  // Custom tag input
  const [custom_tag, set_custom_tag] = useState('');
  
  // Initialize form with existing model data
  useEffect(() => {
    console.log('ModelForm received model:', model); // Debug log
    if (model) {
      set_form_data({
        model_id: model.model_id,
        name: model.name,
        type: model.type,
        cost_per_mp: model.cost_per_mp,
        custom_cost: model.custom_cost,
        supports_image_input: model.supports_image_input,
        is_text_only: model.is_text_only,
        size_mode: model.size_mode,
        supported_pixel_sizes: model.supported_pixel_sizes,
        supported_aspect_ratios: model.supported_aspect_ratios,
        supports_both_size_modes: model.supports_both_size_modes,
        supports_cfg: model.supports_cfg,
        default_cfg: model.default_cfg || undefined,
        min_cfg: model.min_cfg || undefined,
        max_cfg: model.max_cfg || undefined,
        supports_steps: model.supports_steps,
        default_steps: model.default_steps || undefined,
        max_steps: model.max_steps || undefined,
        max_images: model.max_images,
        duration_options: model.duration_options,
        supports_audio_generation: model.supports_audio_generation,
        // LoRA/SD specific
        supports_loras: model.supports_loras,
        supports_embeddings: model.supports_embeddings,
        supports_controlnet: model.supports_controlnet,
        supports_ip_adapter: model.supports_ip_adapter,
        supported_schedulers: model.supported_schedulers,
        default_scheduler: model.default_scheduler || undefined,
        supported_prediction_types: model.supported_prediction_types,
        default_prediction_type: model.default_prediction_type || undefined,
        supports_clip_skip: model.supports_clip_skip,
        default_clip_skip: model.default_clip_skip || undefined,
        max_clip_skip: model.max_clip_skip || undefined,
        supports_eta: model.supports_eta,
        default_eta: model.default_eta || undefined,
        max_eta: model.max_eta || undefined,
        supports_prompt_weighting: model.supports_prompt_weighting,
        supported_variants: model.supported_variants,
        default_variant: model.default_variant || undefined,
        has_safety_checker: model.has_safety_checker,
        supports_custom_sigmas: model.supports_custom_sigmas,
        supports_custom_timesteps: model.supports_custom_timesteps,
        supports_tile_size: model.supports_tile_size,
        default_tile_width: model.default_tile_width || undefined,
        default_tile_height: model.default_tile_height || undefined,
        max_tile_width: model.max_tile_width || undefined,
        max_tile_height: model.max_tile_height || undefined,
        metadata: model.metadata,
        api_endpoint: model.api_endpoint || undefined,
        api_version: model.api_version || undefined,
        tags: model.tags,
        display_order: model.display_order,
        is_default: model.is_default
      });
    }
  }, [model]);
  
  // Clean form data before submission
  const clean_form_data = (data: ModelFormData): ModelFormData => {
    const cleaned = { ...data };
    
    // Convert empty values to undefined for optional fields
    // Only set to undefined if the field is not being used
    if (!cleaned.supports_cfg) {
      cleaned.default_cfg = undefined;
      cleaned.min_cfg = undefined;
      cleaned.max_cfg = undefined;
    } else {
      // Keep non-zero values, convert zero/null to undefined
      if (!cleaned.default_cfg || cleaned.default_cfg === 0) {
        cleaned.default_cfg = undefined;
      }
      if (!cleaned.min_cfg || cleaned.min_cfg === 0) {
        cleaned.min_cfg = undefined;
      }
      if (!cleaned.max_cfg || cleaned.max_cfg === 0) {
        cleaned.max_cfg = undefined;
      }
    }
    
    if (!cleaned.supports_steps) {
      cleaned.default_steps = undefined;
      cleaned.max_steps = undefined;
    } else {
      // Keep non-zero values, convert zero/null to undefined
      if (!cleaned.default_steps || cleaned.default_steps === 0) {
        cleaned.default_steps = undefined;
      }
      if (!cleaned.max_steps || cleaned.max_steps === 0) {
        cleaned.max_steps = undefined;
      }
    }
    
    // Clean string fields
    if (!cleaned.api_endpoint || cleaned.api_endpoint.trim() === '') {
      cleaned.api_endpoint = undefined;
    }
    if (!cleaned.api_version || cleaned.api_version.trim() === '') {
      cleaned.api_version = undefined;
    }
    
    // Clean LoRA-specific fields
    if (!cleaned.default_scheduler || cleaned.default_scheduler.trim() === '') {
      cleaned.default_scheduler = undefined;
    }
    if (!cleaned.default_prediction_type || cleaned.default_prediction_type.trim() === '') {
      cleaned.default_prediction_type = undefined;
    }
    if (!cleaned.default_variant || cleaned.default_variant.trim() === '') {
      cleaned.default_variant = undefined;
    }
    
    if (!cleaned.supports_clip_skip) {
      cleaned.default_clip_skip = undefined;
      cleaned.max_clip_skip = undefined;
    } else {
      if (!cleaned.default_clip_skip || cleaned.default_clip_skip === 0) {
        cleaned.default_clip_skip = undefined;
      }
      if (!cleaned.max_clip_skip || cleaned.max_clip_skip === 0) {
        cleaned.max_clip_skip = undefined;
      }
    }
    
    if (!cleaned.supports_eta) {
      cleaned.default_eta = undefined;
      cleaned.max_eta = undefined;
    } else {
      if (!cleaned.default_eta || cleaned.default_eta === 0) {
        cleaned.default_eta = undefined;
      }
      if (!cleaned.max_eta || cleaned.max_eta === 0) {
        cleaned.max_eta = undefined;
      }
    }
    
    if (!cleaned.supports_tile_size) {
      cleaned.default_tile_width = undefined;
      cleaned.default_tile_height = undefined;
      cleaned.max_tile_width = undefined;
      cleaned.max_tile_height = undefined;
    } else {
      if (!cleaned.default_tile_width || cleaned.default_tile_width === 0) {
        cleaned.default_tile_width = undefined;
      }
      if (!cleaned.default_tile_height || cleaned.default_tile_height === 0) {
        cleaned.default_tile_height = undefined;
      }
      if (!cleaned.max_tile_width || cleaned.max_tile_width === 0) {
        cleaned.max_tile_width = undefined;
      }
      if (!cleaned.max_tile_height || cleaned.max_tile_height === 0) {
        cleaned.max_tile_height = undefined;
      }
    }
    
    return cleaned;
  };
  
  // Handle form submission
  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      set_loading(true);
      
      const cleaned_data = clean_form_data(form_data);
      
      if (on_submit) {
        await on_submit(cleaned_data);
      } else {
        // Default submission
        const method = model ? 'PUT' : 'POST';
        const url = model 
          ? `/api/admin/models/${model.id}`
          : '/api/admin/models';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleaned_data)
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success(model ? 'Model updated' : 'Model created');
          router.push('/admin/models');
        } else {
          toast.error(data.error || 'Failed to save model');
        }
      }
    } catch (error) {
      toast.error('Failed to save model');
      console.error(error);
    } finally {
      set_loading(false);
    }
  };
  
  // Add pixel size
  const add_pixel_size = () => {
    if (custom_pixel_size.width > 0 && custom_pixel_size.height > 0) {
      set_form_data({
        ...form_data,
        supported_pixel_sizes: [
          ...form_data.supported_pixel_sizes || [],
          { ...custom_pixel_size }
        ]
      });
      set_custom_pixel_size({ width: 1024, height: 1024, label: '' });
    }
  };
  
  // Remove pixel size
  const remove_pixel_size = (index: number) => {
    set_form_data({
      ...form_data,
      supported_pixel_sizes: form_data.supported_pixel_sizes?.filter((_, i) => i !== index) || []
    });
  };
  
  // Add aspect ratio
  const add_aspect_ratio = () => {
    if (custom_aspect_ratio && !form_data.supported_aspect_ratios?.includes(custom_aspect_ratio)) {
      set_form_data({
        ...form_data,
        supported_aspect_ratios: [
          ...form_data.supported_aspect_ratios || [],
          custom_aspect_ratio
        ]
      });
      set_custom_aspect_ratio('');
    }
  };
  
  // Remove aspect ratio
  const remove_aspect_ratio = (ratio: string) => {
    set_form_data({
      ...form_data,
      supported_aspect_ratios: form_data.supported_aspect_ratios?.filter(r => r !== ratio) || []
    });
  };
  
  // Add tag
  const add_tag = () => {
    if (custom_tag && !form_data.tags?.includes(custom_tag)) {
      set_form_data({
        ...form_data,
        tags: [...form_data.tags || [], custom_tag]
      });
      set_custom_tag('');
    }
  };
  
  // Remove tag
  const remove_tag = (tag: string) => {
    set_form_data({
      ...form_data,
      tags: form_data.tags?.filter(t => t !== tag) || []
    });
  };
  
  
  return (
    <form onSubmit={handle_submit} className="space-y-6">
      {/* Basic Information */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Model ID*</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={form_data.model_id}
                onChange={(e) => set_form_data({ ...form_data, model_id: e.target.value })}
                placeholder="e.g., fal-ai/flux/schnell"
                required
                disabled={!!model}
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name*</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={form_data.name}
                onChange={(e) => set_form_data({ ...form_data, name: e.target.value })}
                placeholder="e.g., FLUX Schnell"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type*</span>
              </label>
              <select
                className="select select-bordered"
                value={form_data.type}
                onChange={(e) => set_form_data({ ...form_data, type: e.target.value as ModelType })}
                required
              >
                {MODEL_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Cost per MP*</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={form_data.cost_per_mp}
                onChange={(e) => set_form_data({ ...form_data, cost_per_mp: parseFloat(e.target.value) })}
                step="0.000001"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Custom Cost ($)*</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={form_data.custom_cost}
                onChange={(e) => set_form_data({ ...form_data, custom_cost: parseFloat(e.target.value) })}
                step="0.000001"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Display Order</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                value={form_data.display_order || 0}
                onChange={(e) => set_form_data({ ...form_data, display_order: parseInt(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="flex flex-wrap gap-4">
            <label className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={form_data.supports_image_input}
                onChange={(e) => set_form_data({ ...form_data, supports_image_input: e.target.checked })}
              />
              <span className="label-text">Supports Image Input</span>
            </label>
            
            <label className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox"
                checked={form_data.is_text_only}
                onChange={(e) => set_form_data({ ...form_data, is_text_only: e.target.checked })}
              />
              <span className="label-text">Text Only</span>
            </label>
            
            <label className="label cursor-pointer gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={form_data.is_default || false}
                onChange={(e) => set_form_data({ ...form_data, is_default: e.target.checked })}
              />
              <span className="label-text">Default Model for {form_data.type}</span>
              {form_data.is_default && (
                <span className="badge badge-primary badge-sm">Default</span>
              )}
            </label>
          </div>
        </div>
      </div>
      
      {/* Size Configuration */}
      {(form_data.type === 'image' || form_data.type === 'video') && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Size Configuration</h2>
            
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_both_size_modes}
                  onChange={(e) => set_form_data({ ...form_data, supports_both_size_modes: e.target.checked })}
                />
                <span className="label-text">Supports Both Size Modes</span>
                <span className="text-xs text-base-content/60">(Aspect Ratio + Custom Pixel Size)</span>
              </label>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Primary Size Mode</span>
              </label>
              <select
                className="select select-bordered"
                value={form_data.size_mode}
                onChange={(e) => set_form_data({ ...form_data, size_mode: e.target.value as SizeMode })}
              >
                {SIZE_MODE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Pixel Sizes Section */}
            {(form_data.size_mode === 'pixel' || form_data.supports_both_size_modes) && (
              <div>
                <label className="label">
                  <span className="label-text">Supported Pixel Sizes</span>
                </label>
                
                <div className="space-y-2">
                  {form_data.supported_pixel_sizes?.map((size, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="badge badge-lg">
                        {size.width}x{size.height} {size.label && `(${size.label})`}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => remove_pixel_size(idx)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    placeholder="Width"
                    value={custom_pixel_size.width}
                    onChange={(e) => set_custom_pixel_size({
                      ...custom_pixel_size,
                      width: parseInt(e.target.value) || 0
                    })}
                  />
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    placeholder="Height"
                    value={custom_pixel_size.height}
                    onChange={(e) => set_custom_pixel_size({
                      ...custom_pixel_size,
                      height: parseInt(e.target.value) || 0
                    })}
                  />
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="Label (optional)"
                    value={custom_pixel_size.label}
                    onChange={(e) => set_custom_pixel_size({
                      ...custom_pixel_size,
                      label: e.target.value
                    })}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={add_pixel_size}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Aspect Ratios Section */}
            {(form_data.size_mode === 'aspect_ratio' || form_data.supports_both_size_modes) && (
              <div className={form_data.supports_both_size_modes ? 'mt-4' : ''}>
                <label className="label">
                  <span className="label-text">Supported Aspect Ratios</span>
                </label>
                
                <div className="flex flex-wrap gap-2">
                  {form_data.supported_aspect_ratios?.map(ratio => (
                    <div key={ratio} className="badge badge-lg gap-1">
                      {ratio}
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs p-0 min-h-0 h-auto"
                        onClick={() => remove_aspect_ratio(ratio)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="e.g., 16:9"
                    value={custom_aspect_ratio}
                    onChange={(e) => set_custom_aspect_ratio(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), add_aspect_ratio())}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={add_aspect_ratio}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Generation Parameters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Generation Parameters</h2>
          
          <div className="space-y-4">
            {/* CFG Settings */}
            <div>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_cfg}
                  onChange={(e) => set_form_data({ ...form_data, supports_cfg: e.target.checked })}
                />
                <span className="label-text">Supports CFG Scale</span>
              </label>
              
              {form_data.supports_cfg && (
                <div className="grid grid-cols-3 gap-4 ml-8">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Min CFG</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={form_data.min_cfg || ''}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        min_cfg: parseFloat(e.target.value) || undefined 
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Default CFG</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={form_data.default_cfg || ''}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        default_cfg: parseFloat(e.target.value) || undefined 
                      })}
                      step="0.1"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Max CFG</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={form_data.max_cfg || ''}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        max_cfg: parseFloat(e.target.value) || undefined 
                      })}
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Steps Settings */}
            <div>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_steps}
                  onChange={(e) => set_form_data({ ...form_data, supports_steps: e.target.checked })}
                />
                <span className="label-text">Supports Inference Steps</span>
              </label>
              
              {form_data.supports_steps && (
                <div className="grid grid-cols-2 gap-4 ml-8">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Default Steps</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={form_data.default_steps || ''}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        default_steps: parseInt(e.target.value) || undefined 
                      })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Max Steps</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-sm"
                      value={form_data.max_steps || ''}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        max_steps: parseInt(e.target.value) || undefined 
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Image-specific settings */}
            {form_data.type === 'image' && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Images</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={form_data.max_images}
                  onChange={(e) => set_form_data({ 
                    ...form_data, 
                    max_images: parseInt(e.target.value) || 1 
                  })}
                  min="1"
                  max="10"
                />
              </div>
            )}
            
            {/* Video-specific settings */}
            {form_data.type === 'video' && (
              <>
                <div>
                  <label className="label">
                    <span className="label-text">Duration Options (seconds)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {form_data.duration_options?.map(duration => (
                      <label key={duration} className="label cursor-pointer gap-1">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={true}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              set_form_data({
                                ...form_data,
                                duration_options: form_data.duration_options?.filter(d => d !== duration)
                              });
                            }
                          }}
                        />
                        <span className="label-text">{duration}s</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.supports_audio_generation}
                    onChange={(e) => set_form_data({ 
                      ...form_data, 
                      supports_audio_generation: e.target.checked 
                    })}
                  />
                  <span className="label-text">Supports Audio Generation</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* LoRA/SD Features - Only show for image models */}
      {form_data.type === 'image' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">LoRA/Stable Diffusion Features</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Feature toggles */}
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_loras}
                  onChange={(e) => set_form_data({ ...form_data, supports_loras: e.target.checked })}
                />
                <span className="label-text">Supports LoRAs</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_embeddings}
                  onChange={(e) => set_form_data({ ...form_data, supports_embeddings: e.target.checked })}
                />
                <span className="label-text">Supports Embeddings</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_controlnet}
                  onChange={(e) => set_form_data({ ...form_data, supports_controlnet: e.target.checked })}
                />
                <span className="label-text">Supports ControlNet</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_ip_adapter}
                  onChange={(e) => set_form_data({ ...form_data, supports_ip_adapter: e.target.checked })}
                />
                <span className="label-text">Supports IP Adapter</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_prompt_weighting}
                  onChange={(e) => set_form_data({ ...form_data, supports_prompt_weighting: e.target.checked })}
                />
                <span className="label-text">Prompt Weighting</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.has_safety_checker}
                  onChange={(e) => set_form_data({ ...form_data, has_safety_checker: e.target.checked })}
                />
                <span className="label-text">Has Safety Checker</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_custom_sigmas}
                  onChange={(e) => set_form_data({ ...form_data, supports_custom_sigmas: e.target.checked })}
                />
                <span className="label-text">Custom Sigmas</span>
              </label>
              
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form_data.supports_custom_timesteps}
                  onChange={(e) => set_form_data({ ...form_data, supports_custom_timesteps: e.target.checked })}
                />
                <span className="label-text">Custom Timesteps</span>
              </label>
            </div>
            
            <div className="divider"></div>
            
            {/* Model Name Field for LoRA/SD models */}
            {(form_data.supports_loras || form_data.model_id === 'fal-ai/lora') && (
              <div className="space-y-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Default Model Name</span>
                    <span className="label-text-alt text-xs">For custom SD/LoRA models (e.g., stabilityai/stable-diffusion-xl-base-1.0)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={(form_data.metadata?.default_model_name as string) || ''}
                    onChange={(e) => set_form_data({ 
                      ...form_data, 
                      metadata: {
                        ...form_data.metadata,
                        default_model_name: e.target.value
                      }
                    })}
                    placeholder="e.g., stabilityai/stable-diffusion-xl-base-1.0 or HuggingFace model ID"
                  />
                  <label className="label">
                    <span className="label-text-alt">Base model to use for generation</span>
                  </label>
                </div>
                
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={(form_data.metadata?.allow_custom_model_name as boolean) || false}
                      onChange={(e) => set_form_data({ 
                        ...form_data, 
                        metadata: {
                          ...form_data.metadata,
                          allow_custom_model_name: e.target.checked
                        }
                      })}
                    />
                    <span className="label-text">Allow Custom Model Name</span>
                    <span className="label-text-alt text-xs ml-2">Users can specify their own model from HuggingFace/CivitAI</span>
                  </label>
                </div>
                
                {(form_data.metadata?.allow_custom_model_name as boolean) && (
                  <>
                    <div className="alert alert-info">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>When enabled, users can input any Stable Diffusion model from HuggingFace or CivitAI</span>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Supported Model Sources</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['HuggingFace', 'CivitAI', 'Custom URL'].map(source => (
                          <label key={source} className="label cursor-pointer gap-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={((form_data.metadata?.supported_model_sources as string[]) || ['HuggingFace']).includes(source)}
                              onChange={(e) => {
                                const current_sources = (form_data.metadata?.supported_model_sources as string[]) || ['HuggingFace'];
                                const new_sources = e.target.checked
                                  ? [...current_sources, source]
                                  : current_sources.filter(s => s !== source);
                                set_form_data({ 
                                  ...form_data, 
                                  metadata: {
                                    ...form_data.metadata,
                                    supported_model_sources: new_sources
                                  }
                                });
                              }}
                            />
                            <span className="label-text">{source}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Schedulers */}
            <div>
              <label className="label">
                <span className="label-text">Supported Schedulers</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SCHEDULER_OPTIONS.map(scheduler => (
                  <label key={scheduler} className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form_data.supported_schedulers?.includes(scheduler)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set_form_data({
                            ...form_data,
                            supported_schedulers: [...(form_data.supported_schedulers || []), scheduler]
                          });
                        } else {
                          set_form_data({
                            ...form_data,
                            supported_schedulers: form_data.supported_schedulers?.filter(s => s !== scheduler) || []
                          });
                        }
                      }}
                    />
                    <span className="label-text text-sm">{scheduler}</span>
                  </label>
                ))}
              </div>
              
              {form_data.supported_schedulers && form_data.supported_schedulers.length > 0 && (
                <div className="form-control mt-2">
                  <label className="label">
                    <span className="label-text text-sm">Default Scheduler</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={form_data.default_scheduler || ''}
                    onChange={(e) => set_form_data({ ...form_data, default_scheduler: e.target.value || undefined })}
                  >
                    <option value="">Select default...</option>
                    {form_data.supported_schedulers.map(scheduler => (
                      <option key={scheduler} value={scheduler}>{scheduler}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Prediction Types */}
            <div className="mt-4">
              <label className="label">
                <span className="label-text">Supported Prediction Types</span>
              </label>
              <div className="flex gap-4">
                {PREDICTION_TYPE_OPTIONS.map(type => (
                  <label key={type} className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form_data.supported_prediction_types?.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          set_form_data({
                            ...form_data,
                            supported_prediction_types: [...(form_data.supported_prediction_types || []), type]
                          });
                        } else {
                          set_form_data({
                            ...form_data,
                            supported_prediction_types: form_data.supported_prediction_types?.filter(t => t !== type) || []
                          });
                        }
                      }}
                    />
                    <span className="label-text">{type}</span>
                  </label>
                ))}
              </div>
              
              {form_data.supported_prediction_types && form_data.supported_prediction_types.length > 0 && (
                <div className="form-control mt-2">
                  <label className="label">
                    <span className="label-text text-sm">Default Prediction Type</span>
                  </label>
                  <select
                    className="select select-bordered select-sm"
                    value={form_data.default_prediction_type || ''}
                    onChange={(e) => set_form_data({ ...form_data, default_prediction_type: e.target.value || undefined })}
                  >
                    <option value="">Select default...</option>
                    {form_data.supported_prediction_types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Advanced Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Clip Skip */}
              <div>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.supports_clip_skip}
                    onChange={(e) => set_form_data({ ...form_data, supports_clip_skip: e.target.checked })}
                  />
                  <span className="label-text">Supports Clip Skip</span>
                </label>
                
                {form_data.supports_clip_skip && (
                  <div className="grid grid-cols-2 gap-2 ml-8">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Default</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.default_clip_skip || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          default_clip_skip: parseInt(e.target.value) || undefined 
                        })}
                        min="0"
                        max="2"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Max</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.max_clip_skip || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          max_clip_skip: parseInt(e.target.value) || undefined 
                        })}
                        min="0"
                        max="2"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Eta */}
              <div>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.supports_eta}
                    onChange={(e) => set_form_data({ ...form_data, supports_eta: e.target.checked })}
                  />
                  <span className="label-text">Supports Eta</span>
                </label>
                
                {form_data.supports_eta && (
                  <div className="grid grid-cols-2 gap-2 ml-8">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Default</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.default_eta || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          default_eta: parseFloat(e.target.value) || undefined 
                        })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Max</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.max_eta || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          max_eta: parseFloat(e.target.value) || undefined 
                        })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tile Size */}
              <div className="md:col-span-2">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form_data.supports_tile_size}
                    onChange={(e) => set_form_data({ ...form_data, supports_tile_size: e.target.checked })}
                  />
                  <span className="label-text">Supports Tile Size</span>
                </label>
                
                {form_data.supports_tile_size && (
                  <div className="grid grid-cols-4 gap-2 ml-8">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Default Width</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.default_tile_width || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          default_tile_width: parseInt(e.target.value) || undefined 
                        })}
                        step="128"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Default Height</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.default_tile_height || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          default_tile_height: parseInt(e.target.value) || undefined 
                        })}
                        step="128"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Max Width</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.max_tile_width || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          max_tile_width: parseInt(e.target.value) || undefined 
                        })}
                        step="128"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm">Max Height</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        value={form_data.max_tile_height || ''}
                        onChange={(e) => set_form_data({ 
                          ...form_data, 
                          max_tile_height: parseInt(e.target.value) || undefined 
                        })}
                        step="128"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tags */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Tags</h2>
          
          <div className="flex flex-wrap gap-2">
            {form_data.tags?.map(tag => (
              <div key={tag} className="badge badge-lg gap-1">
                {tag}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs p-0 min-h-0 h-auto"
                  onClick={() => remove_tag(tag)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Add tag..."
              value={custom_tag}
              onChange={(e) => set_custom_tag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), add_tag())}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={add_tag}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Additional Metadata */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Additional Metadata</h2>
          <p className="text-sm text-base-content/60 mb-4">
            Configure model-specific settings and capabilities based on the API schema
          </p>
          
          {/* Show LoRA-specific help */}
          {(form_data.supports_loras || form_data.model_id === 'fal-ai/lora') && (
            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <h3 className="font-bold">LoRA Model Configuration</h3>
                <p className="text-sm">The following metadata fields are stored and used:</p>
                <ul className="text-sm mt-2 ml-4 list-disc">
                  <li><strong>default_model_name</strong>: The base SD model to use (e.g., &quot;stabilityai/stable-diffusion-xl-base-1.0&quot;)</li>
                  <li><strong>allow_custom_model_name</strong>: Whether users can specify their own models</li>
                  <li><strong>supported_model_sources</strong>: Which sources are allowed (HuggingFace, CivitAI, etc.)</li>
                  <li><strong>example_loras</strong>: Array of example LoRA configurations</li>
                  <li><strong>unet_name</strong>: Custom U-Net model URL (optional)</li>
                </ul>
              </div>
            </div>
          )}
          
          <MetadataEditor
            metadata={form_data.metadata || {}}
            on_change={(new_metadata) => set_form_data({ ...form_data, metadata: new_metadata })}
            model_id={form_data.model_id}
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/admin/models')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {model ? 'Update Model' : 'Create Model'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}