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
} from "lucide-react";
import Image from "next/image";
import { track } from "@vercel/analytics";

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
  history: string[];
  history_index: number;
}

export default function Image_editor() {
  const { refresh_mp, plan } = useContext(MpContext);
  
  // Canvas state
  const [canvas_state, set_canvas_state] = useState<Canvas_state>({
    image_base64: null,
    text_elements: [],
    canvas_width: 400,
    canvas_height: 300,
    zoom: 1,
    history: [],
    history_index: -1,
  });

  // UI state
  const [is_loading, set_is_loading] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [active_tool, set_active_tool] = useState<'select' | 'text' | 'move'>('select');
  const [selected_text_id, set_selected_text_id] = useState<string | null>(null);
  const [show_text_panel, set_show_text_panel] = useState(false);
  const [drag_over, set_drag_over] = useState(false);

  // Text editing state
  const [text_input, set_text_input] = useState("");
  const [text_color, set_text_color] = useState("#ffffff");
  const [text_size, set_text_size] = useState(48);
  const [text_font, set_text_font] = useState("Arial");
  const [text_weight, set_text_weight] = useState("normal");

  // Refs
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const file_input_ref = useRef<HTMLInputElement>(null);

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

  // Save state to history
  const save_to_history = useCallback((state: Canvas_state) => {
    const history_entry = JSON.stringify({
      image_base64: state.image_base64,
      text_elements: state.text_elements,
    });
    
    const new_history = state.history.slice(0, state.history_index + 1);
    new_history.push(history_entry);
    
    return {
      ...state,
      history: new_history,
      history_index: new_history.length - 1,
    };
  }, []);

  // Process uploaded file
  const process_file = useCallback((file: File) => {
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
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        // Limit maximum dimensions to keep UI responsive
        let { width, height } = img;
        const max_dimension = 1920;
        
        if (width > max_dimension || height > max_dimension) {
          const scale = max_dimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const new_state = {
          ...canvas_state,
          image_base64: base64.split(',')[1], // Remove data:image/... prefix
          canvas_width: width,
          canvas_height: height,
          text_elements: [],
        };
        set_canvas_state(save_to_history(new_state));
        draw_canvas(new_state);
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
  }, [canvas_state, save_to_history]);

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

  // Draw canvas
  const draw_canvas = useCallback((state: Canvas_state) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = state.canvas_width;
    canvas.height = state.canvas_height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if exists
    if (state.image_base64) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, state.canvas_width, state.canvas_height);
        
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
      };
      img.src = `data:image/png;base64,${state.image_base64}`;
    }
  }, []);

  // Add text element
  const add_text_element = useCallback(() => {
    if (!text_input.trim()) return;

    const new_text_element: Text_element = {
      id: Date.now().toString(),
      text: text_input,
      x: canvas_state.canvas_width / 2,
      y: canvas_state.canvas_height / 2,
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
  }, [text_input, text_size, text_color, text_font, text_weight, canvas_state, save_to_history, plan]);

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

  // Handle canvas click
  const handle_canvas_click = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas_state.canvas_width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas_state.canvas_height;

    // Check if clicked on text element
    const clicked_text = canvas_state.text_elements.find(text_element => {
      const distance = Math.sqrt(
        Math.pow(x - text_element.x, 2) + Math.pow(y - text_element.y, 2)
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
      draw_canvas(new_state);
    } else {
      // Deselect all
      const new_state = {
        ...canvas_state,
        text_elements: canvas_state.text_elements.map(t => ({ ...t, selected: false })),
      };
      set_canvas_state(new_state);
      set_selected_text_id(null);
      draw_canvas(new_state);
    }
  }, [canvas_state]);

  // Export image
  const export_image = useCallback(async () => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    try {
      const data_url = canvas.toDataURL('image/png');
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

  // Initialize canvas and load image from localStorage if available
  useEffect(() => {
    const stored_image = localStorage.getItem('image_editor_image');
    if (stored_image) {
      const img = new window.Image();
      img.onload = () => {
        const new_state = {
          ...canvas_state,
          image_base64: stored_image,
          canvas_width: img.width,
          canvas_height: img.height,
          text_elements: [],
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
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Image Editor</h1>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={undo}
              disabled={canvas_state.history_index <= 0}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={redo}
              disabled={canvas_state.history_index >= canvas_state.history.length - 1}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={export_image}
              disabled={!canvas_state.image_base64}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-16 bg-base-200 border-r border-base-300 flex flex-col items-center py-4 gap-2">
          <input
            type="file"
            ref={file_input_ref}
            onChange={handle_file_upload}
            accept="image/*"
            className="hidden"
          />
          <button
            className="btn btn-sm btn-square btn-ghost tooltip tooltip-right"
            data-tip="Upload Image"
            onClick={() => file_input_ref.current?.click()}
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            className={`btn btn-sm btn-square ${active_tool === 'text' ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
            data-tip="Add Text"
            onClick={() => {
              set_active_tool('text');
              set_show_text_panel(true);
            }}
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            className={`btn btn-sm btn-square ${active_tool === 'move' ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
            data-tip="Move Tool"
            onClick={() => set_active_tool('move')}
          >
            <Move className="w-4 h-4" />
          </button>
          {selected_text_id && (
            <button
              className="btn btn-sm btn-square btn-error tooltip tooltip-right"
              data-tip="Delete Selected"
              onClick={delete_selected_text}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex">
          <div 
            className="flex-1 p-4 overflow-auto"
            onDragEnter={handle_drag_enter}
            onDragLeave={handle_drag_leave}
            onDragOver={handle_drag_over}
            onDrop={handle_drop}
          >
            <div className="flex justify-center items-center min-h-full">
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
                  >
                    <div className="text-center space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-base-content opacity-50" />
                      <div>
                        <p className="text-lg font-medium">Upload an image to start editing</p>
                        <p className="text-sm text-base-content opacity-70">
                          Click here or drag and drop your image
                        </p>
                        <p className="text-xs text-base-content opacity-50 mt-2">
                          JPG, PNG, WEBP up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Canvas when image is loaded
                  <div className="border border-base-300 shadow-lg rounded overflow-hidden">
                    <canvas
                      ref={canvas_ref}
                      className="max-w-full max-h-full cursor-pointer block"
                      style={{
                        maxWidth: '90vw',
                        maxHeight: '70vh',
                        width: 'auto',
                        height: 'auto',
                      }}
                      onClick={handle_canvas_click}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text Panel */}
          {show_text_panel && (
            <div className="w-80 bg-base-200 border-l border-base-300 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Text Properties</h3>
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
                      onChange={(e) => set_text_input(e.target.value)}
                      placeholder="Enter text..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          add_text_element();
                        }
                      }}
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
                    onChange={(e) => set_text_font(e.target.value)}
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
                    onChange={(e) => set_text_size(parseInt(e.target.value))}
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
                    onChange={(e) => set_text_weight(e.target.value)}
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
                    className="w-full h-12 rounded cursor-pointer"
                    value={text_color}
                    onChange={(e) => set_text_color(e.target.value)}
                  />
                </div>

                {/* Color Presets */}
                <div>
                  <label className="label">
                    <span className="label-text">Quick Colors</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border-2 border-base-300"
                        style={{ backgroundColor: color }}
                        onClick={() => set_text_color(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
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
    </div>
  );
} 