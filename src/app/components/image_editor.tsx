"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { MpContext } from "../context/mp_context";
import {
  Upload,
  Type,
  Download,
  RotateCw,
  Palette,
  Layers,
  Move,
  Save,
  Undo,
  Redo,
  Trash2,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MousePointer,
  Grid,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { 
  templates, 
  template_categories, 
  get_templates_by_category, 
  get_categories_with_counts,
  create_template_background,
  type Template,
  type Template_text_element 
} from "@/lib/image_editor_templates";

// Hooks and utilities
import { use_canvas_state } from "@/hooks/use_canvas_state";
import { use_zoom_pan } from "@/hooks/use_zoom_pan";
import { calculate_viewport_dimensions } from "@/lib/image_editor_utils";

// Components
import { Image_editor_header } from "./image_editor/image_editor_header";
import { Image_editor_toolbar } from "./image_editor/image_editor_toolbar";

interface Text_element {
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

interface Canvas_state {
  image_base64: string | null;
  text_elements: Text_element[];
  canvas_width: number;
  canvas_height: number;
  zoom: number;
  pan_x: number;
  pan_y: number;
  history: string[];
  history_index: number;
}

export default function Image_editor() {
  const { refresh_mp, plan } = useContext(MpContext);
  
  // Use custom hooks
  const {
    canvas_state,
    set_canvas_state,
    update_canvas_state,
    update_canvas_state_with_history,
    save_to_history,
  } = use_canvas_state();

  const {
    zoom_in,
    zoom_out,
    reset_zoom,
    handle_wheel_zoom,
  } = use_zoom_pan(canvas_state, update_canvas_state);

  // UI state
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [active_tool, set_active_tool] = useState<'select' | 'text' | 'move' | 'pan'>('select');
  const [selected_text_id, set_selected_text_id] = useState<string | null>(null);
  const [show_text_panel, set_show_text_panel] = useState(false);
  const [show_templates, set_show_templates] = useState(false);
  const [selected_category, set_selected_category] = useState('youtube');
  const [show_template_modal, set_show_template_modal] = useState(false);
  const [pending_template, set_pending_template] = useState<Template | null>(null);
  const [drag_over, set_drag_over] = useState(false);
  const [is_dragging_text, set_is_dragging_text] = useState(false);
  const [is_panning, set_is_panning] = useState(false);
  const [drag_offset, set_drag_offset] = useState({ x: 0, y: 0 });
  const [last_pan_position, set_last_pan_position] = useState({ x: 0, y: 0 });
  const [show_grid, set_show_grid] = useState(false);
  
  // Layer reordering state
  const [dragging_layer_index, set_dragging_layer_index] = useState<number | null>(null);
  const [drag_over_layer_index, set_drag_over_layer_index] = useState<number | null>(null);

  // Text editing state
  const [text_input, set_text_input] = useState("");
  const [text_color, set_text_color] = useState("#ffffff");
  const [text_size, set_text_size] = useState(48);
  const [text_font, set_text_font] = useState("Arial");
  const [text_weight, set_text_weight] = useState("normal");

  // Refs
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const viewport_ref = useRef<HTMLDivElement>(null);
  const file_input_ref = useRef<HTMLInputElement>(null);

  // State for tracking viewport dimensions
  const [viewport_dimensions_state, set_viewport_dimensions] = useState(() => 
    calculate_viewport_dimensions(canvas_state.canvas_width, canvas_state.canvas_height)
  );

  // Use the state-tracked viewport dimensions
  const viewport_dimensions = viewport_dimensions_state;

  // Font options
  const font_options = [
    { value: "Arial", label: "Arial" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
  ];

  const weight_options = [
    { value: "normal", label: "Normal" },
    { value: "bold", label: "Bold" },
    { value: "lighter", label: "Light" },
  ];

  // Convert viewport coordinates to canvas coordinates
  const viewport_to_canvas = useCallback((viewport_x: number, viewport_y: number) => {
    const canvas_x = (viewport_x - canvas_state.pan_x) / canvas_state.zoom;
    const canvas_y = (viewport_y - canvas_state.pan_y) / canvas_state.zoom;
    return { x: canvas_x, y: canvas_y };
  }, [canvas_state.zoom, canvas_state.pan_x, canvas_state.pan_y]);

  // Resize/reposition an image to fit template dimensions
  const resize_image_to_template = useCallback(async (image_base64: string, template: Template): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(image_base64);
        return;
      }

      // Set canvas to template dimensions
      canvas.width = template.width;
      canvas.height = template.height;

      // Create image element
      const img = new window.Image();
      img.onload = () => {
        // Calculate scaling to fit within template while maintaining aspect ratio
        const scale_to_fit = Math.min(
          template.width / img.width,
          template.height / img.height
        );

        const scaled_width = img.width * scale_to_fit;
        const scaled_height = img.height * scale_to_fit;

        // Center the image within the template
        const x = (template.width - scaled_width) / 2;
        const y = (template.height - scaled_height) / 2;

        // Clear canvas with template background if it exists
        if (template.background_gradient) {
          const gradient = ctx.createLinearGradient(
            template.background_gradient.direction === 'horizontal' ? 0 : 
            template.background_gradient.direction === 'diagonal' ? 0 : 
            template.width / 2,
            template.background_gradient.direction === 'vertical' ? 0 : 
            template.background_gradient.direction === 'diagonal' ? 0 : 
            template.height / 2,
            template.background_gradient.direction === 'horizontal' ? template.width : 
            template.background_gradient.direction === 'diagonal' ? template.width : 
            template.width / 2,
            template.background_gradient.direction === 'vertical' ? template.height : 
            template.background_gradient.direction === 'diagonal' ? template.height : 
            template.height / 2
          );
          gradient.addColorStop(0, template.background_gradient.start);
          gradient.addColorStop(1, template.background_gradient.end);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = template.background_color;
        }
        ctx.fillRect(0, 0, template.width, template.height);

        // Draw the resized image
        ctx.drawImage(img, x, y, scaled_width, scaled_height);

        resolve(canvas.toDataURL().split(',')[1]); // Return base64 without prefix
      };
      img.onerror = () => resolve(image_base64); // Return original if error
      img.src = `data:image/png;base64,${image_base64}`;
    });
  }, []);

  // Store current selected template for upload handling
  const [current_template, set_current_template] = useState<Template | null>(null);

  // Apply template with specified background choice
  const apply_template_with_background = useCallback(async (template: Template, use_template_background: boolean) => {
    // Convert template text elements to our format
    const text_elements: Text_element[] = template.text_elements.map((element, index) => ({
      id: `template_${Date.now()}_${index}`,
      text: element.text,
      x: element.x,
      y: element.y,
      font_size: element.font_size,
      color: element.color,
      font_family: element.font_family,
      font_weight: element.font_weight,
      rotation: element.rotation,
      selected: false,
    }));

    // Calculate optimal zoom to fit template nicely in the dynamic viewport
    const template_viewport = calculate_viewport_dimensions(template.width, template.height);
    
    // Fit the template with some padding (90% of viewport)
    const initial_zoom = Math.min(
      (template_viewport.width * 0.9) / template.width,
      (template_viewport.height * 0.9) / template.height,
      1 // Don't zoom in beyond actual size
    );

    // Determine what background to use
    let final_background = canvas_state.image_base64;
    
    if (use_template_background || !canvas_state.image_base64) {
      final_background = create_template_background(template);
    } else {
      // Keep existing image but resize/position it to fit template
      final_background = await resize_image_to_template(canvas_state.image_base64, template);
    }

    const new_state = {
      ...canvas_state,
      image_base64: final_background,
      canvas_width: template.width,
      canvas_height: template.height,
      text_elements,
      zoom: initial_zoom,
      pan_x: (template_viewport.width - template.width * initial_zoom) / 2,
      pan_y: (template_viewport.height - template.height * initial_zoom) / 2,
    };

    set_canvas_state(save_to_history(new_state));
    set_current_template(template); // Store the current template for future uploads
    set_show_templates(false);
    set_selected_text_id(null);
    // Draw canvas with the template's viewport dimensions
    draw_canvas(new_state, template_viewport);

    track("Image Editor Template Loaded", {
      template_id: template.id,
      template_name: template.name,
      category: template.category,
      has_existing_image: !!canvas_state.image_base64,
      used_template_background: use_template_background,
      plan: plan || "unknown",
    });
  }, [canvas_state, save_to_history, plan, calculate_viewport_dimensions, resize_image_to_template]);

  // Check if user has disabled template confirmations
  const get_skip_template_confirmation = useCallback(() => {
    return localStorage.getItem('image_editor_skip_template_confirmation') === 'true';
  }, []);

  // Set skip template confirmation preference
  const set_skip_template_confirmation = useCallback((skip: boolean) => {
    localStorage.setItem('image_editor_skip_template_confirmation', skip.toString());
  }, []);

  // Handle template modal confirmation
  const handle_template_confirmation = useCallback((keep_image: boolean, dont_show_again: boolean) => {
    if (dont_show_again) {
      set_skip_template_confirmation(true);
    }
    
    if (pending_template) {
      apply_template_with_background(pending_template, !keep_image);
    }
    
    set_show_template_modal(false);
    set_pending_template(null);
  }, [pending_template, apply_template_with_background, set_skip_template_confirmation]);

  // Load template (with confirmation if image exists)
  const load_template = useCallback((template: Template) => {
    // If there's an existing image and user hasn't disabled confirmations
    if (canvas_state.image_base64 && !get_skip_template_confirmation()) {
      set_pending_template(template);
      set_show_template_modal(true);
    } else {
      // No existing image: use template background
      // Existing image but confirmations disabled: keep the image (since checkbox says "always keep my image")
      const use_template_background = !canvas_state.image_base64;
      apply_template_with_background(template, use_template_background);
    }
  }, [canvas_state.image_base64, apply_template_with_background, get_skip_template_confirmation]);

  // Process uploaded file
  const process_file = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      set_error_message("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      set_error_message("File size too large. Please choose an image under 10MB");
      return;
    }

    set_is_loading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const img = new window.Image();
      img.onload = async () => {
        const uploaded_image_base64 = base64.split(',')[1]; // Remove data:image/... prefix
        
        // Check if we have an active template (has text elements or current_template is set)
        const has_template = canvas_state.text_elements.length > 0 || current_template;
        
        if (has_template && current_template) {
          // Template is active - resize image to fit template and preserve template structure
          const resized_image = await resize_image_to_template(uploaded_image_base64, current_template);
          
          const new_state = {
            ...canvas_state,
            image_base64: resized_image,
            // Keep existing template dimensions and text elements
          };
          set_canvas_state(save_to_history(new_state));
          draw_canvas(new_state);
        } else if (has_template && !current_template) {
          // We have text elements but no current_template reference
          // This means a template was applied but we lost the reference
          // In this case, just replace the image but keep text elements and dimensions
          const new_state = {
            ...canvas_state,
            image_base64: uploaded_image_base64,
            // Keep existing canvas dimensions and text elements
          };
          set_canvas_state(save_to_history(new_state));
          draw_canvas(new_state);
        } else {
          // No template active - treat as new image upload
          // Calculate viewport dimensions for the uploaded image
          const image_viewport = calculate_viewport_dimensions(img.width, img.height);
          
          // Auto-fit zoom to viewport with padding (90% of viewport)
          const initial_zoom = Math.min(
            (image_viewport.width * 0.9) / img.width,
            (image_viewport.height * 0.9) / img.height,
            1 // Don't zoom in beyond 100%
          );

          const new_state = {
            ...canvas_state,
            image_base64: uploaded_image_base64,
            canvas_width: img.width,
            canvas_height: img.height,
            text_elements: [],
            zoom: initial_zoom,
            pan_x: (image_viewport.width - img.width * initial_zoom) / 2,
            pan_y: (image_viewport.height - img.height * initial_zoom) / 2,
          };
          set_canvas_state(save_to_history(new_state));
          draw_canvas(new_state);
        }
        
        set_is_loading(false);
        set_error_message(null);
      };
      img.onerror = () => {
        set_error_message("Failed to load image");
        set_is_loading(false);
      };
      img.src = base64;
    };
    reader.onerror = () => {
      set_error_message("Failed to read file");
      set_is_loading(false);
    };
    reader.readAsDataURL(file);
  }, [canvas_state, save_to_history, calculate_viewport_dimensions, current_template, resize_image_to_template]);

  // Handle file upload
  const handle_file_upload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    process_file(file);
  }, [process_file]);

  // Handle drag and drop
  const handle_drag_enter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_drag_over(true);
  }, []);

  const handle_drag_leave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_drag_over(false);
  }, []);

  const handle_drag_over = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handle_drop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_drag_over(false);

    const files = Array.from(e.dataTransfer.files);
    const image_file = files.find(file => file.type.startsWith('image/'));
    
    if (image_file) {
      process_file(image_file);
    } else {
      set_error_message("Please drop an image file");
    }
  }, [process_file]);

  // Cache the loaded image to avoid reloading
  const cached_image = useRef<HTMLImageElement | null>(null);
  const cached_image_base64 = useRef<string | null>(null);

  // Draw canvas with optional custom viewport dimensions
  const draw_canvas = useCallback((state: Canvas_state, custom_viewport_dimensions?: { width: number; height: number }) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use custom dimensions if provided, otherwise calculate based on state
    const viewport_dims = custom_viewport_dimensions || calculate_viewport_dimensions(state.canvas_width, state.canvas_height);
    const current_viewport_width = viewport_dims.width;
    const current_viewport_height = viewport_dims.height;

    // Update the component's viewport dimensions if they've changed
    if (current_viewport_width !== viewport_dimensions.width || current_viewport_height !== viewport_dimensions.height) {
      set_viewport_dimensions({ width: current_viewport_width, height: current_viewport_height });
    }

    // Set canvas dimensions to calculated viewport size
    canvas.width = current_viewport_width;
    canvas.height = current_viewport_height;

    // Function to draw everything
    const draw_all = (img?: HTMLImageElement) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save context for transforms
      ctx.save();
      
      // Apply pan and zoom transforms
      ctx.translate(state.pan_x, state.pan_y);
      ctx.scale(state.zoom, state.zoom);
      
      // Draw background image if exists
      if (img) {
        ctx.drawImage(img, 0, 0, state.canvas_width, state.canvas_height);
      }
      
      // Draw grid if enabled
      if (show_grid) {
        ctx.save();
        
        // Use a more visible color with higher opacity
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)'; // Blue grid lines
        ctx.lineWidth = Math.max(1, 1 / state.zoom); // Ensure minimum line width
        ctx.setLineDash([]); // Solid lines for better visibility
        
        const grid_size = 50; // Grid spacing in pixels
        
        // Vertical lines
        for (let x = 0; x <= state.canvas_width; x += grid_size) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, state.canvas_height);
          ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= state.canvas_height; y += grid_size) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(state.canvas_width, y);
          ctx.stroke();
        }
        
        // Add a subtle background overlay to make grid more visible
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, 0, state.canvas_width, state.canvas_height);
        
        ctx.restore();
      }
      
      // Draw text elements
      state.text_elements.forEach((text_element) => {
        ctx.save();
        ctx.translate(text_element.x, text_element.y);
        ctx.rotate((text_element.rotation * Math.PI) / 180);
        ctx.fillStyle = text_element.color;
        ctx.font = `${text_element.font_weight} ${text_element.font_size}px ${text_element.font_family}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add text stroke for better visibility
        ctx.strokeStyle = text_element.color === '#ffffff' ? '#000000' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeText(text_element.text, 0, 0);
        ctx.fillText(text_element.text, 0, 0);
        
        // Draw selection indicator
        if (text_element.selected) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          const metrics = ctx.measureText(text_element.text);
          const width = metrics.width;
          const height = text_element.font_size;
          ctx.strokeRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10);
        }
        
        ctx.restore();
      });

      // Restore context
      ctx.restore();
    };

    // Draw background image if exists
    if (state.image_base64) {
      // Check if we can use cached image
      if (cached_image.current && cached_image_base64.current === state.image_base64) {
        draw_all(cached_image.current);
      } else {
        // Load new image
        const img = new window.Image();
        img.onload = () => {
          cached_image.current = img;
          cached_image_base64.current = state.image_base64;
          draw_all(img);
        };
        img.src = `data:image/png;base64,${state.image_base64}`;
      }
    } else {
      // No image, just draw text elements
      draw_all();
    }
  }, [calculate_viewport_dimensions, show_grid]);

  // Add text element
  const add_text_element = useCallback(() => {
    if (!text_input.trim()) return;

    // Place text at center of visible viewport
    const viewport_center_x = viewport_dimensions.width / 2;
    const viewport_center_y = viewport_dimensions.height / 2;
    const canvas_coords = viewport_to_canvas(viewport_center_x, viewport_center_y);

    const new_text_element: Text_element = {
      id: Date.now().toString(),
      text: text_input,
      x: canvas_coords.x,
      y: canvas_coords.y,
      font_size: text_size,
      color: text_color,
      font_family: text_font,
      font_weight: text_weight,
      rotation: 0,
      selected: true,
    };

    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })).concat(new_text_element),
    };

    set_canvas_state(save_to_history(new_state));
    set_selected_text_id(new_text_element.id);
    set_text_input("");
    draw_canvas(new_state);

    track("Image Editor Text Added", {
      plan: plan || "unknown",
      text_length: new_text_element.text.length,
      font_size: text_size,
      font_family: text_font,
    });
  }, [text_input, text_size, text_color, text_font, text_weight, canvas_state, save_to_history, plan, viewport_to_canvas]);

  // Delete selected text element
  const delete_selected_text = useCallback(() => {
    if (!selected_text_id) return;

    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.filter(t => t.id !== selected_text_id),
    };

    set_canvas_state(save_to_history(new_state));
    set_selected_text_id(null);
    draw_canvas(new_state);
  }, [selected_text_id, canvas_state, save_to_history]);

  // Update selected text properties (for live editing - no history save)
  const update_selected_text_live = useCallback((updates: Partial<Text_element>) => {
    if (!selected_text_id) return;

    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.map(t => 
        t.id === selected_text_id ? { ...t, ...updates } : t
      ),
    };

    set_canvas_state(new_state);
    draw_canvas(new_state);
  }, [canvas_state, selected_text_id]);

  // Update selected text properties and save to history (for final changes)
  const update_selected_text_final = useCallback((updates: Partial<Text_element>) => {
    if (!selected_text_id) return;

    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.map(t => 
        t.id === selected_text_id ? { ...t, ...updates } : t
      ),
    };

    set_canvas_state(save_to_history(new_state));
    draw_canvas(new_state);
  }, [canvas_state, selected_text_id, save_to_history]);

  // Layer management functions
  const move_layer_up = useCallback((element_id: string) => {
    const current_index = canvas_state.text_elements.findIndex(t => t.id === element_id);
    if (current_index < canvas_state.text_elements.length - 1) {
      const new_elements = [...canvas_state.text_elements];
      [new_elements[current_index], new_elements[current_index + 1]] = 
        [new_elements[current_index + 1], new_elements[current_index]];
      
      const new_state = {
        ...canvas_state,
        text_elements: new_elements,
      };
      set_canvas_state(save_to_history(new_state));
      draw_canvas(new_state);
    }
  }, [canvas_state, save_to_history]);

  const move_layer_down = useCallback((element_id: string) => {
    const current_index = canvas_state.text_elements.findIndex(t => t.id === element_id);
    if (current_index > 0) {
      const new_elements = [...canvas_state.text_elements];
      [new_elements[current_index], new_elements[current_index - 1]] = 
        [new_elements[current_index - 1], new_elements[current_index]];
      
      const new_state = {
        ...canvas_state,
        text_elements: new_elements,
      };
      set_canvas_state(save_to_history(new_state));
      draw_canvas(new_state);
    }
  }, [canvas_state, save_to_history]);

  const bring_to_front = useCallback((element_id: string) => {
    const element = canvas_state.text_elements.find(t => t.id === element_id);
    if (!element) return;
    
    const new_elements = [
      ...canvas_state.text_elements.filter(t => t.id !== element_id),
      element
    ];
    
    const new_state = {
      ...canvas_state,
      text_elements: new_elements,
    };
    set_canvas_state(save_to_history(new_state));
    draw_canvas(new_state);
  }, [canvas_state, save_to_history]);

  const send_to_back = useCallback((element_id: string) => {
    const element = canvas_state.text_elements.find(t => t.id === element_id);
    if (!element) return;
    
    const new_elements = [
      element,
      ...canvas_state.text_elements.filter(t => t.id !== element_id)
    ];
    
    const new_state = {
      ...canvas_state,
      text_elements: new_elements,
    };
    set_canvas_state(save_to_history(new_state));
    draw_canvas(new_state);
  }, [canvas_state, save_to_history]);

  // Handle drag and drop reordering of text elements
  const handle_layer_drag_start = useCallback((e: React.DragEvent, index: number) => {
    set_dragging_layer_index(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handle_layer_drag_over = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    set_drag_over_layer_index(index);
  }, []);

  const handle_layer_drag_leave = useCallback(() => {
    set_drag_over_layer_index(null);
  }, []);

  const handle_layer_drop = useCallback((e: React.DragEvent, drop_index: number) => {
    e.preventDefault();
    
    if (dragging_layer_index === null || dragging_layer_index === drop_index) {
      set_dragging_layer_index(null);
      set_drag_over_layer_index(null);
      return;
    }

    const new_elements = [...canvas_state.text_elements];
    const [moved_element] = new_elements.splice(dragging_layer_index, 1);
    new_elements.splice(drop_index, 0, moved_element);
    
    const new_state = {
      ...canvas_state,
      text_elements: new_elements,
    };
    
    set_canvas_state(save_to_history(new_state));
    draw_canvas(new_state);
    set_dragging_layer_index(null);
    set_drag_over_layer_index(null);
  }, [canvas_state, dragging_layer_index, save_to_history]);

  const handle_layer_drag_end = useCallback(() => {
    set_dragging_layer_index(null);
    set_drag_over_layer_index(null);
  }, []);

  // Handle canvas mouse down
  const handle_canvas_mouse_down = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const viewport_x = event.clientX - rect.left;
    const viewport_y = event.clientY - rect.top;
    const canvas_coords = viewport_to_canvas(viewport_x, viewport_y);

    if (active_tool === 'pan') {
      set_is_panning(true);
      set_last_pan_position({ x: event.clientX, y: event.clientY });
      return;
    }

    // Check if clicked on text element
    const clicked_text = canvas_state.text_elements.find(text_element => {
      const distance = Math.sqrt(
        Math.pow(canvas_coords.x - text_element.x, 2) + Math.pow(canvas_coords.y - text_element.y, 2)
      );
      return distance < text_element.font_size;
    });

    if (clicked_text) {
      const new_state = {
        ...canvas_state,
        text_elements: canvas_state.text_elements.map(t => ({
          ...t,
          selected: t.id === clicked_text.id,
        })),
      };
      set_canvas_state(new_state);
      set_selected_text_id(clicked_text.id);
      
      // Update text panel values to match selected text
      set_text_input(clicked_text.text);
      set_text_color(clicked_text.color);
      set_text_size(clicked_text.font_size);
      set_text_font(clicked_text.font_family);
      set_text_weight(clicked_text.font_weight);
      set_show_text_panel(true);
      
      // Start dragging if move tool is active
      if (active_tool === 'move') {
        set_is_dragging_text(true);
        set_drag_offset({
          x: canvas_coords.x - clicked_text.x,
          y: canvas_coords.y - clicked_text.y,
        });
      }
      
      draw_canvas(new_state);
    } else {
      // Deselect all
      const new_state = {
        ...canvas_state,
        text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })),
      };
      set_canvas_state(new_state);
      set_selected_text_id(null);
      
      // Reset text panel to defaults for new text
      set_text_input("");
      set_text_color("#ffffff");
      set_text_size(48);
      set_text_font("Arial");
      set_text_weight("normal");
      
      draw_canvas(new_state);
    }
  }, [canvas_state, active_tool, viewport_to_canvas]);

  // Handle canvas mouse move
  const handle_canvas_mouse_move = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    if (is_panning) {
      const delta_x = event.clientX - last_pan_position.x;
      const delta_y = event.clientY - last_pan_position.y;
      
      set_canvas_state(prev => ({
        ...prev,
        pan_x: prev.pan_x + delta_x,
        pan_y: prev.pan_y + delta_y,
      }));
      
      set_last_pan_position({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!is_dragging_text || !selected_text_id || active_tool !== 'move') return;

    const rect = canvas.getBoundingClientRect();
    const viewport_x = event.clientX - rect.left;
    const viewport_y = event.clientY - rect.top;
    const canvas_coords = viewport_to_canvas(viewport_x, viewport_y);

    const new_x = canvas_coords.x - drag_offset.x;
    const new_y = canvas_coords.y - drag_offset.y;

    // Update text position
    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.map(t => 
        t.id === selected_text_id ? { ...t, x: new_x, y: new_y } : t
      ),
    };

    set_canvas_state(new_state);
    draw_canvas(new_state);
  }, [is_panning, is_dragging_text, selected_text_id, active_tool, canvas_state, drag_offset, last_pan_position, viewport_to_canvas]);

  // Handle canvas mouse up
  const handle_canvas_mouse_up = useCallback(() => {
    if (is_panning) {
      set_is_panning(false);
    }
    if (is_dragging_text) {
      set_is_dragging_text(false);
      // Save to history when drag ends
      set_canvas_state(prev => save_to_history(prev));
    }
  }, [is_panning, is_dragging_text, save_to_history]);

  // Handle wheel zoom
  const handle_wheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const zoom_factor = event.deltaY > 0 ? 0.9 : 1.1;
    const new_zoom = Math.min(Math.max(canvas_state.zoom * zoom_factor, 0.1), 5);
    
    // Zoom towards mouse position
    const canvas = canvas_ref.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouse_x = event.clientX - rect.left;
    const mouse_y = event.clientY - rect.top;
    
    const zoom_ratio = new_zoom / canvas_state.zoom;
    const new_pan_x = mouse_x - (mouse_x - canvas_state.pan_x) * zoom_ratio;
    const new_pan_y = mouse_y - (mouse_y - canvas_state.pan_y) * zoom_ratio;
    
    set_canvas_state(prev => ({
      ...prev,
      zoom: new_zoom,
      pan_x: new_pan_x,
      pan_y: new_pan_y,
    }));
  }, [canvas_state.zoom, canvas_state.pan_x, canvas_state.pan_y]);

  // Export image
  const export_image = useCallback(async () => {
    // Create a temporary canvas for export at original resolution
    const export_canvas = document.createElement('canvas');
    const export_ctx = export_canvas.getContext('2d');
    if (!export_ctx) return;

    export_canvas.width = canvas_state.canvas_width;
    export_canvas.height = canvas_state.canvas_height;

    try {
      // Draw background image if exists
      if (canvas_state.image_base64 && cached_image.current) {
        export_ctx.drawImage(cached_image.current, 0, 0, canvas_state.canvas_width, canvas_state.canvas_height);
      }

      // Draw text elements
      canvas_state.text_elements.forEach((text_element) => {
        export_ctx.save();
        export_ctx.translate(text_element.x, text_element.y);
        export_ctx.rotate((text_element.rotation * Math.PI) / 180);
        export_ctx.fillStyle = text_element.color;
        export_ctx.font = `${text_element.font_weight} ${text_element.font_size}px ${text_element.font_family}`;
        export_ctx.textAlign = 'center';
        export_ctx.textBaseline = 'middle';
        
        // Add text stroke for better visibility
        export_ctx.strokeStyle = text_element.color === '#ffffff' ? '#000000' : '#ffffff';
        export_ctx.lineWidth = 2;
        export_ctx.strokeText(text_element.text, 0, 0);
        export_ctx.fillText(text_element.text, 0, 0);
        
        export_ctx.restore();
      });

      const data_url = export_canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = data_url;
      a.download = `edited_image_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      track("Image Editor Export", {
        plan: plan || "unknown",
        text_elements_count: canvas_state.text_elements.length,
        canvas_width: canvas_state.canvas_width,
        canvas_height: canvas_state.canvas_height,
      });
    } catch (error) {
      set_error_message("Failed to export image");
      console.error("Export error:", error);
    }
  }, [canvas_state, plan]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (canvas_state.history_index > 0) {
      const new_index = canvas_state.history_index - 1;
      const history_entry = JSON.parse(canvas_state.history[new_index]);
      const new_state = {
        ...canvas_state,
        ...history_entry,
        history_index: new_index,
      };
      set_canvas_state(new_state);
      draw_canvas(new_state);
    }
  }, [canvas_state]);

  const redo = useCallback(() => {
    if (canvas_state.history_index < canvas_state.history.length - 1) {
      const new_index = canvas_state.history_index + 1;
      const history_entry = JSON.parse(canvas_state.history[new_index]);
      const new_state = {
        ...canvas_state,
        ...history_entry,
        history_index: new_index,
      };
      set_canvas_state(new_state);
      draw_canvas(new_state);
    }
  }, [canvas_state]);

  // Redraw canvas when state changes
  useEffect(() => {
    draw_canvas(canvas_state);
  }, [canvas_state, draw_canvas, show_grid]);

  // Initialize canvas and load image from localStorage if available
  useEffect(() => {
    const stored_image = localStorage.getItem('image_editor_image');
    if (stored_image) {
      const img = new window.Image();
      img.onload = () => {
        // Calculate viewport dimensions for the stored image
        const stored_image_viewport = calculate_viewport_dimensions(img.width, img.height);
        
        const initial_zoom = Math.min(
          (stored_image_viewport.width * 0.9) / img.width,
          (stored_image_viewport.height * 0.9) / img.height,
          1
        );

        const new_state = {
          ...canvas_state,
          image_base64: stored_image,
          canvas_width: img.width,
          canvas_height: img.height,
          text_elements: [],
          zoom: initial_zoom,
          pan_x: (stored_image_viewport.width - img.width * initial_zoom) / 2,
          pan_y: (stored_image_viewport.height - img.height * initial_zoom) / 2,
        };
        set_canvas_state(save_to_history(new_state));
        draw_canvas(new_state);
      };
      img.src = `data:image/png;base64,${stored_image}`;
      // Clear the stored image after loading
      localStorage.removeItem('image_editor_image');
    } else {
      draw_canvas(canvas_state);
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      <Image_editor_header
        canvas_state={canvas_state}
        on_undo={undo}
        on_redo={redo}
        on_zoom_in={zoom_in}
        on_zoom_out={zoom_out}
        on_reset_zoom={reset_zoom}
        on_export={export_image}
      />

      <div className="flex-1 flex">
        <Image_editor_toolbar
          active_tool={active_tool}
          show_templates={show_templates}
          show_grid={show_grid}
          selected_text_id={selected_text_id}
          has_image={!!canvas_state.image_base64}
          file_input_ref={file_input_ref}
          on_tool_change={set_active_tool}
          on_toggle_templates={() => set_show_templates(!show_templates)}
          on_toggle_grid={() => set_show_grid(!show_grid)}
          on_toggle_text_panel={() => set_show_text_panel(!show_text_panel)}
          on_delete_selected={delete_selected_text}
          on_clear_canvas={() => {
            if (confirm('Are you sure you want to clear the canvas? This will remove the image and all text elements.')) {
              const new_state = {
                ...canvas_state,
                image_base64: null,
                text_elements: [],
                canvas_width: 400,
                canvas_height: 300,
                zoom: 1,
                pan_x: 0,
                pan_y: 0,
              };
              set_canvas_state(save_to_history(new_state));
              set_current_template(null); // Clear the current template
              set_selected_text_id(null);
              draw_canvas(new_state);
            }
          }}
          on_file_upload={() => file_input_ref.current?.click()}
        />

        {/* Templates Panel */}
        {show_templates && (
          <div className="w-80 bg-base-100 border-r border-base-300 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Templates</h3>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => set_show_templates(false)}
              >
                ×
              </button>
            </div>

            {/* Category Tabs */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {template_categories.map((category) => (
                  <button
                    key={category.id}
                    className={`btn btn-xs ${
                      selected_category === category.id ? 'btn-primary' : 'btn-ghost'
                    }`}
                    onClick={() => set_selected_category(category.id)}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <div className="space-y-3">
              {get_templates_by_category(selected_category).map((template) => (
                <div
                  key={template.id}
                  className="border border-base-300 rounded-lg p-3 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={() => load_template(template)}
                >
                  {/* Template Preview */}
                  <div 
                    className="w-full h-16 rounded border border-base-300 mb-2 flex items-center justify-center text-xs font-medium"
                    style={{
                      background: template.background_gradient 
                        ? `linear-gradient(45deg, ${template.background_gradient.start}, ${template.background_gradient.end})`
                        : template.background_color,
                      color: '#ffffff'
                    }}
                  >
                    {template.width} × {template.height}
                  </div>
                  
                  {/* Template Info */}
                  <div>
                    <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    <p className="text-xs text-base-content/60 mt-1">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          <div 
            className="flex-1 p-4 overflow-hidden flex items-center justify-center"
            onDragEnter={handle_drag_enter}
            onDragLeave={handle_drag_leave}
            onDragOver={handle_drag_over}
            onDrop={handle_drop}
          >
            <div className={`relative ${drag_over ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
              {is_loading && (
                <div className="absolute inset-0 bg-base-100 bg-opacity-75 flex items-center justify-center z-10 rounded">
                  <div className="loading loading-spinner loading-lg"></div>
                </div>
              )}
              
              {!canvas_state.image_base64 ? (
                // Upload prompt when no image
                <div 
                  className={`border-2 border-dashed border-base-300 p-8 rounded-lg cursor-pointer hover:border-primary transition-colors ${drag_over ? 'border-primary bg-primary bg-opacity-5' : ''}`}
                  onClick={() => file_input_ref.current?.click()}
                  style={{ width: viewport_dimensions.width, height: viewport_dimensions.height }}
                >
                  <div className="text-center space-y-4 flex flex-col items-center justify-center h-full">
                    <Upload className="w-12 h-12 mx-auto text-base-content opacity-50" />
                    <div>
                      <p className="text-lg font-medium">Upload an image or choose a template</p>
                      <p className="text-sm text-base-content opacity-70">
                        Click here to upload or use the Templates panel
                      </p>
                      <p className="text-xs text-base-content opacity-50 mt-2">
                        JPG, PNG, WEBP up to 10MB
                      </p>
                      <button
                        className="btn btn-primary btn-sm mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          set_show_templates(true);
                        }}
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Browse Templates
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Fixed-size canvas viewport
                <div className="relative">
                  <div className="border border-base-300 shadow-lg rounded overflow-hidden bg-base-200">
                    <canvas
                      ref={canvas_ref}
                      className={`block ${
                        active_tool === 'pan' ? 'cursor-grab' : 
                        active_tool === 'move' && selected_text_id ? 'cursor-move' : 
                        'cursor-pointer'
                      } ${is_panning ? 'cursor-grabbing' : ''}`}
                      style={{
                        width: viewport_dimensions.width,
                        height: viewport_dimensions.height,
                      }}
                      onMouseDown={handle_canvas_mouse_down}
                      onMouseMove={handle_canvas_mouse_move}
                      onMouseUp={handle_canvas_mouse_up}
                      onMouseLeave={handle_canvas_mouse_up}
                      onWheel={handle_wheel}
                    />
                  </div>
                  
                  {/* Zoom indicator */}
                  <div className="absolute top-2 left-2 bg-base-800 text-base-100 px-2 py-1 rounded text-xs">
                    {Math.round(canvas_state.zoom * 100)}%
                  </div>
                  
                  {/* Tool instruction */}
                  <div className="absolute top-2 right-2 bg-base-800 text-base-100 px-2 py-1 rounded text-xs">
                    {active_tool === 'pan' && 'Drag to pan • Scroll to zoom'}
                    {active_tool === 'text' && 'Click to add text'}
                    {active_tool === 'move' && 'Click and drag text to move'}
                    {active_tool === 'select' && 'Click to select text'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text Panel */}
          {show_text_panel && (
            <div className="w-80 bg-base-100 border-l border-base-300 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Text Properties</h3>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => set_show_text_panel(false)}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Text Input */}
                <div>
                  <label className="label">
                    <span className="label-text">Text</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1"
                      value={text_input}
                      onChange={(e) => {
                        set_text_input(e.target.value);
                        if (selected_text_id) {
                          update_selected_text_live({ text: e.target.value });
                        }
                      }}
                      onBlur={() => {
                        if (selected_text_id && text_input.trim()) {
                          update_selected_text_final({ text: text_input });
                        }
                      }}
                      placeholder="Enter text..."
                    />
                    <button
                      className="btn btn-primary"
                      onClick={add_text_element}
                      disabled={!text_input.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="label">
                    <span className="label-text">Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={text_font}
                    onChange={(e) => {
                      set_text_font(e.target.value);
                      if (selected_text_id) {
                        update_selected_text_final({ font_family: e.target.value });
                      }
                    }}
                  >
                    {font_options.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="label">
                    <span className="label-text">Size: {text_size}px</span>
                  </label>
                  <input
                    type="range"
                    className="range range-primary"
                    min="12"
                    max="200"
                    value={text_size}
                    onChange={(e) => {
                      const new_size = parseInt(e.target.value);
                      set_text_size(new_size);
                      if (selected_text_id) {
                        update_selected_text_live({ font_size: new_size });
                      }
                    }}
                    onMouseUp={(e) => {
                      // Save to history when slider is released
                      if (selected_text_id) {
                        const new_size = parseInt((e.target as HTMLInputElement).value);
                        update_selected_text_final({ font_size: new_size });
                      }
                    }}
                  />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="label">
                    <span className="label-text">Weight</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={text_weight}
                    onChange={(e) => {
                      set_text_weight(e.target.value);
                      if (selected_text_id) {
                        update_selected_text_final({ font_weight: e.target.value });
                      }
                    }}
                  >
                    {weight_options.map((weight) => (
                      <option key={weight.value} value={weight.value}>
                        {weight.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="label">
                    <span className="label-text">Color</span>
                  </label>
                  <input
                    type="color"
                    className="w-full h-10 rounded border border-base-300"
                    value={text_color}
                    onChange={(e) => {
                      set_text_color(e.target.value);
                      if (selected_text_id) {
                        update_selected_text_live({ color: e.target.value });
                      }
                    }}
                    onBlur={() => {
                      if (selected_text_id) {
                        update_selected_text_final({ color: text_color });
                      }
                    }}
                  />
                </div>

                {/* Text Elements List with Layer Controls */}
                {canvas_state.text_elements.length > 0 && (
                  <div>
                    <label className="label">
                      <span className="label-text">Layers (drag to reorder)</span>
                    </label>
                    <div className="space-y-2">
                      {canvas_state.text_elements.map((element, index) => (
                        <div
                          key={element.id}
                          draggable
                          onDragStart={(e) => handle_layer_drag_start(e, index)}
                          onDragOver={(e) => handle_layer_drag_over(e, index)}
                          onDragLeave={handle_layer_drag_leave}
                          onDrop={(e) => handle_layer_drop(e, index)}
                          onDragEnd={handle_layer_drag_end}
                          className={`group relative p-2 rounded border transition-all ${
                            element.selected ? 'border-primary bg-primary/10' : 'border-base-300'
                          } ${
                            dragging_layer_index === index ? 'opacity-50' : ''
                          } ${
                            drag_over_layer_index === index && dragging_layer_index !== index 
                              ? 'border-primary border-2 bg-primary/5' : ''
                          } hover:border-primary hover:shadow-sm cursor-pointer`}
                          onClick={() => {
                            const new_state = {
                              ...canvas_state,
                              text_elements: canvas_state.text_elements.map(t => ({
                                ...t,
                                selected: t.id === element.id,
                              })),
                            };
                            set_canvas_state(new_state);
                            set_selected_text_id(element.id);
                            
                            // Update text panel values to match selected text
                            set_text_input(element.text);
                            set_text_color(element.color);
                            set_text_size(element.font_size);
                            set_text_font(element.font_family);
                            set_text_weight(element.font_weight);
                            
                            draw_canvas(new_state);
                          }}
                        >
                          {/* Drag handle */}
                          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 text-base-content/40 group-hover:text-base-content/60">
                            <GripVertical className="w-3 h-3" />
                          </div>
                          
                          {/* Layer controls */}
                          <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="btn btn-xs btn-ghost p-0 w-5 h-5 min-h-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                bring_to_front(element.id);
                              }}
                              title="Bring to front"
                              disabled={index === canvas_state.text_elements.length - 1}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost p-0 w-5 h-5 min-h-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                send_to_back(element.id);
                              }}
                              title="Send to back"
                              disabled={index === 0}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost p-0 w-5 h-5 min-h-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                move_layer_up(element.id);
                              }}
                              title="Move up one layer"
                              disabled={index === canvas_state.text_elements.length - 1}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost p-0 w-5 h-5 min-h-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                move_layer_down(element.id);
                              }}
                              title="Move down one layer"
                              disabled={index === 0}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Element content */}
                          <div className="ml-4 mr-20">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border flex-shrink-0" 
                                style={{ backgroundColor: element.color }}
                              />
                              <div className="text-sm font-medium truncate">
                                {element.text}
                              </div>
                            </div>
                            <div className="text-xs text-base-content/60 mt-1">
                              Layer {canvas_state.text_elements.length - index} • {element.font_family} • {element.font_size}px
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Layer help text */}
                    <div className="text-xs text-base-content/50 mt-2 p-2 bg-base-200 rounded">
                      💡 Higher layers appear on top. Drag to reorder, or use the layer controls.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Confirmation Modal */}
      {show_template_modal && pending_template && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-base-100 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-base-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Apply Template</h3>
                <p className="text-sm text-base-content/70">{pending_template.name}</p>
              </div>
            </div>
            
            <p className="text-base-content/80 mb-6">
              You have an existing image. What would you like to do?
            </p>

            <div className="space-y-3 mb-6">
              <button
                className="w-full btn btn-outline btn-primary justify-start p-4 h-auto"
                onClick={() => handle_template_confirmation(true, false)}
              >
                <div className="text-left py-2">
                  <div className="font-medium">Keep my image</div>
                  <div className="text-xs opacity-70">Apply template layout to current image</div>
                </div>
              </button>
              
              <button
                className="w-full btn btn-outline justify-start p-4 h-auto"
                onClick={() => handle_template_confirmation(false, false)}
              >
                <div className="text-left py-2">
                  <div className="font-medium">Use template background</div>
                  <div className="text-xs opacity-70">Replace with template's background design</div>
                </div>
              </button>
            </div>

            <div className="border-t border-base-300 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  onChange={(e) => {
                    if (e.target.checked) {
                      // If checked, apply the default behavior (keep image) and don't show again
                      handle_template_confirmation(true, true);
                    }
                  }}
                />
                <span className="text-sm text-base-content/70">
                  Don't show this again (always keep my image)
                </span>
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm flex-1"
                onClick={() => {
                  set_show_template_modal(false);
                  set_pending_template(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error_message && (
        <div className="toast toast-end">
          <div className="alert alert-error">
            <span>{error_message}</span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => set_error_message(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Hidden file input for uploads */}
      <input
        ref={file_input_ref}
        type="file"
        accept="image/*"
        onChange={handle_file_upload}
        className="hidden"
      />
    </div>
  );
} 