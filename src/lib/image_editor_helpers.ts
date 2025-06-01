/**
 * Image Editor Helper Functions
 * Utilities for image editing operations
 */

export interface Text_overlay_options {
  text: string;
  x: number;
  y: number;
  font_size: number;
  color: string;
  font_family: string;
  font_weight: string;
  rotation?: number;
  stroke_color?: string;
  stroke_width?: number;
}

/**
 * Add text overlay to image using canvas
 */
export async function add_text_overlay_to_image(
  base64_image: string,
  text_overlays: Text_overlay_options[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Draw each text overlay
      text_overlays.forEach((overlay) => {
        ctx.save();
        
        // Move to text position and apply rotation
        ctx.translate(overlay.x, overlay.y);
        if (overlay.rotation) {
          ctx.rotate((overlay.rotation * Math.PI) / 180);
        }

        // Set font properties
        ctx.fillStyle = overlay.color;
        ctx.font = `${overlay.font_weight || 'normal'} ${overlay.font_size}px ${overlay.font_family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add stroke if specified
        if (overlay.stroke_color && overlay.stroke_width) {
          ctx.strokeStyle = overlay.stroke_color;
          ctx.lineWidth = overlay.stroke_width;
          ctx.strokeText(overlay.text, 0, 0);
        }

        // Draw the text
        ctx.fillText(overlay.text, 0, 0);
        
        ctx.restore();
      });

      // Convert to base64
      const result = canvas.toDataURL('image/png');
      resolve(result.split(',')[1]); // Remove data:image/png;base64, prefix
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Resize image to specific dimensions
 */
export async function resize_image(
  base64_image: string,
  width: number,
  height: number,
  maintain_aspect_ratio: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let target_width = width;
      let target_height = height;

      if (maintain_aspect_ratio) {
        const aspect_ratio = img.width / img.height;
        if (width / height > aspect_ratio) {
          target_width = height * aspect_ratio;
        } else {
          target_height = width / aspect_ratio;
        }
      }

      canvas.width = target_width;
      canvas.height = target_height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, target_width, target_height);

      const result = canvas.toDataURL('image/png');
      resolve(result.split(',')[1]);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Apply filters to image
 */
export async function apply_image_filter(
  base64_image: string,
  filter_type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale',
  intensity: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply CSS filter based on type
      let filter_string = '';
      switch (filter_type) {
        case 'brightness':
          filter_string = `brightness(${intensity})`;
          break;
        case 'contrast':
          filter_string = `contrast(${intensity})`;
          break;
        case 'saturation':
          filter_string = `saturate(${intensity})`;
          break;
        case 'blur':
          filter_string = `blur(${intensity}px)`;
          break;
        case 'sepia':
          filter_string = `sepia(${intensity})`;
          break;
        case 'grayscale':
          filter_string = `grayscale(${intensity})`;
          break;
      }

      ctx.filter = filter_string;
      ctx.drawImage(img, 0, 0);

      const result = canvas.toDataURL('image/png');
      resolve(result.split(',')[1]);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Rotate image by specified degrees
 */
export async function rotate_image(
  base64_image: string,
  degrees: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const radians = (degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));

      // Calculate new canvas dimensions after rotation
      const new_width = img.width * cos + img.height * sin;
      const new_height = img.width * sin + img.height * cos;

      canvas.width = new_width;
      canvas.height = new_height;

      // Move to center and rotate
      ctx.translate(new_width / 2, new_height / 2);
      ctx.rotate(radians);

      // Draw image centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const result = canvas.toDataURL('image/png');
      resolve(result.split(',')[1]);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Crop image to specified rectangle
 */
export async function crop_image(
  base64_image: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw cropped portion
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      const result = canvas.toDataURL('image/png');
      resolve(result.split(',')[1]);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Convert image to different formats
 */
export async function convert_image_format(
  base64_image: string,
  format: 'png' | 'jpeg' | 'webp',
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const mime_type = `image/${format}`;
      const result = canvas.toDataURL(mime_type, quality);
      resolve(result.split(',')[1]);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Get image metadata
 */
export async function get_image_metadata(base64_image: string): Promise<{
  width: number;
  height: number;
  aspect_ratio: number;
  size_kb: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const size_kb = Math.round((base64_image.length * 3) / 4 / 1024); // Approximate size in KB
      
      resolve({
        width: img.width,
        height: img.height,
        aspect_ratio: img.width / img.height,
        size_kb,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = `data:image/png;base64,${base64_image}`;
  });
}

/**
 * Validate image file type and size
 */
export function validate_image_file(file: File): {
  valid: boolean;
  error?: string;
} {
  const max_size_mb = 10;
  const allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowed_types.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.',
    };
  }

  if (file.size > max_size_mb * 1024 * 1024) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${max_size_mb}MB.`,
    };
  }

  return { valid: true };
} 