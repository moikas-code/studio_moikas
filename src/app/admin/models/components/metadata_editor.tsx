'use client';

import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';

interface MetadataEditorProps {
  metadata: Record<string, any>;
  on_change: (metadata: Record<string, any>) => void;
  model_id?: string;
}

interface MetadataFieldConfig {
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  description: string;
  options?: string[];
  min?: number;
  max?: number;
}

// Common metadata fields based on OpenAPI schemas
const COMMON_METADATA_FIELDS: Record<string, MetadataFieldConfig> = {
  // Fast-SDXL specific (from OpenAPI schema)
  supports_embeddings: { type: 'boolean', description: 'Support for embeddings/LoRAs' },
  safety_checker_version: { type: 'select', options: ['v1', 'v2'], description: 'The version of the safety checker to use. v1 is the default CompVis safety checker. v2 uses a custom ViT model.' },
  sync_mode: { type: 'boolean', description: 'If true, function waits for image generation before returning. Increases latency but returns image directly.' },
  expand_prompt: { type: 'boolean', description: 'If set to true, the prompt will be expanded with additional prompts' },
  enable_safety_checker: { type: 'boolean', description: 'If set to true, the safety checker will be enabled' },
  default_num_images: { type: 'number', description: 'Default number of images to generate (1-8)', min: 1, max: 8 },
  request_id_support: { type: 'boolean', description: 'Supports request ID for tracking' },
  
  // Image generation
  default_format: { type: 'select', options: ['jpeg', 'png', 'webp'], description: 'Default image format' },
  supports_negative_prompt: { type: 'boolean', description: 'Support negative prompts' },
  supports_seed: { type: 'boolean', description: 'Support seed for reproducibility' },
  min_width: { type: 'number', description: 'Minimum width in pixels' },
  max_width: { type: 'number', description: 'Maximum width in pixels' },
  min_height: { type: 'number', description: 'Minimum height in pixels' },
  max_height: { type: 'number', description: 'Maximum height in pixels' },
  
  // API related (optional - uses fal.ai by default)
  custom_endpoint_url: { type: 'string', description: 'Custom API endpoint URL (if not using fal.ai)' },
  custom_api_version: { type: 'string', description: 'Custom API version (if not using default)' },
  requires_auth: { type: 'boolean', description: 'Requires authentication' },
  api_key_header: { type: 'string', description: 'Custom API key header name' },
  
  // Performance
  queue_enabled: { type: 'boolean', description: 'Uses queue system' },
  avg_generation_time: { type: 'number', description: 'Average generation time (seconds)' },
  max_timeout: { type: 'number', description: 'Maximum timeout (seconds)' },
  
  // Features
  supports_batch: { type: 'boolean', description: 'Supports batch processing' },
  supports_upscale: { type: 'boolean', description: 'Supports upscaling' },
  supports_inpainting: { type: 'boolean', description: 'Supports inpainting' },
  supports_controlnet: { type: 'boolean', description: 'Supports ControlNet' },
  
  // Video specific
  max_duration: { type: 'number', description: 'Maximum video duration (seconds)' },
  fps_options: { type: 'array', description: 'Supported FPS options' },
  codec: { type: 'select', options: ['h264', 'h265', 'vp9'], description: 'Video codec' },
  
  // Audio specific
  sample_rates: { type: 'array', description: 'Supported sample rates' },
  audio_formats: { type: 'array', description: 'Supported audio formats' },
  max_audio_duration: { type: 'number', description: 'Maximum audio duration (seconds)' }
};

