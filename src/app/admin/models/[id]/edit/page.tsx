'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ModelForm from '../../components/model_form';
import type { ModelConfig } from '@/types/models';

export default function EditModelPage() {
  const params = useParams();
  const [model, set_model] = useState<ModelConfig | null>(null);
  const [loading, set_loading] = useState(true);
  
  useEffect(() => {
    const fetch_model = async () => {
      try {
        const response = await fetch(`/api/admin/models/${params.id}`);
        const data = await response.json();
        
        console.log('Model API response:', data); // Debug log
        
        if (data.success && data.data) {
          // Handle api_success wrapper
          set_model(data.data);
        } else if (data.model_id) {
          // Handle direct model data
          set_model(data);
        } else {
          toast.error(data.error || 'Failed to fetch model');
        }
      } catch (error) {
        toast.error('Failed to fetch model');
        console.error(error);
      } finally {
        set_loading(false);
      }
    };
    
    if (params.id) {
      fetch_model();
    }
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }
  
  if (!model) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="alert alert-error">
          <span>Model not found</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Model</h1>
        <p className="text-base-content/70">
          Update configuration for {model.name}
        </p>
      </div>
      
      <ModelForm model={model} />
    </div>
  );
}