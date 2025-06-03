"use client";

import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { create_node_component, node_data } from "./workflow_nodes";
import { 
  Save, 
  Play, 
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface workflow_editor_props {
  initial_nodes?: node_data[];
  on_save?: (nodes: node_data[], connections: connection[]) => void;
  on_run?: () => void;
  workflow_id?: string;
}

export interface workflow_editor_ref {
  get_current_data: () => { nodes: node_data[]; connections: connection[] };
}

interface connection {
  from: string;
  to: string;
}

interface drag_state {
  is_dragging: boolean;
  node_id: string | null;
  offset: { x: number; y: number };
}

const Workflow_editor = forwardRef<workflow_editor_ref, workflow_editor_props>((props, ref) => {
  const { initial_nodes = [], on_save, on_run } = props;
  const [nodes, set_nodes] = useState<node_data[]>(initial_nodes);
  const [connections, set_connections] = useState<connection[]>([]);
  const [selected_node, set_selected_node] = useState<string | null>(null);
  const [zoom, set_zoom] = useState(1);
  const [pan, set_pan] = useState({ x: 0, y: 0 });
  const [drag_state, set_drag_state] = useState<drag_state>({
    is_dragging: false,
    node_id: null,
    offset: { x: 0, y: 0 }
  });
  
  const canvas_ref = useRef<HTMLDivElement>(null);
  const [show_node_menu, set_show_node_menu] = useState(false);
  const [menu_position, set_menu_position] = useState({ x: 0, y: 0 });

  const node_types = [
    { type: "input", label: "Input", description: "User input entry point" },
    { type: "llm", label: "AI Chat", description: "Language model processing" },
    { type: "image_generator", label: "Image Gen", description: "Generate images from text" },
    { type: "video_generator", label: "Video Gen", description: "Generate videos from prompts" },
    { type: "text_analyzer", label: "Text Analyzer", description: "Analyze and process text" },
    { type: "conditional", label: "Conditional", description: "Branch based on conditions" },
    { type: "loop", label: "Loop", description: "Repeat operations" },
    { type: "output", label: "Output", description: "Final result output" }
  ];

  const handle_canvas_click = (e: React.MouseEvent) => {
    if (e.target === canvas_ref.current) {
      set_selected_node(null);
    }
  };

  const handle_canvas_right_click = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvas_ref.current?.getBoundingClientRect();
    if (rect) {
      set_menu_position({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      });
      set_show_node_menu(true);
    }
  };

  const add_node = (type: string) => {
    const new_node: node_data = {
      id: uuidv4(),
      type,
      position: menu_position,
      data: get_default_node_data(type)
    };
    
    set_nodes([...nodes, new_node]);
    set_show_node_menu(false);
  };

  const get_default_node_data = (type: string): Record<string, unknown> => {
    switch (type) {
      case "input":
        return { label: "User Input" };
      case "llm":
        return {
          label: "AI Assistant",
          prompt: "{{user_input}}",
          system_prompt: "You are a helpful assistant.",
          model: "grok-3-mini-latest"
        };
      case "image_generator":
        return {
          label: "Image Generator",
          prompt: "{{description}}",
          model: "fal-ai/flux/schnell"
        };
      case "output":
        return { label: "Response" };
      default:
        return { label: type };
    }
  };

  const update_node = (id: string, updates: Partial<node_data>) => {
    set_nodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const delete_node = (id: string) => {
    set_nodes(nodes.filter(node => node.id !== id));
    set_connections(connections.filter(conn => 
      conn.from !== id && conn.to !== id
    ));
  };

  const handle_mouse_down = (e: React.MouseEvent, node_id: string) => {
    const node = nodes.find(n => n.id === node_id);
    if (!node) return;
    
    set_drag_state({
      is_dragging: true,
      node_id,
      offset: {
        x: e.clientX - node.position.x * zoom - pan.x,
        y: e.clientY - node.position.y * zoom - pan.y
      }
    });
    set_selected_node(node_id);
  };

  const handle_mouse_move = (e: React.MouseEvent) => {
    if (drag_state.is_dragging && drag_state.node_id) {
      const new_x = (e.clientX - drag_state.offset.x - pan.x) / zoom;
      const new_y = (e.clientY - drag_state.offset.y - pan.y) / zoom;
      
      update_node(drag_state.node_id, {
        position: { x: new_x, y: new_y }
      });
    }
  };

  const handle_mouse_up = () => {
    set_drag_state({
      is_dragging: false,
      node_id: null,
      offset: { x: 0, y: 0 }
    });
  };

  const handle_save = () => {
    on_save?.(nodes, connections);
  };

  const handle_zoom_in = () => set_zoom(Math.min(zoom + 0.1, 2));
  const handle_zoom_out = () => set_zoom(Math.max(zoom - 0.1, 0.5));
  const handle_fit = () => {
    set_zoom(1);
    set_pan({ x: 0, y: 0 });
  };

  return (
    <div className="relative h-full w-full bg-base-200 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="join">
          <button
            onClick={handle_save}
            className="btn btn-sm join-item"
            title="Save workflow"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={on_run}
            className="btn btn-sm btn-primary join-item"
            title="Run workflow"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
        
        <div className="join">
          <button
            onClick={handle_zoom_out}
            className="btn btn-sm join-item"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handle_fit}
            className="btn btn-sm join-item"
            title="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handle_zoom_in}
            className="btn btn-sm join-item"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvas_ref}
        className="relative h-full w-full cursor-move"
        onClick={handle_canvas_click}
        onContextMenu={handle_canvas_right_click}
        onMouseMove={handle_mouse_move}
        onMouseUp={handle_mouse_up}
        onMouseLeave={handle_mouse_up}
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--bc) / 0.1) 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {/* Render connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
            {connections.map((conn, idx) => {
              const from_node = nodes.find(n => n.id === conn.from);
              const to_node = nodes.find(n => n.id === conn.to);
              if (!from_node || !to_node) return null;
              
              return (
                <line
                  key={idx}
                  x1={from_node.position.x + 200}
                  y1={from_node.position.y + 40}
                  x2={to_node.position.x}
                  y2={to_node.position.y + 40}
                  stroke="hsl(var(--p))"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Render nodes */}
          {nodes.map(node => {
            const NodeComponent = create_node_component(node.type);
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handle_mouse_down(e, node.id)}
              >
                <NodeComponent
                  node={{ ...node, selected: node.id === selected_node }}
                  on_update={update_node}
                  on_delete={delete_node}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add node menu */}
      {show_node_menu && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => set_show_node_menu(false)}
          />
          <div
            className="absolute z-30 bg-base-100 rounded-lg shadow-xl border border-base-300 p-2 min-w-[200px]"
            style={{
              left: `${menu_position.x * zoom + pan.x}px`,
              top: `${menu_position.y * zoom + pan.y}px`
            }}
          >
            <div className="text-sm font-semibold px-2 py-1 border-b border-base-300 mb-1">
              Add Node
            </div>
            {node_types.map(({ type, label, description }) => (
              <button
                key={type}
                onClick={() => add_node(type)}
                className="w-full text-left px-2 py-1 hover:bg-base-200 rounded flex flex-col"
              >
                <div className="font-medium">{label}</div>
                <div className="text-xs text-base-content/60">{description}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-base-100 rounded-lg p-3 text-xs max-w-xs">
        <div className="font-semibold mb-1">Quick Tips:</div>
        <ul className="space-y-1 text-base-content/70">
          <li>• Right-click canvas to add nodes</li>
          <li>• Drag nodes to move them</li>
          <li>• Click on nodes to select/edit</li>
          <li>• Connect nodes by dragging between connection points</li>
        </ul>
      </div>
    </div>
  );
}