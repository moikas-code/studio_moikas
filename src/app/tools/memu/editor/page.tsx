"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Workflow_editor from "../components/workflow_editor";
import { node_data } from "../components/workflow_nodes";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function Workflow_editor_page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflow_id = searchParams.get("id");
  
  
  const [loading, set_loading] = useState(true);
  const [saving, set_saving] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [workflow, set_workflow] = useState<{ id: string; name: string; workflow_nodes?: node_data[] } | null>(null);
  const [workflow_name, set_workflow_name] = useState("");
  const workflow_editor_ref = useRef<{ get_current_data: () => { nodes: node_data[]; connections: { from: string; to: string }[] } } | null>(null);
  
  useEffect(() => {
    if (workflow_id) {
      load_workflow();
    } else {
      // New workflow
      set_workflow_name("New Workflow");
      set_loading(false);
    }
  }, [workflow_id, load_workflow]);
  
  const load_workflow = async () => {
    try {
      const response = await fetch(`/api/memu?id=${workflow_id}`);
      if (!response.ok) throw new Error("Failed to load workflow");
      
      const data = await response.json();
      if (data.workflows && data.workflows.length > 0) {
        const wf = data.workflows.find((w: { id: string; name: string; workflow_nodes?: node_data[] }) => w.id === workflow_id);
        if (wf) {
          set_workflow(wf);
          set_workflow_name(wf.name);
        }
      }
    } catch (error) {
      console.error("Error loading workflow:", error);
      set_error("Failed to load workflow");
    } finally {
      set_loading(false);
    }
  };
  
  const handle_save = async (nodes: node_data[], connections: { from: string; to: string }[]) => {
    set_saving(true);
    set_error(null);
    
    try {
      const method = workflow_id ? "PUT" : "POST";
      const body: { name: string; graph_data: { nodes: node_data[]; connections: { from: string; to: string }[] }; id?: string } = {
        name: workflow_name,
        graph_data: { nodes, connections }
      };
      
      if (workflow_id) {
        body.id = workflow_id;
      }
      
      const response = await fetch("/api/memu/workflows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error("Failed to save workflow");
      
      const data = await response.json();
      
      if (!workflow_id && data.workflow) {
        // If it was a new workflow, update URL to include the ID
        router.push(`/tools/memu/editor?id=${data.workflow.id}`);
      }
      
      // Show success message
      set_error(null);
    } catch (error) {
      console.error("Error saving workflow:", error);
      set_error("Failed to save workflow");
    } finally {
      set_saving(false);
    }
  };
  
  const handle_run = () => {
    if (workflow_id) {
      router.push(`/tools/memu?workflow=${workflow_id}`);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="navbar bg-base-100 border-b">
        <div className="flex-none">
          <Link href="/tools/memu" className="btn btn-square btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={workflow_name}
            onChange={(e) => set_workflow_name(e.target.value)}
            className="input input-ghost text-xl font-bold"
            placeholder="Workflow name..."
          />
        </div>
        <div className="flex-none">
          {saving && <span className="loading loading-spinner loading-sm mr-2"></span>}
          <button
            onClick={() => {
              const current_data = workflow_editor_ref.current?.get_current_data();
              if (current_data) {
                handle_save(current_data.nodes, current_data.connections);
              } else {
                handle_save([], []);
              }
            }}
            className="btn btn-primary btn-sm"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </button>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="alert alert-error m-4">
          <span>{error}</span>
        </div>
      )}
      
      {/* Editor */}
      <div className="flex-1">
        <Workflow_editor
          workflow_id={workflow_id || undefined}
          initial_nodes={workflow?.workflow_nodes || []}
          on_save={handle_save}
          on_run={handle_run}
        />
      </div>
    </div>
  );
}