export default function MetadataEditor({ metadata, on_change, model_id }: MetadataEditorProps) {
  const [custom_key, set_custom_key] = useState('');
  const [custom_value, set_custom_value] = useState('');
  const [custom_type, set_custom_type] = useState<'string' | 'number' | 'boolean' | 'array' | 'object'>('string');
  const [show_common_fields, set_show_common_fields] = useState(true);
  const [show_custom_fields, set_show_custom_fields] = useState(true);
  
  // Add common field
  const add_common_field = (key: string, field_config: any) => {
    let default_value: any;
    switch (field_config.type) {
      case 'boolean':
        default_value = false;
        break;
      case 'number':
        default_value = 0;
        break;
      case 'array':
        default_value = [];
        break;
      case 'select':
        default_value = field_config.options[0];
        break;
      default:
        default_value = '';
    }
    
    on_change({
      ...metadata,
      [key]: default_value
    });
  };
  
  // Update metadata value
  const update_value = (key: string, value: any, type?: string) => {
    let parsed_value = value;
    
    if (type === 'number') {
      parsed_value = parseFloat(value) || 0;
    } else if (type === 'boolean') {
      parsed_value = value === 'true' || value === true;
    } else if (type === 'array' && typeof value === 'string') {
      try {
        parsed_value = value.split(',').map(v => v.trim()).filter(v => v);
      } catch {
        parsed_value = [];
      }
    }
    
    on_change({
      ...metadata,
      [key]: parsed_value
    });
  };
  
  // Remove metadata field
  const remove_field = (key: string) => {
    const new_metadata = { ...metadata };
    delete new_metadata[key];
    on_change(new_metadata);
  };
  
  // Add custom field
  const add_custom_field = () => {
    if (!custom_key) return;
    
    let value: any = custom_value;
    
    switch (custom_type) {
      case 'number':
        value = parseFloat(custom_value) || 0;
        break;
      case 'boolean':
        value = custom_value.toLowerCase() === 'true';
        break;
      case 'array':
        try {
          value = JSON.parse(custom_value);
          if (!Array.isArray(value)) value = [];
        } catch {
          value = custom_value.split(',').map(v => v.trim()).filter(v => v);
        }
        break;
      case 'object':
        try {
          value = JSON.parse(custom_value);
          if (typeof value !== 'object') value = {};
        } catch {
          value = {};
        }
        break;
    }
    
    on_change({
      ...metadata,
      [custom_key]: value
    });
    
    set_custom_key('');
    set_custom_value('');
    set_custom_type('string');
  };
  
  // Get field type from value
  const get_field_type = (value: any): string => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string';
  };
  
  // Get unused common fields
  const unused_common_fields = Object.entries(COMMON_METADATA_FIELDS).filter(
    ([key]) => !(key in metadata)
  );
  
  return (
    <div className="space-y-4">
      {/* Common Fields Section */}
      <div>
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => set_show_common_fields(!show_common_fields)}
        >
          {show_common_fields ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <h3 className="font-medium">Common Fields</h3>
          <span className="text-sm text-base-content/60">
            ({Object.keys(metadata).filter(key => key in COMMON_METADATA_FIELDS).length} active)
          </span>
        </div>
        
        {show_common_fields && (
          <div className="mt-4 space-y-2">
            {/* Active common fields */}
            {Object.entries(metadata)
              .filter(([key]) => key in COMMON_METADATA_FIELDS)
              .map(([key, value]) => {
                const field_config = COMMON_METADATA_FIELDS[key as keyof typeof COMMON_METADATA_FIELDS];
                
                return (
                  <div key={key} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{key}</span>
                        <span className="text-xs text-base-content/60">({field_config.type})</span>
                      </div>
                      <div className="text-xs text-base-content/60 mt-1">
                        {field_config.description}
                      </div>
                      <div className="mt-2">
                        {field_config.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={value as boolean}
                            onChange={(e) => update_value(key, e.target.checked, 'boolean')}
                          />
                        ) : field_config.type === 'select' ? (
                          <select
                            className="select select-bordered select-sm"
                            value={value as string}
                            onChange={(e) => update_value(key, e.target.value)}
                          >
                            {field_config.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field_config.type === 'number' ? (
                          <input
                            type="number"
                            className="input input-bordered input-sm"
                            value={value as number}
                            onChange={(e) => update_value(key, e.target.value, 'number')}
                            min={(field_config as any).min}
                            max={(field_config as any).max}
                          />
                        ) : field_config.type === 'array' ? (
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={Array.isArray(value) ? value.join(', ') : ''}
                            onChange={(e) => update_value(key, e.target.value, 'array')}
                            placeholder="Comma-separated values"
                          />
                        ) : (
                          <input
                            type="text"
                            className="input input-bordered input-sm w-full"
                            value={value as string}
                            onChange={(e) => update_value(key, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => remove_field(key)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            
            {/* Add common field dropdown */}
            {unused_common_fields.length > 0 && (
              <div className="dropdown">
                <label tabIndex={0} className="btn btn-sm btn-outline gap-2">
                  <Plus className="w-4 h-4" />
                  Add Common Field
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-80 max-h-96 overflow-auto">
                  {unused_common_fields.map(([key, field_config]) => (
                    <li key={key}>
                      <a onClick={() => add_common_field(key, field_config)}>
                        <div className="flex-1">
                          <div className="font-mono text-sm">{key}</div>
                          <div className="text-xs text-base-content/60">
                            {field_config.description}
                          </div>
                        </div>
                        <span className="badge badge-sm">{field_config.type}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="divider"></div>
      
      {/* Custom Fields Section */}
      <div>
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => set_show_custom_fields(!show_custom_fields)}
        >
          {show_custom_fields ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <h3 className="font-medium">Custom Fields</h3>
          <span className="text-sm text-base-content/60">
            ({Object.keys(metadata).filter(key => !(key in COMMON_METADATA_FIELDS)).length} fields)
          </span>
        </div>
        
        {show_custom_fields && (
          <div className="mt-4 space-y-2">
            {/* Custom fields */}
            {Object.entries(metadata)
              .filter(([key]) => !(key in COMMON_METADATA_FIELDS))
              .map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                  <span className="font-mono text-sm flex-1">
                    {key}: {JSON.stringify(value)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove_field(key)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            
            {/* Add custom field */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Key"
                value={custom_key}
                onChange={(e) => set_custom_key(e.target.value)}
              />
              <select
                className="select select-bordered select-sm"
                value={custom_type}
                onChange={(e) => set_custom_type(e.target.value as any)}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
              </select>
              <input
                type="text"
                className="input input-bordered input-sm flex-1"
                placeholder={
                  custom_type === 'array' ? 'Comma-separated or JSON array' :
                  custom_type === 'object' ? 'JSON object' :
                  custom_type === 'boolean' ? 'true or false' :
                  'Value'
                }
                value={custom_value}
                onChange={(e) => set_custom_value(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), add_custom_field())}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={add_custom_field}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Help text */}
      <div className="text-xs text-base-content/60 mt-4">
        <p>Common fields are predefined metadata fields based on OpenAPI schemas.</p>
        <p>Custom fields allow you to add any additional metadata as needed.</p>
      </div>
    </div>
  );
}