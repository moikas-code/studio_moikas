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
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { track } from "@vercel/analytics";
import { 
  template_categories, 
  get_templates_by_category, 
  create_template_background,
  type Template,
} from "@/lib/image_editor_templates";

// Hooks and utilities
import { useCanvasState } from "@/hooks/use_canvas_state";
import { useZoomPan } from "@/hooks/use_zoom_pan";
import { useEditorSession } from "@/hooks/use_editor_session";
import { calculate_viewport_dimensions, type Canvas_state, type Text_element } from "@/lib/image_editor_utils";

// Components
import { Image_editor_header } from "./image_editor/image_editor_header";
import { Image_editor_toolbar } from "./image_editor/image_editor_toolbar";

export default function Image_editor() {
  const { plan } = useContext(MpContext);
  
  // Use custom hooks
  const {
    canvas_state,
    set_canvas_state,
    update_canvas_state,
    save_to_history,
  } = useCanvasState();

  const {
    zoom_in,
    zoom_out,
    reset_zoom,
  } = useZoomPan(canvas_state, update_canvas_state);

  // Session management
  const {
    session_name,
    is_saving,
    last_saved,
    sessions_list,
    save_session,
    load_session,
    new_session,
    export_session,
    import_session,
  } = useEditorSession({
    canvas_state,
    use_database: false, // Will change to true when database is ready
    auto_save_interval: 30000, // 30 seconds
  });

  // UI state
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [active_tool, set_active_tool] = useState<'select' | 'text' | 'pan'>('select');
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
  
  // Image selection and transform state
  const [is_image_selected, set_is_image_selected] = useState(false);
  const [is_resizing_image, set_is_resizing_image] = useState(false);
  const [resize_handle, set_resize_handle] = useState<string | null>(null);
  const [resize_start, set_resize_start] = useState({ x: 0, y: 0, width: 0, height: 0, original_x: 0, original_y: 0 });
  const [show_image_panel, set_show_image_panel] = useState(false);
  const [is_moving_image, set_is_moving_image] = useState(false);
  const [move_start, set_move_start] = useState({ x: 0, y: 0, image_x: 0, image_y: 0 });
  
  // Background editing state
  const [show_background_panel, set_show_background_panel] = useState(false);
  const [background_type, set_background_type] = useState<'color' | 'gradient'>('color');
  const [background_color, set_background_color] = useState('#ffffff');
  const [gradient_start, set_gradient_start] = useState('#ff4444');
  const [gradient_end, set_gradient_end] = useState('#cc0000');
  const [gradient_direction, set_gradient_direction] = useState<'horizontal' | 'vertical' | 'diagonal'>('diagonal');
  
  // Add persistent background settings
  const [user_background_type, set_user_background_type] = useState<'color' | 'gradient'>('color');
  const [user_background_color, set_user_background_color] = useState('#ffffff');
  const [user_gradient_start, set_user_gradient_start] = useState('#ff4444');
  const [user_gradient_end, set_user_gradient_end] = useState('#cc0000');
  const [user_gradient_direction, set_user_gradient_direction] = useState<'horizontal' | 'vertical' | 'diagonal'>('diagonal');
  const [has_user_background_settings, set_has_user_background_settings] = useState(false);

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
  const file_input_ref = useRef<HTMLInputElement>(null);
  
  // Cache for images
  const cached_background = useRef<HTMLImageElement | null>(null);
  const cached_background_base64 = useRef<string | null>(null);

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

  // Resize/reposition an image to fit template dimensions (without merging with template background)
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

        // Clear canvas with transparent background (do NOT include template background here)
        ctx.clearRect(0, 0, template.width, template.height);

        // Draw ONLY the resized image (template background will be handled separately in background layer)
        ctx.drawImage(img, x, y, scaled_width, scaled_height);

        resolve(canvas.toDataURL().split(',')[1]); // Return base64 without prefix
      };
      img.onerror = () => resolve(image_base64); // Return original if error
      img.src = `data:image/png;base64,${image_base64}`;
    });
  }, []);

  // Store current selected template for upload handling
  const [current_template, set_current_template] = useState<Template | null>(null);

  // Background editing functions
  const create_custom_background = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas_state.canvas_width;
    canvas.height = canvas_state.canvas_height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (background_type === 'color') {
      // Solid color background
      ctx.fillStyle = background_color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Gradient background
      let gradient;
      switch (gradient_direction) {
        case 'horizontal':
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          break;
        case 'vertical':
          gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          break;
        case 'diagonal':
        default:
          gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          break;
      }
      gradient.addColorStop(0, gradient_start);
      gradient.addColorStop(1, gradient_end);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL().split(',')[1]; // Return base64 without prefix
  }, [canvas_state.canvas_width, canvas_state.canvas_height, background_type, background_color, gradient_start, gradient_end, gradient_direction]);

  // Initialize background settings from current template/image
  useEffect(() => {
    // If user has custom background settings, use those instead of template defaults
    if (has_user_background_settings) {
      set_background_type(user_background_type);
      set_background_color(user_background_color);
      set_gradient_start(user_gradient_start);
      set_gradient_end(user_gradient_end);
      set_gradient_direction(user_gradient_direction);
    } else if (current_template && current_template.background_gradient) {
      set_background_type('gradient');
      set_gradient_start(current_template.background_gradient.start);
      set_gradient_end(current_template.background_gradient.end);
      set_gradient_direction(current_template.background_gradient.direction);
    } else if (current_template) {
      set_background_type('color');
      set_background_color(current_template.background_color);
    }
  }, [background_type, canvas_state.canvas_width, canvas_state.canvas_height, current_template, has_user_background_settings, user_background_type, user_background_color, user_gradient_start, user_gradient_end, user_gradient_direction]);

  // Cache the loaded image to avoid reloading
  const cached_image = useRef<HTMLImageElement | null>(null);
  const cached_image_base64 = useRef<string | null>(null);

  // Draw canvas with full page viewport
  const draw_canvas = useCallback((state: Canvas_state, custom_viewport_dimensions?: { width: number; height: number }, image_selected: boolean = is_image_selected, moving_image: boolean = is_moving_image) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the full available canvas size from the DOM element
    const rect = canvas.getBoundingClientRect();
    const current_viewport_width = rect.width;
    const current_viewport_height = rect.height;

    // Set canvas dimensions to full available space
    canvas.width = current_viewport_width;
    canvas.height = current_viewport_height;

    // Update the component's viewport dimensions if they've changed
    if (current_viewport_width !== viewport_dimensions.width || current_viewport_height !== viewport_dimensions.height) {
      set_viewport_dimensions({ width: current_viewport_width, height: current_viewport_height });
    }

    // Function to draw everything
    const draw_all = (img?: HTMLImageElement, background_img?: HTMLImageElement) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Save context for transforms
      ctx.save();
      
      // Apply pan and zoom transforms
      ctx.translate(state.pan_x, state.pan_y);
      ctx.scale(state.zoom, state.zoom);
      
      // Draw background first if exists
      if (background_img) {
        ctx.drawImage(background_img, 0, 0, state.canvas_width, state.canvas_height);
      }
      
      // Draw main image on top if exists
      if (img) {
        const transform = state.image_transform || {
          x: 0,
          y: 0,
          width: state.canvas_width,
          height: state.canvas_height,
          scale_x: 1,
          scale_y: 1,
        };
        
        ctx.save();
        // Draw image at its position with scaling
        ctx.drawImage(
          img, 
          transform.x, 
          transform.y, 
          transform.width * transform.scale_x, 
          transform.height * transform.scale_y
        );
        ctx.restore();
        
        // Draw selection box if image is selected
        if (image_selected) {
          // Different color when moving
          ctx.strokeStyle = moving_image ? '#0080ff' : '#00ff00';
          ctx.lineWidth = 2 / state.zoom;
          ctx.setLineDash([5 / state.zoom, 5 / state.zoom]);
          ctx.strokeRect(transform.x, transform.y, transform.width * transform.scale_x, transform.height * transform.scale_y);
          ctx.setLineDash([]);
          
          // Draw resize handles
          const handle_size = 8 / state.zoom;
          const handles = [
            { name: 'tl', x: transform.x, y: transform.y },
            { name: 'tr', x: transform.x + transform.width * transform.scale_x, y: transform.y },
            { name: 'bl', x: transform.x, y: transform.y + transform.height * transform.scale_y },
            { name: 'br', x: transform.x + transform.width * transform.scale_x, y: transform.y + transform.height * transform.scale_y },
            { name: 'tc', x: transform.x + (transform.width * transform.scale_x) / 2, y: transform.y },
            { name: 'bc', x: transform.x + (transform.width * transform.scale_x) / 2, y: transform.y + transform.height * transform.scale_y },
            { name: 'lc', x: transform.x, y: transform.y + (transform.height * transform.scale_y) / 2 },
            { name: 'rc', x: transform.x + transform.width * transform.scale_x, y: transform.y + (transform.height * transform.scale_y) / 2 },
          ];
          
          ctx.fillStyle = '#00ff00';
          handles.forEach(handle => {
            ctx.fillRect(
              handle.x - handle_size / 2, 
              handle.y - handle_size / 2, 
              handle_size, 
              handle_size
            );
          });
        }
      }
      
      // Always draw project boundaries to show editing/export area
      // This should be drawn within the transformed coordinate system
      const has_selection = image_selected || state.text_elements.some(t => t.selected);
      ctx.strokeStyle = has_selection ? 'rgba(0, 150, 255, 0.8)' : 'rgba(0, 150, 255, 0.6)';
      ctx.lineWidth = Math.max(has_selection ? 3 : 2, (has_selection ? 3 : 2) / state.zoom);
      ctx.setLineDash(has_selection ? [] : [10 / state.zoom, 5 / state.zoom]);
      
      // Draw project boundaries at the canvas edges (within transformed space)
      ctx.beginPath();
      ctx.rect(0, 0, state.canvas_width, state.canvas_height);
      ctx.stroke();
      
      // Add corner indicators when selected for better visibility
      if (has_selection) {
        const corner_size = 20 / state.zoom;
        ctx.strokeStyle = 'rgba(0, 150, 255, 1)';
        ctx.lineWidth = Math.max(2, 2 / state.zoom);
        ctx.setLineDash([]);
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(0, corner_size);
        ctx.lineTo(0, 0);
        ctx.lineTo(corner_size, 0);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(state.canvas_width - corner_size, 0);
        ctx.lineTo(state.canvas_width, 0);
        ctx.lineTo(state.canvas_width, corner_size);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(0, state.canvas_height - corner_size);
        ctx.lineTo(0, state.canvas_height);
        ctx.lineTo(corner_size, state.canvas_height);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(state.canvas_width - corner_size, state.canvas_height);
        ctx.lineTo(state.canvas_width, state.canvas_height);
        ctx.lineTo(state.canvas_width, state.canvas_height - corner_size);
        ctx.stroke();
      }
      
      // Draw internal grid lines if enabled
      if (show_grid) {
        // Use a more visible color with higher opacity for grid lines
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)'; // Lighter blue for internal lines
        ctx.lineWidth = Math.max(1, 1 / state.zoom); // Thinner than border
        ctx.setLineDash([]); // Solid lines for better visibility
        
        const grid_size = 50; // Grid spacing in pixels
        
        // Vertical lines (within project boundaries)
        for (let x = grid_size; x < state.canvas_width; x += grid_size) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, state.canvas_height);
          ctx.stroke();
        }
        
        // Horizontal lines (within project boundaries)
        for (let y = grid_size; y < state.canvas_height; y += grid_size) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(state.canvas_width, y);
          ctx.stroke();
        }
        
        // Add a subtle background overlay within project boundaries
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, 0, state.canvas_width, state.canvas_height);
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

    // Load background and main images
    let main_img: HTMLImageElement | undefined;
    let background_img: HTMLImageElement | undefined;
    let images_to_load = 0;
    let images_loaded = 0;

    const check_all_loaded = () => {
      if (images_loaded === images_to_load) {
        draw_all(main_img, background_img);
      }
    };

    // Load background image if exists
    if (state.background_base64) {
      images_to_load++;
      if (cached_background.current && cached_background_base64.current === state.background_base64) {
        background_img = cached_background.current;
        images_loaded++;
      } else {
        const bg_img = new window.Image();
        bg_img.onload = () => {
          cached_background.current = bg_img;
          cached_background_base64.current = state.background_base64 || null;
          background_img = bg_img;
          images_loaded++;
          check_all_loaded();
        };
        bg_img.src = `data:image/png;base64,${state.background_base64}`;
      }
    }

    // Load main image if exists
    if (state.image_base64) {
      images_to_load++;
      if (cached_image.current && cached_image_base64.current === state.image_base64) {
        main_img = cached_image.current;
        images_loaded++;
      } else {
        const img = new window.Image();
        img.onload = () => {
          cached_image.current = img;
          cached_image_base64.current = state.image_base64;
          main_img = img;
          images_loaded++;
          check_all_loaded();
        };
        img.src = `data:image/png;base64,${state.image_base64}`;
      }
    }

    // If no images to load, just draw
    if (images_to_load === 0) {
      draw_all();
    } else {
      check_all_loaded();
    }
  }, [show_grid, is_image_selected, is_moving_image, viewport_dimensions, set_viewport_dimensions]);

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

    // Use current actual viewport dimensions for full-page canvas
    const current_viewport = viewport_dimensions;
    
    // Fit the template with some padding (70% of viewport for better visibility)
    const initial_zoom = Math.min(
      (current_viewport.width * 0.7) / template.width,
      (current_viewport.height * 0.7) / template.height,
      2 // Allow zooming in up to 200% for better visibility
    );

    // Determine what to do with layers
    let final_image = canvas_state.image_base64;
    let final_background = canvas_state.background_base64;
    
    if (use_template_background) {
      // Apply template background to background layer
      if (has_user_background_settings) {
        final_background = create_custom_background();
      } else {
        final_background = create_template_background(template);
      }
    }
    
    if (!canvas_state.image_base64) {
      // No existing image, optionally add template background as main image if no separate background
      if (use_template_background && !final_background) {
        if (has_user_background_settings) {
          final_image = create_custom_background();
        } else {
          final_image = create_template_background(template);
        }
      }
    }
    // Keep existing image unchanged - only canvas dimensions will change

    const new_state = {
      ...canvas_state,
      image_base64: final_image,
      background_base64: final_background,
      canvas_width: template.width,
      canvas_height: template.height,
      text_elements,
      zoom: initial_zoom,
      pan_x: (current_viewport.width - template.width * initial_zoom) / 2,
      pan_y: (current_viewport.height - template.height * initial_zoom) / 2,
      image_transform: canvas_state.image_transform || {
        x: 0,
        y: 0,
        width: template.width,
        height: template.height,
        scale_x: 1,
        scale_y: 1,
      },
    };

    set_canvas_state(save_to_history(new_state));
    // Image transform is now part of canvas_state
    set_current_template(template); // Store the current template for future uploads
    set_show_templates(false);
    set_selected_text_id(null);
    // Draw canvas with the current viewport dimensions
    draw_canvas(new_state);

    track("Image Editor Template Loaded", {
      template_id: template.id,
      template_name: template.name,
      category: template.category,
      has_existing_image: !!canvas_state.image_base64,
      used_template_background: use_template_background,
      plan: plan || "unknown",
      canvas_width: template.width,
      canvas_height: template.height,
    });
  }, [canvas_state, save_to_history, plan, has_user_background_settings, draw_canvas, set_canvas_state, viewport_dimensions, create_custom_background]);

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
            image_transform: {
              x: 0,
              y: 0,
              width: current_template.width,
              height: current_template.height,
              scale_x: 1,
              scale_y: 1,
            },
          };
          set_canvas_state(save_to_history(new_state));
          // Image transform is now part of canvas_state
          draw_canvas(new_state);
        } else if (has_template && !current_template) {
          // We have text elements but no current_template reference
          // This means a template was applied but we lost the reference
          // In this case, just replace the image but keep text elements and dimensions
          const new_state = {
            ...canvas_state,
            image_base64: uploaded_image_base64,
            // Keep existing canvas dimensions and text elements
            image_transform: {
              x: 0,
              y: 0,
              width: canvas_state.canvas_width,
              height: canvas_state.canvas_height,
              scale_x: 1,
              scale_y: 1,
            },
          };
          set_canvas_state(save_to_history(new_state));
          // Image transform is now part of canvas_state
          draw_canvas(new_state);
        } else {
          // No template active - treat as new image upload
          // Use current full-page viewport dimensions
          const current_viewport = viewport_dimensions;
          
          // Auto-fit zoom to viewport with padding (70% of viewport for better visibility)
          const initial_zoom = Math.min(
            (current_viewport.width * 0.7) / img.width,
            (current_viewport.height * 0.7) / img.height,
            2 // Allow zooming up to 200% for better visibility
          );

          const new_state = {
            ...canvas_state,
            image_base64: uploaded_image_base64,
            canvas_width: img.width,
            canvas_height: img.height,
            text_elements: [],
            zoom: initial_zoom,
            pan_x: (current_viewport.width - img.width * initial_zoom) / 2,
            pan_y: (current_viewport.height - img.height * initial_zoom) / 2,
            image_transform: {
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
              scale_x: 1,
              scale_y: 1,
            },
          };
          set_canvas_state(save_to_history(new_state));
          // Image transform is now part of canvas_state
          draw_canvas(new_state);
        }
        
        set_is_loading(false);
        set_error_message(null);
        
        // Track image upload
        track("Image Editor Upload", {
          plan: plan || "unknown",
          file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
          file_type: file.type,
          image_width: img.width,
          image_height: img.height,
          has_existing_image: !!canvas_state.image_base64,
          has_template: !!current_template,
          canvas_width: canvas_state.canvas_width,
          canvas_height: canvas_state.canvas_height,
          upload_context: has_template ? "template_active" : "new_image",
        });
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
  }, [canvas_state, save_to_history, current_template, resize_image_to_template, draw_canvas, set_canvas_state, plan, viewport_dimensions]);

  // Handle file upload
  const handle_file_upload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    process_file(file);
  }, [process_file]);

  // Apply background
  const apply_background = useCallback(() => {
    const background_base64 = create_custom_background();
    if (!background_base64) return;

    // Save user's custom background settings for future templates
    set_user_background_type(background_type);
    set_user_background_color(background_color);
    set_user_gradient_start(gradient_start);
    set_user_gradient_end(gradient_end);
    set_user_gradient_direction(gradient_direction);
    set_has_user_background_settings(true);

    // Always use the background layer - never replace the main image
    const new_state = {
      ...canvas_state,
      background_base64: background_base64,
      // Keep the main image_base64 intact
    };
    
    set_canvas_state(save_to_history(new_state));
    draw_canvas(new_state);

    track("Background Applied", {
      plan: plan || "unknown",
      background_type,
      canvas_width: canvas_state.canvas_width,
      canvas_height: canvas_state.canvas_height,
      is_template: !!current_template,
      has_existing_image: !!canvas_state.image_base64,
    });
  }, [create_custom_background, canvas_state, save_to_history, background_type, background_color, gradient_start, gradient_end, gradient_direction, current_template, plan, draw_canvas, set_canvas_state]);



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
  }, [text_input, text_size, text_color, text_font, text_weight, canvas_state, save_to_history, plan, viewport_to_canvas, draw_canvas, set_canvas_state, viewport_dimensions.height, viewport_dimensions.width]);

  // Delete selected text element
  const delete_selected_text = useCallback(() => {
    if (!selected_text_id) return;

    const text_element = canvas_state.text_elements.find(t => t.id === selected_text_id);
    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.filter(t => t.id !== selected_text_id),
    };

    set_canvas_state(save_to_history(new_state));
    set_selected_text_id(null);
    draw_canvas(new_state);

    // Track text deletion
    track("Image Editor Text Deleted", {
      plan: plan || "unknown",
      text_length: text_element?.text.length || 0,
      font_size: text_element?.font_size || 0,
      remaining_text_elements: new_state.text_elements.length,
    });
  }, [selected_text_id, canvas_state, save_to_history, draw_canvas, set_canvas_state, plan]);

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
  }, [canvas_state, selected_text_id, draw_canvas, set_canvas_state]);

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
  }, [canvas_state, selected_text_id, save_to_history, draw_canvas, set_canvas_state]);

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
  }, [canvas_state, save_to_history, draw_canvas, set_canvas_state]);

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
  }, [canvas_state, save_to_history, draw_canvas, set_canvas_state]);

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
  }, [canvas_state, save_to_history, draw_canvas, set_canvas_state]);

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
  }, [canvas_state, save_to_history, draw_canvas, set_canvas_state]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas_state, dragging_layer_index, save_to_history]);

  const handle_layer_drag_end = useCallback(() => {
    set_dragging_layer_index(null);
    set_drag_over_layer_index(null);
  }, []);

  // Handle canvas double click
  const handle_canvas_double_click = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const viewport_x = event.clientX - rect.left;
    const viewport_y = event.clientY - rect.top;
    const canvas_coords = viewport_to_canvas(viewport_x, viewport_y);

    // Check if double-clicked on the image
    if (canvas_state.image_base64 && canvas_state.image_transform) {
      const transform = canvas_state.image_transform;
      const within_image = canvas_coords.x >= transform.x && 
                          canvas_coords.x <= transform.x + transform.width * transform.scale_x &&
                          canvas_coords.y >= transform.y && 
                          canvas_coords.y <= transform.y + transform.height * transform.scale_y;
      
      if (within_image) {
        set_is_image_selected(true);
        set_selected_text_id(null);
        // Deselect all text elements
        const new_state = {
          ...canvas_state,
          text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })),
        };
        set_canvas_state(new_state);
        draw_canvas(new_state);
        return;
      }
    }

    // Check if double-clicked on text element
    const clicked_text = canvas_state.text_elements.find(text_element => {
      const distance = Math.sqrt(
        Math.pow(canvas_coords.x - text_element.x, 2) + Math.pow(canvas_coords.y - text_element.y, 2)
      );
      return distance < text_element.font_size;
    });

    if (clicked_text) {
      set_is_image_selected(false);
      set_selected_text_id(clicked_text.id);
      
      // Update state to select this text
      const new_state = {
        ...canvas_state,
        text_elements: canvas_state.text_elements.map(t => ({
          ...t,
          selected: t.id === clicked_text.id,
        })),
      };
      set_canvas_state(new_state);
      
      // Update text panel values
      set_text_input(clicked_text.text);
      set_text_color(clicked_text.color);
      set_text_size(clicked_text.font_size);
      set_text_font(clicked_text.font_family);
      set_text_weight(clicked_text.font_weight);
      set_show_text_panel(true);
      
      draw_canvas(new_state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas_state, viewport_to_canvas]);

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

    // Check if clicked on text element first (priority over image)
    const clicked_text = canvas_state.text_elements.find(text_element => {
      const distance = Math.sqrt(
        Math.pow(canvas_coords.x - text_element.x, 2) + Math.pow(canvas_coords.y - text_element.y, 2)
      );
      return distance < text_element.font_size;
    });

    if (clicked_text) {
      if (selected_text_id === clicked_text.id) {
        // Text is already selected, start dragging
        set_is_dragging_text(true);
        set_drag_offset({
          x: canvas_coords.x - clicked_text.x,
          y: canvas_coords.y - clicked_text.y,
        });
      } else {
        // Select the text
        set_is_image_selected(false);
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
        
        draw_canvas(new_state);
      }
      return;
    }

    // Check if clicked on a resize handle
    if (is_image_selected && canvas_state.image_transform) {
      const transform = canvas_state.image_transform;
      const handle_size = 8 / canvas_state.zoom;
      const handles = [
        { name: 'tl', x: transform.x, y: transform.y },
        { name: 'tr', x: transform.x + transform.width * transform.scale_x, y: transform.y },
        { name: 'bl', x: transform.x, y: transform.y + transform.height * transform.scale_y },
        { name: 'br', x: transform.x + transform.width * transform.scale_x, y: transform.y + transform.height * transform.scale_y },
        { name: 'tc', x: transform.x + (transform.width * transform.scale_x) / 2, y: transform.y },
        { name: 'bc', x: transform.x + (transform.width * transform.scale_x) / 2, y: transform.y + transform.height * transform.scale_y },
        { name: 'lc', x: transform.x, y: transform.y + (transform.height * transform.scale_y) / 2 },
        { name: 'rc', x: transform.x + transform.width * transform.scale_x, y: transform.y + (transform.height * transform.scale_y) / 2 },
      ];
      
      const clicked_handle = handles.find(handle => {
        return Math.abs(canvas_coords.x - handle.x) < handle_size / 2 && 
               Math.abs(canvas_coords.y - handle.y) < handle_size / 2;
      });
      
      if (clicked_handle) {
        set_is_resizing_image(true);
        set_resize_handle(clicked_handle.name);
        set_resize_start({
          x: canvas_coords.x,
          y: canvas_coords.y,
          width: transform.width * transform.scale_x,
          height: transform.height * transform.scale_y,
          original_x: transform.x,
          original_y: transform.y,
        });
        return;
      }
    }
    
    // Check if clicked on the image
    if (canvas_state.image_base64 && canvas_state.image_transform) {
      const transform = canvas_state.image_transform;
      const within_image = canvas_coords.x >= transform.x && 
                          canvas_coords.x <= transform.x + transform.width * transform.scale_x &&
                          canvas_coords.y >= transform.y && 
                          canvas_coords.y <= transform.y + transform.height * transform.scale_y;
      
      if (within_image) {
        if (is_image_selected) {
          // Image is already selected, start moving
          set_is_moving_image(true);
          set_move_start({
            x: canvas_coords.x,
            y: canvas_coords.y,
            image_x: transform.x,
            image_y: transform.y,
          });
        } else {
          // Select the image
          set_is_image_selected(true);
          set_selected_text_id(null);
          // Deselect all text elements
          const new_state = {
            ...canvas_state,
            text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })),
          };
          set_canvas_state(new_state);
          draw_canvas(new_state);
        }
        return;
      }
    }

    // Deselect all if clicked on empty space
    const new_state = {
      ...canvas_state,
      text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })),
    };
    set_canvas_state(new_state);
    set_selected_text_id(null);
    set_is_image_selected(false);
    
    // Reset text panel to defaults for new text
    set_text_input("");
    set_text_color("#ffffff");
    set_text_size(48);
    set_text_font("Arial");
    set_text_weight("normal");
    
    draw_canvas(new_state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas_state, active_tool, viewport_to_canvas, is_image_selected, selected_text_id]);

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

    // Handle image moving
    if (is_moving_image && canvas_state.image_transform) {
      const rect = canvas.getBoundingClientRect();
      const viewport_x = event.clientX - rect.left;
      const viewport_y = event.clientY - rect.top;
      const canvas_coords = viewport_to_canvas(viewport_x, viewport_y);
      
      const dx = canvas_coords.x - move_start.x;
      const dy = canvas_coords.y - move_start.y;
      
      const new_transform = {
        ...canvas_state.image_transform,
        x: move_start.image_x + dx,
        y: move_start.image_y + dy,
      };
      
      // Transform is updated via canvas_state
      const new_state = {
        ...canvas_state,
        image_transform: new_transform,
      };
      set_canvas_state(new_state);
      draw_canvas(new_state);
      return;
    }

    // Handle image resizing
    if (is_resizing_image && resize_handle && canvas_state.image_transform) {
      const rect = canvas.getBoundingClientRect();
      const viewport_x = event.clientX - rect.left;
      const viewport_y = event.clientY - rect.top;
      const canvas_coords = viewport_to_canvas(viewport_x, viewport_y);
      
      const dx = canvas_coords.x - resize_start.x;
      const dy = canvas_coords.y - resize_start.y;
      
      const new_transform = { ...canvas_state.image_transform };
      const original_x = resize_start.original_x;
      const original_y = resize_start.original_y;
      const original_scaled_width = resize_start.width;
      const original_scaled_height = resize_start.height;
      
      switch (resize_handle) {
        case 'br': // Bottom right - anchor at top-left
          new_transform.scale_x = Math.max(0.1, (resize_start.width + dx) / new_transform.width);
          new_transform.scale_y = Math.max(0.1, (resize_start.height + dy) / new_transform.height);
          break;
          
        case 'tl': // Top left - anchor at bottom-right
          const new_width_tl = Math.max(new_transform.width * 0.1, resize_start.width - dx);
          const new_height_tl = Math.max(new_transform.height * 0.1, resize_start.height - dy);
          new_transform.scale_x = new_width_tl / new_transform.width;
          new_transform.scale_y = new_height_tl / new_transform.height;
          // Keep bottom-right corner fixed
          new_transform.x = original_x + original_scaled_width - (new_transform.width * new_transform.scale_x);
          new_transform.y = original_y + original_scaled_height - (new_transform.height * new_transform.scale_y);
          break;
          
        case 'tr': // Top right - anchor at bottom-left
          const new_width_tr = Math.max(new_transform.width * 0.1, resize_start.width + dx);
          const new_height_tr = Math.max(new_transform.height * 0.1, resize_start.height - dy);
          new_transform.scale_x = new_width_tr / new_transform.width;
          new_transform.scale_y = new_height_tr / new_transform.height;
          // Keep bottom-left corner fixed
          new_transform.y = original_y + original_scaled_height - (new_transform.height * new_transform.scale_y);
          break;
          
        case 'bl': // Bottom left - anchor at top-right
          const new_width_bl = Math.max(new_transform.width * 0.1, resize_start.width - dx);
          const new_height_bl = Math.max(new_transform.height * 0.1, resize_start.height + dy);
          new_transform.scale_x = new_width_bl / new_transform.width;
          new_transform.scale_y = new_height_bl / new_transform.height;
          // Keep top-right corner fixed
          new_transform.x = original_x + original_scaled_width - (new_transform.width * new_transform.scale_x);
          break;
          
        case 'tc': // Top center - anchor at bottom
          const new_height_tc = Math.max(new_transform.height * 0.1, resize_start.height - dy);
          new_transform.scale_y = new_height_tc / new_transform.height;
          // Keep bottom edge fixed
          new_transform.y = original_y + original_scaled_height - (new_transform.height * new_transform.scale_y);
          break;
          
        case 'bc': // Bottom center - anchor at top
          new_transform.scale_y = Math.max(0.1, (resize_start.height + dy) / new_transform.height);
          break;
          
        case 'lc': // Left center - anchor at right
          const new_width_lc = Math.max(new_transform.width * 0.1, resize_start.width - dx);
          new_transform.scale_x = new_width_lc / new_transform.width;
          // Keep right edge fixed
          new_transform.x = original_x + original_scaled_width - (new_transform.width * new_transform.scale_x);
          break;
          
        case 'rc': // Right center - anchor at left
          new_transform.scale_x = Math.max(0.1, (resize_start.width + dx) / new_transform.width);
          break;
      }
      
      // Transform is updated via canvas_state
      const new_state = {
        ...canvas_state,
        image_transform: new_transform,
      };
      set_canvas_state(new_state);
      draw_canvas(new_state);
      return;
    }

    if (!is_dragging_text || !selected_text_id) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_panning, is_dragging_text, selected_text_id, active_tool, canvas_state, drag_offset, last_pan_position, viewport_to_canvas, is_resizing_image, resize_handle, resize_start, is_moving_image, move_start]);

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
    if (is_resizing_image) {
      set_is_resizing_image(false);
      set_resize_handle(null);
      // Save to history when resize ends
      set_canvas_state(prev => save_to_history(prev));
    }
    if (is_moving_image) {
      set_is_moving_image(false);
      // Save to history when move ends
      set_canvas_state(prev => save_to_history(prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_panning, is_dragging_text, is_resizing_image, is_moving_image, save_to_history]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Draw background layer first if exists
      if (canvas_state.background_base64 && cached_background.current) {
        export_ctx.drawImage(cached_background.current, 0, 0, canvas_state.canvas_width, canvas_state.canvas_height);
      }

      // Draw main image layer if exists
      if (canvas_state.image_base64 && cached_image.current) {
        const transform = canvas_state.image_transform || {
          x: 0,
          y: 0,
          width: canvas_state.canvas_width,
          height: canvas_state.canvas_height,
          scale_x: 1,
          scale_y: 1,
        };
        
        export_ctx.save();
        // Draw image at its position with scaling
        export_ctx.drawImage(
          cached_image.current, 
          transform.x, 
          transform.y, 
          transform.width * transform.scale_x, 
          transform.height * transform.scale_y
        );
        export_ctx.restore();
      }

      // Draw text elements on top
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
        has_background: !!canvas_state.background_base64,
        has_image: !!canvas_state.image_base64,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas_state]);

  // Check for transferred image from image generator on mount
  useEffect(() => {
    const transferred_data = localStorage.getItem('imageEditorTransfer');
    if (transferred_data) {
      try {
        const image_data = JSON.parse(transferred_data);
        // Check if transfer is recent (within 5 minutes)
        if (Date.now() - image_data.timestamp < 5 * 60 * 1000) {
          // Load the image into the editor
          const base64_without_prefix = image_data.base64.split(',')[1] || image_data.base64;
          update_canvas_state({
            image_base64: base64_without_prefix,
            // Reset transform to fit the image
            image_transform: {
              x: 0,
              y: 0,
              width: canvas_state.canvas_width,
              height: canvas_state.canvas_height,
              scale_x: 1,
              scale_y: 1,
            }
          });
          
          // Save the updated state to history
          set_canvas_state(prev => save_to_history(prev));
          
          // Show success message
          set_error_message(null);
          track('image_transferred_to_editor', { from: 'image_generator' });
        }
        // Clean up after loading
        localStorage.removeItem('imageEditorTransfer');
      } catch (error) {
        console.error('Failed to load transferred image:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Redraw canvas when state changes
  useEffect(() => {
    draw_canvas(canvas_state);
  }, [canvas_state, draw_canvas, show_grid]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      // Save shortcut (Ctrl/Cmd + S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save_session();
      }
    };

    window.addEventListener('keydown', handle_keydown);
    return () => window.removeEventListener('keydown', handle_keydown);
  }, [save_session]);

  // Center project area on initial load or viewport change
  useEffect(() => {
    if (viewport_dimensions.width > 0 && viewport_dimensions.height > 0 && 
        canvas_state.zoom === 1 && canvas_state.pan_x === 0 && canvas_state.pan_y === 0) {
      // Only center if we're at default zoom/pan (initial state)
      const initial_zoom = Math.min(
        (viewport_dimensions.width * 0.7) / canvas_state.canvas_width,
        (viewport_dimensions.height * 0.7) / canvas_state.canvas_height,
        2 // Max zoom
      );
      
      // Center the project area
      const centered_pan_x = (viewport_dimensions.width - canvas_state.canvas_width * initial_zoom) / 2;
      const centered_pan_y = (viewport_dimensions.height - canvas_state.canvas_height * initial_zoom) / 2;
      
      const updated_state = {
        ...canvas_state,
        zoom: initial_zoom,
        pan_x: centered_pan_x,
        pan_y: centered_pan_y,
      };
      set_canvas_state(updated_state);
      draw_canvas(updated_state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport_dimensions.width, viewport_dimensions.height]);

  // Initialize canvas and load image from localStorage if available
  useEffect(() => {
    const stored_image = localStorage.getItem('image_editor_image');
    if (stored_image) {
      const img = new window.Image();
      img.onload = () => {
        // Use current full-page viewport dimensions for stored image
        const current_viewport = viewport_dimensions;
        
        const initial_zoom = Math.min(
          (current_viewport.width * 0.7) / img.width,
          (current_viewport.height * 0.7) / img.height,
          2
        );

        const new_state = {
          ...canvas_state,
          image_base64: stored_image,
          canvas_width: img.width,
          canvas_height: img.height,
          text_elements: [],
          zoom: initial_zoom,
          pan_x: (current_viewport.width - img.width * initial_zoom) / 2,
          pan_y: (current_viewport.height - img.height * initial_zoom) / 2,
          image_transform: {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
            scale_x: 1,
            scale_y: 1,
          },
        };
        set_canvas_state(save_to_history(new_state));
        // Image transform is now part of canvas_state
        draw_canvas(new_state);
      };
      img.src = `data:image/png;base64,${stored_image}`;
      // Clear the stored image after loading
      localStorage.removeItem('image_editor_image');
    } else {
      draw_canvas(canvas_state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      <Image_editor_header
        canvas_state={canvas_state}
        on_undo={undo}
        on_redo={redo}
        on_zoom_in={zoom_in}
        on_zoom_out={zoom_out}
        on_reset_zoom={reset_zoom}
        on_export={export_image}
        // Session management
        session_name={session_name}
        is_saving={is_saving}
        last_saved={last_saved}
        sessions_list={sessions_list}
        on_save={() => save_session()}
        on_save_as={(name) => save_session(name)}
        on_load_session={async (session_id) => {
          const loaded_state = await load_session(session_id);
          if (loaded_state) {
            set_canvas_state(loaded_state);
            // Image transform is loaded with canvas_state
            draw_canvas(loaded_state);
          }
        }}
        on_new_session={async () => {
          if (confirm('Create a new project? Any unsaved changes will be lost.')) {
            await new_session();
            const initial_state = {
              image_base64: null,
              background_base64: null,
              text_elements: [],
              canvas_width: 800,
              canvas_height: 600,
              zoom: 1,
              pan_x: 0,
              pan_y: 0,
              history: [],
              history_index: 0,
              image_transform: {
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                scale_x: 1,
                scale_y: 1,
              },
            };
            set_canvas_state(initial_state);
            // Image transform is part of initial_state
            set_is_image_selected(false);
            set_selected_text_id(null);
            draw_canvas(initial_state);
          }
        }}
        on_export_session={export_session}
        on_import_session={async (file) => {
          try {
            const loaded_state = await import_session(file);
            if (loaded_state) {
              set_canvas_state(loaded_state);
              // Image transform is loaded with canvas_state
              draw_canvas(loaded_state);
            }
          } catch {
            set_error_message('Failed to import session');
          }
        }}
      />

      <div className="flex-1 flex min-h-0">
        <Image_editor_toolbar
          active_tool={active_tool}
          show_templates={show_templates}
          show_grid={show_grid}
          show_background_panel={show_background_panel}
          show_image_panel={show_image_panel}
          selected_text_id={selected_text_id}
          has_image={!!canvas_state.image_base64}
          is_image_selected={is_image_selected}
          on_tool_change={set_active_tool}
          on_toggle_templates={() => {
            set_show_templates(!show_templates);
            // Close other panels when opening templates
            if (!show_templates) {
              set_show_text_panel(false);
              set_show_background_panel(false);
              set_show_image_panel(false);
            }
          }}
          on_toggle_grid={() => set_show_grid(!show_grid)}
          on_toggle_text_panel={() => {
            set_show_text_panel(!show_text_panel);
            // Close other panels when opening text panel
            if (!show_text_panel) {
              set_show_templates(false);
              set_show_background_panel(false);
              set_show_image_panel(false);
            }
          }}
          on_toggle_background_panel={() => {
            set_show_background_panel(!show_background_panel);
            // Close other panels when opening background panel
            if (!show_background_panel) {
              set_show_templates(false);
              set_show_text_panel(false);
              set_show_image_panel(false);
            }
          }}
          on_toggle_image_panel={() => {
            set_show_image_panel(!show_image_panel);
            // Close other panels when opening image panel
            if (!show_image_panel) {
              set_show_templates(false);
              set_show_text_panel(false);
              set_show_background_panel(false);
            }
          }}
          on_delete_selected={delete_selected_text}
          on_clear_canvas={() => {
            if (confirm('Are you sure you want to clear the canvas? This will remove the image, background, and all text elements.')) {
              // Track before clearing
              track("Image Editor Canvas Cleared", {
                plan: plan || "unknown",
                had_image: !!canvas_state.image_base64,
                had_background: !!canvas_state.background_base64,
                text_elements_count: canvas_state.text_elements.length,
                had_template: !!current_template,
                canvas_width: canvas_state.canvas_width,
                canvas_height: canvas_state.canvas_height,
              });

              const new_state = {
                ...canvas_state,
                image_base64: null,
                background_base64: null,
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
              set_is_image_selected(false);
              // Reset image transform in canvas_state
              draw_canvas(new_state);
            }
          }}
          on_file_upload={() => file_input_ref.current?.click()}
        />

        {/* Templates Panel */}
        {show_templates && (
          <div className="w-80 bg-base-100 border-r border-base-300 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Templates</h3>
                <p className="text-xs text-base-content/60 mt-1">Set workspace size for your project</p>
              </div>
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
        <div className="flex-1 flex min-h-0">
          <div 
            className="flex-1 min-h-0 p-4 overflow-hidden flex  h-full w-full"
            onDragEnter={handle_drag_enter}
            onDragLeave={handle_drag_leave}
            onDragOver={handle_drag_over}
            onDrop={handle_drop}
          >
            <div className={`relative w-full h-full ${drag_over ? 'ring-2 ring-primary ring-offset-2' : 'flex items-center justify-center'}`}>
              {is_loading && (
                <div className="absolute inset-0 bg-base-100 bg-opacity-75 flex items-center justify-center z-10 rounded">
                  <div className="loading loading-spinner loading-lg"></div>
                </div>
              )}
              
              {!canvas_state.image_base64 ? (
                // Upload prompt when no image
                <div 
                  className={`w-full h-full max-h-[500px] max-w-[500px] mx-auto border-2 border-dashed border-base-300 p-8 rounded-lg cursor-pointer hover:border-primary transition-colors ${drag_over ? 'border-primary bg-primary bg-opacity-5' : ''}`}
                  onClick={() => file_input_ref.current?.click()}
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
                // Full-page canvas
                <div className="relative w-full h-full min-h-[400px]">
                  <canvas
                    ref={canvas_ref}
                    className={`block w-full h-full min-h-[400px] ${
                      active_tool === 'pan' ? 'cursor-grab' : 
                      is_moving_image || is_dragging_text ? 'cursor-move' :
                      'cursor-pointer'
                    } ${is_panning ? 'cursor-grabbing' : ''}`}
                    onMouseDown={handle_canvas_mouse_down}
                    onDoubleClick={handle_canvas_double_click}
                    onMouseMove={handle_canvas_mouse_move}
                    onMouseUp={handle_canvas_mouse_up}
                    onMouseLeave={handle_canvas_mouse_up}
                    onWheel={handle_wheel}
                  />
                  
                  {/* Zoom indicator */}
                  <div className="absolute top-2 left-2 bg-base-100 text-base-content px-2 py-1 rounded text-xs border border-base-300">
                    {Math.round(canvas_state.zoom * 100)}%
                  </div>
                  
                  {/* Tool instruction */}
                  <div className="absolute top-2 right-2 bg-base-100 text-base-content px-2 py-1 rounded text-xs border border-base-300">
                    {active_tool === 'pan' && 'Drag to pan • Scroll to zoom'}
                    {active_tool === 'text' && 'Click to add text'}
                    {active_tool === 'select' && 'Click to select • Double-click for quick select • Drag selected to move'}
                    {is_moving_image && 'Moving image...'}
                    {is_dragging_text && 'Moving text...'}
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

                {/* Layer Information */}
                <div className="border border-base-300 rounded p-3 bg-base-50">
                  <h4 className="font-medium text-sm mb-2">Active Layers</h4>
                  <div className="space-y-1 text-xs">
                    {canvas_state.background_base64 && (
                      <div className="flex items-center gap-2 text-base-content/70">
                        <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        Background Layer
                      </div>
                    )}
                    {canvas_state.image_base64 && (
                      <div className="flex items-center gap-2 text-base-content/70">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        Main Image
                      </div>
                    )}
                    {canvas_state.text_elements.length > 0 && (
                      <div className="flex items-center gap-2 text-base-content/70">
                        <div className="w-2 h-2 bg-purple-500 rounded"></div>
                        {canvas_state.text_elements.length} Text Element(s)
                      </div>
                    )}
                    {!canvas_state.background_base64 && !canvas_state.image_base64 && canvas_state.text_elements.length === 0 && (
                      <div className="text-base-content/50 italic">No layers</div>
                    )}
                  </div>
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

          {/* Background Panel */}
          {show_background_panel && (
            <div className="w-80 bg-base-100 border-l border-base-300 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Background</h3>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => set_show_background_panel(false)}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Background Type */}
                <div>
                  <label className="label">
                    <span className="label-text">Background Type</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      className={`btn btn-sm flex-1 ${background_type === 'color' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => set_background_type('color')}
                    >
                      Solid Color
                    </button>
                    <button
                      className={`btn btn-sm flex-1 ${background_type === 'gradient' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => set_background_type('gradient')}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {/* Background Color (for solid color) */}
                {background_type === 'color' && (
                  <div>
                    <label className="label">
                      <span className="label-text">Color</span>
                    </label>
                    <input
                      type="color"
                      className="w-full h-10 rounded border border-base-300"
                      value={background_color}
                      onChange={(e) => set_background_color(e.target.value)}
                    />
                  </div>
                )}

                {/* Gradient Settings */}
                {background_type === 'gradient' && (
                  <>
                    <div>
                      <label className="label">
                        <span className="label-text">Gradient Start</span>
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 rounded border border-base-300"
                        value={gradient_start}
                        onChange={(e) => set_gradient_start(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text">Gradient End</span>
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 rounded border border-base-300"
                        value={gradient_end}
                        onChange={(e) => set_gradient_end(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text">Direction</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={gradient_direction}
                        onChange={(e) => set_gradient_direction(e.target.value as 'horizontal' | 'vertical' | 'diagonal')}
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                        <option value="diagonal">Diagonal</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Preview */}
                <div>
                  <label className="label">
                    <span className="label-text">Preview</span>
                  </label>
                  <div 
                    className="w-full h-16 rounded border border-base-300 mb-4"
                    style={{
                      background: background_type === 'color' 
                        ? background_color
                        : `linear-gradient(${
                            gradient_direction === 'horizontal' ? '90deg' :
                            gradient_direction === 'vertical' ? '0deg' : '45deg'
                          }, ${gradient_start}, ${gradient_end})`
                    }}
                  />
                </div>

                {/* Apply Button */}
                <button
                  className="btn btn-primary w-full"
                  onClick={apply_background}
                >
                  Apply Background
                </button>

                {/* Help Text */}
                <div className="text-xs text-base-content/50 p-2 bg-base-200 rounded">
                  💡 Background appears behind your image and text. This won&apos;t replace your current image - it creates a separate background layer.
                </div>
              </div>
            </div>
          )}


          {/* Image Properties Panel */}
          {show_image_panel && is_image_selected && canvas_state.image_transform && 
           canvas_state.image_transform.x !== undefined && 
           canvas_state.image_transform.y !== undefined && 
           canvas_state.image_transform.width !== undefined && 
           canvas_state.image_transform.height !== undefined && 
           canvas_state.image_transform.scale_x !== undefined && 
           canvas_state.image_transform.scale_y !== undefined && (
            <div className="w-80 bg-base-100 border-l border-base-300 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Image Properties</h3>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => set_show_image_panel(false)}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Size Controls */}
                <div>
                  <h4 className="font-medium mb-3">Size</h4>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">Width</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-full"
                        value={canvas_state.image_transform ? Math.round(canvas_state.image_transform.width * canvas_state.image_transform.scale_x) : 0}
                        onChange={(e) => {
                          if (!canvas_state.image_transform) return;
                          const new_width = parseInt(e.target.value) || 1;
                          const new_scale_x = new_width / canvas_state.image_transform.width;
                          const new_transform = {
                            x: canvas_state.image_transform.x,
                            y: canvas_state.image_transform.y,
                            width: canvas_state.image_transform.width,
                            height: canvas_state.image_transform.height,
                            scale_x: new_scale_x,
                            scale_y: canvas_state.image_transform.scale_y,
                          };
                          // Transform is updated via canvas_state
                          const new_state = {
                            ...canvas_state,
                            image_transform: new_transform,
                          };
                          set_canvas_state(save_to_history(new_state));
                          draw_canvas(new_state);
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">Height</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-full"
                        value={canvas_state.image_transform ? Math.round(canvas_state.image_transform.height * canvas_state.image_transform.scale_y) : 0}
                        onChange={(e) => {
                          if (!canvas_state.image_transform) return;
                          const new_height = parseInt(e.target.value) || 1;
                          const new_scale_y = new_height / canvas_state.image_transform.height;
                          const new_transform = {
                            ...canvas_state.image_transform,
                            scale_y: new_scale_y,
                          };
                          // Transform is updated via canvas_state
                          const new_state = {
                            ...canvas_state,
                            image_transform: new_transform,
                          };
                          set_canvas_state(save_to_history(new_state));
                          draw_canvas(new_state);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Original Size Info */}
                  <div className="text-xs text-base-content/60 mb-3">
                    Original: {canvas_state.image_transform.width} × {canvas_state.image_transform.height}
                  </div>
                  
                  {/* Reset Size Button */}
                  <button
                    className="btn btn-sm btn-outline w-full"
                    onClick={() => {
                      if (!canvas_state.image_transform) return;
                      const new_transform = {
                        ...canvas_state.image_transform,
                        scale_x: 1,
                        scale_y: 1,
                      };
                      // Transform is updated via canvas_state
                      const new_state = {
                        ...canvas_state,
                        image_transform: new_transform,
                      };
                      set_canvas_state(save_to_history(new_state));
                      draw_canvas(new_state);
                    }}
                  >
                    Reset to Original Size
                  </button>
                </div>

                {/* Position Controls */}
                <div>
                  <h4 className="font-medium mb-3">Position</h4>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">X</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-full"
                        value={Math.round(canvas_state.image_transform.x)}
                        onChange={(e) => {
                          if (!canvas_state.image_transform) return;
                          const new_x = parseInt(e.target.value) || 0;
                          const new_transform = {
                            x: new_x,
                            y: canvas_state.image_transform.y,
                            width: canvas_state.image_transform.width,
                            height: canvas_state.image_transform.height,
                            scale_x: canvas_state.image_transform.scale_x,
                            scale_y: canvas_state.image_transform.scale_y,
                          };
                          // Transform is updated via canvas_state
                          const new_state = {
                            ...canvas_state,
                            image_transform: new_transform,
                          };
                          set_canvas_state(save_to_history(new_state));
                          draw_canvas(new_state);
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="label">
                        <span className="label-text text-xs">Y</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered input-sm w-full"
                        value={Math.round(canvas_state.image_transform.y)}
                        onChange={(e) => {
                          if (!canvas_state.image_transform) return;
                          const new_y = parseInt(e.target.value) || 0;
                          const new_transform = {
                            x: canvas_state.image_transform.x,
                            y: new_y,
                            width: canvas_state.image_transform.width,
                            height: canvas_state.image_transform.height,
                            scale_x: canvas_state.image_transform.scale_x,
                            scale_y: canvas_state.image_transform.scale_y,
                          };
                          // Transform is updated via canvas_state
                          const new_state = {
                            ...canvas_state,
                            image_transform: new_transform,
                          };
                          set_canvas_state(save_to_history(new_state));
                          draw_canvas(new_state);
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Center Image Button */}
                  <button
                    className="btn btn-sm btn-outline w-full"
                    onClick={() => {
                      if (!canvas_state.image_transform) return;
                      const centered_x = (canvas_state.canvas_width - canvas_state.image_transform.width * canvas_state.image_transform.scale_x) / 2;
                      const centered_y = (canvas_state.canvas_height - canvas_state.image_transform.height * canvas_state.image_transform.scale_y) / 2;
                      const new_transform = {
                        x: centered_x,
                        y: centered_y,
                        width: canvas_state.image_transform.width,
                        height: canvas_state.image_transform.height,
                        scale_x: canvas_state.image_transform.scale_x,
                        scale_y: canvas_state.image_transform.scale_y,
                      };
                      // Transform is updated via canvas_state
                      const new_state = {
                        ...canvas_state,
                        image_transform: new_transform,
                      };
                      set_canvas_state(save_to_history(new_state));
                      draw_canvas(new_state);
                    }}
                  >
                    Center Image
                  </button>
                </div>

                {/* Help Text */}
                <div className="text-xs text-base-content/50 p-2 bg-base-200 rounded">
                  💡 Click and drag the resize handles on the image to resize, or use the controls above for precise adjustments.
                </div>
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
                  <div className="text-xs opacity-70">Replace with template&apos;s background design</div>
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
                      // If checked, apply the default behavior (keep image) and don&apos;t show again
                      handle_template_confirmation(true, true);
                    }
                  }}
                />
                <span className="text-sm text-base-content/70">
                  Don&apos;t show this again (always keep my image)
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