# Tools Database Models Integration

## Overview
Updated the tools in `/src/app/tools/` to use models from the database instead of hardcoded configurations.

## Changes Made

### 1. Created User-Facing Models API (`/api/models`)
- Fetches active models from database based on model type
- Filters models based on user plan (admin users get all models)
- Calculates effective cost in MP based on user plan
- Returns models with their full configuration

### 2. Updated Image Generator (`/tools/create`)
- **Removed**: Hardcoded model lists and cost calculations
- **Added**: Dynamic model fetching from database
- **Added**: Loading state while fetching models
- **Added**: Error state if no models available
- **Uses**: Model metadata to determine feature support (CFG, steps, embeddings, etc.)
- **Smart defaults**: Automatically selects default model or first available

### 3. Created Video Models Hook (`/tools/video-effects`)
- **Created**: `use_video_models.ts` hook for fetching video models
- **Updated**: Video effects page to use database models
- **Features**: Duration options and audio support from model config

### 4. Created Audio Models Hook (`/tools/audio`)
- **Created**: `use_audio_models.ts` hook for fetching audio models
- **Features**: Voice cloning support and voice presets from metadata

### 5. Updated Generate API (`/api/generate`)
- **Changed**: Now fetches model configuration from database
- **Validates**: Model exists and is active
- **Removed**: Dependency on hardcoded model configurations

## Benefits

1. **Dynamic Model Management**: Admins can add/remove/update models without code changes
2. **Plan-Based Access**: Models can be restricted by user plan
3. **Cost Management**: Costs are centralized in the database
4. **Feature Flags**: Model capabilities are stored in database metadata
5. **Default Models**: Admin can set default models for each type

## Model Configuration Used

The tools now use these database fields:
- `model_id`: API identifier
- `name`: Display name
- `type`: image/video/audio/text
- `cost_per_mp` & `custom_cost`: Pricing
- `is_active`: Enable/disable models
- `is_default`: Default selection
- `supports_cfg/supports_steps`: Generation parameters
- `metadata`: Additional features (embeddings, styles, etc.)
- `duration_options`: Video duration settings
- `supports_audio_generation`: Audio in video generation

## Testing Checklist

- [ ] Image Generator loads models from database
- [ ] Default image model is selected automatically
- [ ] Model costs display correctly based on user plan
- [ ] Admin users see 0 MP cost
- [ ] Video effects tool loads video models
- [ ] Audio tool loads audio models
- [ ] Generation API validates models from database
- [ ] Inactive models are not shown to users
- [ ] Model-specific features work (SANA styles, SDXL embeddings)