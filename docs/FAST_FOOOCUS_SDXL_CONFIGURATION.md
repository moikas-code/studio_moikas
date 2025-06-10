# Fast Fooocus SDXL Model Configuration

## Overview
This document details the configuration for the `fal-ai/fast-fooocus-sdxl` model based on the official fal.ai API schema.

## Model Configuration in Database

### Basic Settings
- **Model ID**: `fal-ai/fast-fooocus-sdxl`
- **Name**: Fast Fooocus SDXL
- **Type**: image
- **Cost**: 0.002 MP per generation
- **Max Images**: 8 (per request)

### Generation Parameters
- **CFG Scale (Guidance Scale)**
  - Default: 2
  - Range: 0-20
  - Controls how closely the model follows the prompt

- **Inference Steps**
  - Default: 8
  - Range: 1-24
  - Number of denoising steps (optimized for speed)

### Size Configuration
- **Mode**: aspect_ratio
- **Supported Aspect Ratios**: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 9:21

### Image Size Presets (stored in metadata)
```json
{
  "square_hd": { "width": 1024, "height": 1024 },
  "square": { "width": 512, "height": 512 },
  "portrait_4_3": { "width": 768, "height": 1024 },
  "portrait_16_9": { "width": 576, "height": 1024 },
  "landscape_4_3": { "width": 1024, "height": 768 },
  "landscape_16_9": { "width": 1024, "height": 576 }
}
```

### Additional Metadata
- **supports_seed**: true - Enables reproducible generation
- **supports_negative_prompt**: true - Allows exclusion prompts
- **enable_safety_checker**: true (default)
- **safety_checker_version**: "v1" (default, also supports "v2")
- **supported_formats**: ["jpeg", "png"]
- **default_format**: "jpeg"
- **default_image_size**: "square_hd"
- **enable_refiner**: true - Improves image quality
- **supports_prompt_expansion**: true - Can enhance prompts automatically
- **supports_embeddings**: true - Supports custom embeddings

## Usage Example

When generating with fast-fooocus-sdxl, the system should:

1. Use the image size presets from metadata when size_mode is aspect_ratio
2. Apply the default CFG scale of 2 unless specified (optimized for speed)
3. Use 8 inference steps by default (much faster than standard SDXL)
4. Enable safety checker by default
5. Enable refiner by default for better quality
6. Support up to 8 images per request

## API Integration

The model should pass these parameters to the fal.ai API:
```json
{
  "prompt": "user prompt",
  "negative_prompt": "optional negative prompt",
  "image_size": "square_hd", // or custom width/height
  "num_inference_steps": 8,
  "guidance_scale": 2,
  "num_images": 1,
  "enable_safety_checker": true,
  "safety_checker_version": "v1",
  "format": "jpeg",
  "enable_refiner": true,
  "seed": 12345 // optional
}
```

## Key Differences from Standard SDXL
- Much faster generation (8 steps vs 25-50)
- Lower default guidance scale (2 vs 7.5)
- Built-in refiner for quality improvement
- Optimized for speed without sacrificing too much quality

## Migration Applied
The configuration is set in the migration file:
`/supabase/migrations/20250110100000_populate_initial_models.sql`

This ensures fast-fooocus-sdxl is properly configured to match the fal.ai API requirements.