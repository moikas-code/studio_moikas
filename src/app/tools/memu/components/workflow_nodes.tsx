"use client";

import React, { useState } from "react";
import { 
  MessageSquare, 
  Image, 
  Video, 
  FileText, 
  GitBranch, 
  Repeat,
  Play,
  Square,
  Settings,
  X
} from "lucide-react";

export interface node_data {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  selected?: boolean;
}

interface node_props {
  node: node_data;
  on_update?: (id: string, data: Partial<node_data>) => void;
  on_delete?: (id: string) => void;
  on_connect?: (from_id: string, to_id: string) => void;
}

// Base node component
const BaseNode: React.FC<node_props & { icon: React.ReactNode; color: string; title: string }> = ({
  node,
  on_update,
  on_delete,
  icon,
  color,
  title
}) => {
  const [show_settings, set_show_settings] = useState(false);

  return (
    <div
      className={`absolute bg-base-100 rounded-lg shadow-lg border-2 ${
        node.selected ? "border-primary" : "border-base-300"
      } min-w-[200px] transition-all duration-200 hover:shadow-xl`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        transform: node.selected ? "scale(1.05)" : "scale(1)"
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-3 rounded-t-lg bg-gradient-to-r ${color}`}>
        <div className="flex items-center gap-2 text-white">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => set_show_settings(!show_settings)}
            className="btn btn-ghost btn-xs text-white hover:bg-white/20"
          >
            <Settings className="w-4 h-4" />
          </button>
          {on_delete && (
            <button
              onClick={() => on_delete(node.id)}
              className="btn btn-ghost btn-xs text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {node.data.label && typeof node.data.label === 'string' ? (
          <div className="text-sm font-medium mb-2">{node.data.label as string}</div>
        ) : null}
        
        {show_settings && (
          <div className="space-y-2 text-sm">
            {node.data.prompt !== undefined && typeof node.data.prompt === 'string' && (
              <div>
                <label className="label text-xs">Prompt</label>
                <textarea
                  className="textarea textarea-bordered w-full textarea-sm"
                  value={node.data.prompt}
                  onChange={(e) => on_update?.(node.id, {
                    data: { ...node.data, prompt: e.target.value }
                  })}
                  rows={3}
                />
              </div>
            )}
            
            {node.data.system_prompt !== undefined && typeof node.data.system_prompt === 'string' && (
              <div>
                <label className="label text-xs">System Prompt</label>
                <textarea
                  className="textarea textarea-bordered w-full textarea-sm"
                  value={node.data.system_prompt}
                  onChange={(e) => on_update?.(node.id, {
                    data: { ...node.data, system_prompt: e.target.value }
                  })}
                  rows={2}
                />
              </div>
            )}
            
            {node.data.model !== undefined && typeof node.data.model === 'string' && (
              <div>
                <label className="label text-xs">Model</label>
                <select
                  className="select select-bordered w-full select-sm"
                  value={node.data.model}
                  onChange={(e) => on_update?.(node.id, {
                    data: { ...node.data, model: e.target.value }
                  })}
                >
                  <option value="grok-3-mini-latest">Grok 3 Mini Latest</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-base-100 cursor-pointer hover:scale-125 transition-transform" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-base-100 cursor-pointer hover:scale-125 transition-transform" />
    </div>
  );
};

// Specific node types
export const input_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<Play className="w-4 h-4" />} color="from-green-500 to-emerald-500" title="Input" />
);

export const output_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<Square className="w-4 h-4" />} color="from-red-500 to-rose-500" title="Output" />
);

export const llm_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<MessageSquare className="w-4 h-4" />} color="from-blue-500 to-indigo-500" title="LLM" />
);

export const image_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<Image className="w-4 h-4" />} color="from-purple-500 to-pink-500" title="Image Gen" />
);

export const video_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<Video className="w-4 h-4" />} color="from-orange-500 to-red-500" title="Video Gen" />
);

export const text_analyzer_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<FileText className="w-4 h-4" />} color="from-teal-500 to-cyan-500" title="Text Analyzer" />
);

export const conditional_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<GitBranch className="w-4 h-4" />} color="from-yellow-500 to-amber-500" title="Conditional" />
);

export const loop_node: React.FC<node_props> = (props) => (
  <BaseNode {...props} icon={<Repeat className="w-4 h-4" />} color="from-gray-500 to-gray-600" title="Loop" />
);

// Node factory
export const create_node_component = (type: string): React.FC<node_props> => {
  switch (type) {
    case "input":
      return input_node;
    case "output":
      return output_node;
    case "llm":
      return llm_node;
    case "image_generator":
      return image_node;
    case "video_generator":
      return video_node;
    case "text_analyzer":
      return text_analyzer_node;
    case "conditional":
      return conditional_node;
    case "loop":
      return loop_node;
    default:
      return llm_node;
  }
};