# Model Default Flag Implementation

## Overview
This document summarizes the implementation of the `is_default` flag for the model management system, which allows admins to select which model is the default for each type (image, video, audio, text).

## Database Changes

### 1. Migration File
- **File**: `/supabase/migrations/20250110000000_add_model_management.sql`
- Added `is_default BOOLEAN DEFAULT false` column to the models table
- Created index on `is_default` for performance
- Created trigger function `ensure_single_default_per_type()` that automatically unsets other defaults when setting a new one
- Added trigger `enforce_single_default_model` to enforce single default per type

### 2. Initial Data
- **File**: `/supabase/migrations/20250110100000_populate_initial_models.sql`
- Set default models:
  - **Image**: SANA Base (`fal-ai/sana`)
  - **Video**: HunyuanVideo (`fal-ai/hunyuan-video`)
  - **Audio**: ChatterboxHD TTS (`resemble-ai/chatterboxhd/text-to-speech`)

## TypeScript Types

### Updated Types
- **File**: `/src/types/models.ts`
- Added `is_default: boolean` to `ModelConfig` interface
- Added `is_default?: boolean` to `ModelFormData` interface

## API Endpoints

### Updated Endpoints
1. **GET /api/admin/models** - Returns models with `is_default` flag
2. **POST /api/admin/models** - Accepts `is_default` in creation
3. **PUT /api/admin/models/[id]** - Accepts `is_default` in updates

### Validation Schemas
- Added `is_default: z.boolean().optional()` to both create and update schemas

## Utility Functions

### New Functions in `/src/lib/utils/model_helpers.ts`
```typescript
fetch_default_model(type: 'image' | 'video' | 'audio' | 'text'): Promise<ModelConfig | null>
```
- Fetches the default model for a specific type
- Returns null if no default is set

## UI Components

### 1. Model Form Component
- **File**: `/src/app/admin/models/components/model_form.tsx`
- Added checkbox for setting model as default
- Shows dynamic label: "Default Model for {type}"
- Displays badge when model is marked as default

### 2. Model List Page
- **File**: `/src/app/admin/models/page.tsx`
- Shows "Default" badge next to model name in the list
- Shows "Default" badge in model details modal

## How It Works

1. **Database Level**:
   - The trigger ensures only one model per type can be default
   - When setting `is_default = true`, all other models of the same type are automatically set to `false`

2. **API Level**:
   - Admins can toggle the default flag when creating or editing models
   - The database trigger handles the uniqueness constraint

3. **UI Level**:
   - Checkbox in model form to set as default
   - Visual indicators (badges) show which models are defaults

## Usage Example

```typescript
// Fetch the default image model
const default_image_model = await fetch_default_model('image');

// Use it in image generation
if (default_image_model) {
  const cost = calculate_model_cost_mp(default_image_model);
  // ... use the model
}
```

## Benefits

1. **Simplified Model Selection**: Users get a sensible default without having to choose
2. **Easy Management**: Admins can quickly change defaults through the UI
3. **Type Safety**: TypeScript ensures proper usage of the flag
4. **Data Integrity**: Database trigger prevents multiple defaults per type

## Testing

Run the following SQL to verify the trigger works:
```sql
-- This should automatically unset the previous default
UPDATE models 
SET is_default = true 
WHERE model_id = 'fal-ai/flux/schnell' 
AND type = 'image';

-- Check that only one image model is default
SELECT model_id, name, is_default 
FROM models 
WHERE type = 'image' 
AND is_default = true;
```