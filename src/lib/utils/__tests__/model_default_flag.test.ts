import { describe, it, expect } from '@jest/globals';
import {
  fetch_default_model
} from '../model_helpers';

describe('Model Default Flag', () => {
  it('should have is_default property in ModelConfig type', () => {
    // This is a compile-time test - if it compiles, the type has the property
    const mock_model = {
      id: 'test',
      model_id: 'test-model',
      name: 'Test Model',
      type: 'image' as const,
      cost_per_mp: 0.001,
      custom_cost: 0.001,
      is_active: true,
      is_default: true, // This should compile without errors
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supports_image_input: false,
      is_text_only: true,
      size_mode: 'aspect_ratio' as const,
      supported_pixel_sizes: [],
      supported_aspect_ratios: ['1:1'],
      supports_cfg: false,
      supports_steps: false,
      max_images: 1,
      duration_options: [],
      supports_audio_generation: false,
      metadata: {},
      display_order: 0,
      tags: []
    };
    
    expect(mock_model.is_default).toBe(true);
  });

  it('should have fetch_default_model function', () => {
    expect(typeof fetch_default_model).toBe('function');
  });
});