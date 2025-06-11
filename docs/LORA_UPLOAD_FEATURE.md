# LoRA Upload and Hugging Face Integration

## Overview
The image generator now supports three ways to add custom LoRAs and embeddings:
1. Direct URLs to .safetensors files
2. Hugging Face model IDs (e.g., `ntc-ai/SDXL-LoRA-slider.anime`)
3. Upload .safetensors files directly

## Features Implemented

### 1. Hugging Face Model ID Support
- Users can enter Hugging Face model IDs directly in the format `user/model` or `organization/model`
- The UI automatically detects Hugging Face IDs and shows a package icon
- No need to find the direct download URL - fal.ai handles the resolution

### 2. File Upload
- Users can upload .safetensors files up to 100MB
- Files are uploaded to fal.ai's storage service
- Upload progress is shown with a loading spinner
- The uploaded file URL is automatically added to the LoRA list

### 3. Enhanced UI
- The modal now shows different icons for:
  - 📦 Package icon for Hugging Face IDs
  - 🔗 Link icon for direct URLs
  - 📤 Upload icon for file uploads
- Better placeholder text and help messages
- Real-time validation of inputs

## Implementation Details

### Frontend Changes

#### `/src/components/image_generator/components/settings/embeddings_selector.tsx`
- Added `isValidHuggingFaceId()` function to validate HF model IDs
- Added `handleFileUpload()` function for file uploads
- Updated UI to show appropriate icons based on input type
- Added file input with validation for .safetensors files

### Backend Changes

#### `/src/app/api/embeddings/upload/route.ts`
- New API endpoint for handling file uploads
- Validates file type and size
- Uses fal.ai's storage.upload() API
- Returns the uploaded file URL

### Usage Examples

#### Hugging Face Model ID
```
ntc-ai/SDXL-LoRA-slider.anime
stabilityai/stable-diffusion-xl-base-1.0
```

#### Direct URL
```
https://example.com/my-lora.safetensors
https://huggingface.co/user/model/resolve/main/model.safetensors
```

#### File Upload
1. Click "Add Custom"
2. Select "LoRA" type
3. Click "Choose File"
4. Select a .safetensors file (max 100MB)
5. Wait for upload to complete

## Technical Notes

### File Upload Process
1. User selects file in browser
2. File is sent to `/api/embeddings/upload` endpoint
3. Server validates file and uploads to fal.ai storage
4. Server returns the storage URL
5. URL is added to the LoRA list

### Security Considerations
- File type validation (only .safetensors allowed)
- File size limit (100MB)
- Authentication required for uploads
- Files are stored on fal.ai's secure storage

## Future Enhancements
- Support for other file formats (.ckpt, .pt)
- Drag and drop file upload
- Upload progress percentage
- File management (view/delete uploaded files)
- Caching of popular Hugging Face models