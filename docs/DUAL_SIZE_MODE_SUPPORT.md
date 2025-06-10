# Dual Size Mode Support for AI Models

## Overview
This feature allows AI models to support both aspect ratio presets and custom pixel size inputs, giving users maximum flexibility in choosing image dimensions.

## Database Implementation

### New Column
- **Column**: `supports_both_size_modes` (BOOLEAN, default: false)
- **Purpose**: Indicates whether a model can accept both aspect ratio presets and custom width/height values

### How It Works
1. **Primary Mode**: The `size_mode` column still defines the primary/default mode
2. **Dual Support**: When `supports_both_size_modes = true`, the model accepts both:
   - Aspect ratio presets (e.g., "16:9", "1:1", "9:16")
   - Custom pixel dimensions (e.g., width: 1024, height: 768)

## Models with Dual Support
The following models support both size modes:
- fast-fooocus-sdxl
- All FLUX models (dev, pro, schnell)
- All SANA models
- Stable Diffusion XL Turbo

## UI Behavior

### Admin Model Form
When editing a model:
1. A checkbox "Supports Both Size Modes" is displayed
2. When checked:
   - Both "Supported Pixel Sizes" and "Supported Aspect Ratios" sections appear
   - Admin can configure presets for both modes
3. When unchecked:
   - Only the section matching the primary `size_mode` is shown

### User Image Generation
For models with dual support:
1. Users see a toggle or tabs to switch between:
   - **Aspect Ratio Mode**: Quick presets like "Square", "Landscape", "Portrait"
   - **Custom Size Mode**: Width and height input fields
2. The default view shows the primary mode defined by `size_mode`

## Common Pixel Size Presets
When dual mode is enabled, these presets are automatically added:
- 1024×1024 (1:1 Square HD)
- 1152×896 (9:7 Landscape)
- 896×1152 (7:9 Portrait)
- 1216×832 (3:2 Landscape)
- 832×1216 (2:3 Portrait)
- 1344×768 (7:4 Wide)
- 768×1344 (4:7 Tall)
- 1536×640 (12:5 Ultrawide)
- 640×1536 (5:12 Supertall)

## API Integration
When calling the model API:
- If aspect ratio is provided: Convert to appropriate width/height
- If width/height are provided: Use directly
- The model's metadata can specify max dimensions or constraints

## Benefits
1. **User Flexibility**: Choose between quick presets or precise dimensions
2. **Backward Compatibility**: Existing models work unchanged
3. **Progressive Enhancement**: Models can be upgraded to dual support without breaking changes
4. **Better UX**: Users can work in their preferred mode

## Migration
The migration file `/supabase/migrations/20250110300000_add_supports_both_size_modes_column.sql`:
1. Adds the new column
2. Enables dual support for compatible models
3. Populates default pixel size presets