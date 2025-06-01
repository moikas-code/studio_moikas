// Shared types
export interface Text_element {
  id: string;
  text: string;
  x: number;
  y: number;
  font_size: number;
  color: string;
  font_family: string;
  font_weight: string;
  rotation: number;
  selected: boolean;
}

export interface Template_background_settings {
  type: 'color' | 'gradient';
  color?: string;
  gradient?: {
    start: string;
    end: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
}

export interface Canvas_state {
  image_base64: string | null;
  background_base64?: string | null;
  text_elements: Text_element[];
  canvas_width: number;
  canvas_height: number;
  zoom: number;
  pan_x: number;
  pan_y: number;
  history: string[];
  history_index: number;
  template_background_settings?: Template_background_settings | null;
}

export interface Viewport_dimensions {
  width: number;
  height: number;
}

// Constants
export const MAX_VIEWPORT_WIDTH = 1000;
export const MAX_VIEWPORT_HEIGHT = 700;
export const MIN_VIEWPORT_WIDTH = 400;
export const MIN_VIEWPORT_HEIGHT = 300;

// Utility functions
export const calculate_viewport_dimensions = (
  canvas_width: number, 
  canvas_height: number
): Viewport_dimensions => {
  if (!canvas_width || !canvas_height) {
    return { width: MIN_VIEWPORT_WIDTH, height: MIN_VIEWPORT_HEIGHT };
  }

  const aspect_ratio = canvas_width / canvas_height;
  
  let viewport_width = canvas_width;
  let viewport_height = canvas_height;
  
  if (viewport_width > MAX_VIEWPORT_WIDTH) {
    viewport_width = MAX_VIEWPORT_WIDTH;
    viewport_height = viewport_width / aspect_ratio;
  }
  
  if (viewport_height > MAX_VIEWPORT_HEIGHT) {
    viewport_height = MAX_VIEWPORT_HEIGHT;
    viewport_width = viewport_height * aspect_ratio;
  }
  
  if (viewport_width < MIN_VIEWPORT_WIDTH) {
    viewport_width = MIN_VIEWPORT_WIDTH;
    viewport_height = viewport_width / aspect_ratio;
  }
  
  if (viewport_height < MIN_VIEWPORT_HEIGHT) {
    viewport_height = MIN_VIEWPORT_HEIGHT;
    viewport_width = viewport_height * aspect_ratio;
  }
  
  return {
    width: Math.round(viewport_width),
    height: Math.round(viewport_height)
  };
};

export const viewport_to_canvas_coords = (
  viewport_x: number,
  viewport_y: number,
  zoom: number,
  pan_x: number,
  pan_y: number
) => {
  const canvas_x = (viewport_x - pan_x) / zoom;
  const canvas_y = (viewport_y - pan_y) / zoom;
  return { x: canvas_x, y: canvas_y };
};

export const create_history_entry = (state: Canvas_state): string => {
  return JSON.stringify({
    image_base64: state.image_base64,
    background_base64: state.background_base64,
    text_elements: state.text_elements,
  });
}; 