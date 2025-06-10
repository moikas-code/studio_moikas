'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye
} from 'lucide-react';
import type { 
  ModelConfig, 
  ModelFilters,
  ModelType
} from '@/types/models';
import { 
  MODEL_TYPE_OPTIONS, 
  format_model_type,
  get_model_cost_in_mp 
} from '@/types/models';

function ModelManagementPageContent() {
  const router = useRouter();
  const [models, set_models] = useState<ModelConfig[]>([]);
  const [loading, set_loading] = useState(true);
  const [total, set_total] = useState(0);
  const [page, set_page] = useState(1);
  const [limit] = useState(20);
  
  // Filters
  const [filters, set_filters] = useState<ModelFilters>({});
  const [search_term, set_search_term] = useState('');
  const [show_filters, set_show_filters] = useState(false);
  
  // Selected model for viewing details
  const [selected_model, set_selected_model] = useState<ModelConfig | null>(null);
  
  // Fetch models
  const fetch_models = useCallback(async () => {
    try {
      set_loading(true);
      
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
      if (filters.supports_image_input !== undefined) {
        params.append('supports_image_input', filters.supports_image_input.toString());
      }
      if (search_term) params.append('search', search_term);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/admin/models?${params}`);
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (data.success && data.data) {
        // Handle the response structure from api_success
        set_models(data.data.models || []);
        set_total(data.data.total || 0);
      } else if (data.models) {
        // Handle direct response
        set_models(data.models || []);
        set_total(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to fetch models');
        set_models([]);
      }
    } catch (error) {
      toast.error('Failed to fetch models');
      console.error('Fetch models error:', error);
      set_models([]); // Ensure models is never undefined
    } finally {
      set_loading(false);
    }
  }, [page, limit, filters, search_term]);
  
  // Toggle model active status
  const toggle_model_status = async (model_id: string) => {
    try {
      const response = await fetch(`/api/admin/models/${model_id}`, {
        method: 'PATCH'
      });
      const data = await response.json();
      
      if (data.success || data.data) {
        toast.success('Model status updated');
        fetch_models();
      } else {
        toast.error(data.error || 'Failed to update model');
      }
    } catch (error) {
      toast.error('Failed to update model');
      console.error(error);
    }
  };
  
  // Delete model
  const delete_model = async (model_id: string, model_name: string) => {
    if (!confirm(`Are you sure you want to delete "${model_name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/models/${model_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error_data = await response.json();
        toast.error(error_data.error || `Failed to delete model: ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      // The api_success function returns { success: true, data: {...} }
      if (data.success) {
        toast.success(data.data?.deleted_model ? `Model "${data.data.deleted_model}" deleted` : 'Model deleted');
        fetch_models();
      } else {
        toast.error(data.error || 'Failed to delete model');
      }
    } catch (error) {
      toast.error('Failed to delete model');
      console.error(error);
    }
  };
  
  // Copy model ID
  const copy_model_id = (model_id: string) => {
    navigator.clipboard.writeText(model_id);
    toast.success('Model ID copied to clipboard');
  };
  
  useEffect(() => {
    fetch_models();
  }, [fetch_models]);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Model Management</h1>
        <p className="text-base-content/70">
          Configure AI models available in the platform
        </p>
      </div>
      
      {/* Action Bar */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search models..."
                  className="input input-bordered w-full pl-10"
                  value={search_term}
                  onChange={(e) => set_search_term(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => set_show_filters(!show_filters)}
              className="btn btn-ghost gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {show_filters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Add Model Button */}
            <button
              onClick={() => router.push('/admin/models/new')}
              className="btn btn-primary gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>
          </div>
          
          {/* Filters */}
          {show_filters && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="label">
                    <span className="label-text">Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filters.type || ''}
                    onChange={(e) => set_filters({
                      ...filters,
                      type: e.target.value as ModelType || undefined
                    })}
                  >
                    <option value="">All Types</option>
                    {MODEL_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                    onChange={(e) => set_filters({
                      ...filters,
                      is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                
                {/* Image Input Filter */}
                <div>
                  <label className="label">
                    <span className="label-text">Image Input</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={filters.supports_image_input === undefined ? '' : filters.supports_image_input.toString()}
                    onChange={(e) => set_filters({
                      ...filters,
                      supports_image_input: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                  >
                    <option value="">All</option>
                    <option value="true">Supports Image Input</option>
                    <option value="false">Text Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Models Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra table-xs sm:table-sm lg:table-md">
              <thead>
                <tr>
                  <th className="w-20">Status</th>
                  <th className="min-w-[200px]">Model</th>
                  <th className="w-24">Type</th>
                  <th className="w-32">Cost (MP)</th>
                  <th className="min-w-[150px]">Features</th>
                  <th className="w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <span className="loading loading-spinner loading-lg"></span>
                    </td>
                  </tr>
                ) : !models || models.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      No models found
                    </td>
                  </tr>
                ) : (
                  models && models.map(model => (
                    <tr key={model.id}>
                      <td>
                        <button
                          onClick={() => toggle_model_status(model.id)}
                          className="btn btn-ghost btn-sm"
                          title={model.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {model.is_active ? (
                            <ToggleRight className="w-5 h-5 text-success" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-base-content/50" />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="min-w-0">
                          <div className="font-semibold flex items-center gap-1 flex-wrap">
                            <span className="truncate">{model.name}</span>
                            {model.is_default && (
                              <span className="badge badge-primary badge-xs">Default</span>
                            )}
                          </div>
                          <div className="text-xs text-base-content/50 flex items-center gap-1">
                            <code className="truncate max-w-[150px] sm:max-w-[200px]">{model.model_id}</code>
                            <button
                              onClick={() => copy_model_id(model.model_id)}
                              className="btn btn-ghost btn-xs p-0 h-auto min-h-0"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm whitespace-nowrap">
                          {model.type === 'image' ? 'Image' : 
                           model.type === 'video' ? 'Video' :
                           model.type === 'audio' ? 'Audio' : 
                           model.type === 'text' ? 'Text' : model.type}
                        </span>
                      </td>
                      <td>
                        <div className="text-right">
                          <div className="font-mono">
                            {get_model_cost_in_mp(model)} MP
                          </div>
                          <div className="text-xs text-base-content/50">
                            ${model.custom_cost}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {model.supports_image_input && (
                            <span className="badge badge-xs badge-primary">Img</span>
                          )}
                          {model.supports_cfg && (
                            <span className="badge badge-xs badge-secondary">CFG</span>
                          )}
                          {model.supports_steps && (
                            <span className="badge badge-xs badge-secondary">Steps</span>
                          )}
                          {model.type === 'video' && model.supports_audio_generation && (
                            <span className="badge badge-xs badge-accent">Audio</span>
                          )}
                          {model.supports_both_size_modes === true && (
                            <span className="badge badge-xs badge-info">Flex</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => set_selected_model(model)}
                            className="btn btn-ghost btn-xs"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/models/${model.id}/edit`)}
                            className="btn btn-ghost btn-xs"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => delete_model(model.id, model.name)}
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center p-4">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={page === 1}
                  onClick={() => set_page(page - 1)}
                >
                  «
                </button>
                <button className="join-item btn">
                  Page {page} of {Math.ceil(total / limit)}
                </button>
                <button
                  className="join-item btn"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => set_page(page + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Model Details Modal */}
      {selected_model && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {selected_model.name} Details
            </h3>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Model ID:</div>
                  <div><code>{selected_model.model_id}</code></div>
                  <div>Type:</div>
                  <div>{format_model_type(selected_model.type)}</div>
                  <div>Cost:</div>
                  <div>{get_model_cost_in_mp(selected_model)} MP (${selected_model.custom_cost})</div>
                  <div>Status:</div>
                  <div>
                    <span className={`badge ${selected_model.is_active ? 'badge-success' : 'badge-ghost'}`}>
                      {selected_model.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {selected_model.is_default && (
                      <span className="badge badge-primary ml-2">Default</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Size Configuration */}
              <div>
                <h4 className="font-semibold mb-2">Size Configuration</h4>
                <div className="text-sm">
                  <div>Primary Mode: {selected_model.size_mode}</div>
                  {selected_model.supports_both_size_modes && (
                    <div className="text-success font-semibold">✓ Supports Both Size Modes</div>
                  )}
                  {(selected_model.size_mode === 'aspect_ratio' || selected_model.supports_both_size_modes) && (
                    <div>Aspect Ratios: {selected_model.supported_aspect_ratios?.join(', ') || 'None'}</div>
                  )}
                  {(selected_model.size_mode === 'pixel' || selected_model.supports_both_size_modes) && (
                    <div>
                      Pixel Sizes:
                      <ul className="ml-4">
                        {selected_model.supported_pixel_sizes?.map((size, idx) => (
                          <li key={idx}>
                            {size.width}x{size.height} {size.label && `(${size.label})`}
                          </li>
                        )) || <li>None</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Generation Parameters */}
              {(selected_model.supports_cfg || selected_model.supports_steps) && (
                <div>
                  <h4 className="font-semibold mb-2">Generation Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selected_model.supports_cfg && (
                      <>
                        <div>CFG Scale:</div>
                        <div>
                          Default: {selected_model.default_cfg}, 
                          Max: {selected_model.max_cfg}
                        </div>
                      </>
                    )}
                    {selected_model.supports_steps && (
                      <>
                        <div>Inference Steps:</div>
                        <div>
                          Default: {selected_model.default_steps}, 
                          Max: {selected_model.max_steps}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Video Specific */}
              {selected_model.type === 'video' && (
                <div>
                  <h4 className="font-semibold mb-2">Video Configuration</h4>
                  <div className="text-sm">
                    <div>Duration Options: {selected_model.duration_options?.join(', ') || 'None'} seconds</div>
                    <div>Audio Generation: {selected_model.supports_audio_generation ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              {selected_model.metadata && Object.keys(selected_model.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Metadata</h4>
                  <pre className="bg-base-200 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(selected_model.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => set_selected_model(null)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => set_selected_model(null)} />
        </div>
      )}
    </div>
  );
}

export default function ModelManagementPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    }>
      <ModelManagementPageContent />
    </Suspense>
  );
}
