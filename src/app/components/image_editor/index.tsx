'use client'

import React, { useState, useRef } from 'react'
import { useCanvasState } from '@/hooks/use_canvas_state'
import { useZoomPan } from '@/hooks/use_zoom_pan'
import { useEditorSession } from '@/hooks/use_editor_session'
import { usePanelManager } from './hooks/use_panel_manager'
import { Image_editor_header } from '../image_editor/image_editor_header'
import { Image_editor_toolbar } from '../image_editor/image_editor_toolbar'
import { CanvasRenderer } from './canvas/canvas_renderer'
import { TextPropertiesPanel } from './panels/text_properties_panel'
import { BackgroundPanel } from './panels/background_panel'
import { ImagePropertiesPanel } from './panels/image_properties_panel'

type Tool = 'select' | 'text' | 'pan'

export function ImageEditor() {
  // Canvas state management
  const {
    canvas_state,
    undo,
    redo,
    can_undo,
    can_redo
  } = useCanvasState()
  
  // Zoom and pan management
  const {
    zoom,
    pan_x,
    pan_y
  } = useZoomPan()
  
  // Session management
  const {
    save_session,
    load_session,
    export_session,
    import_session
  } = useEditorSession()
  
  // Panel management
  const {
    panel_state,
    toggle_panel,
    close_panel
  } = usePanelManager()
  
  // UI state
  const [active_tool, set_active_tool] = useState<Tool>('select')
  const [selected_text_id] = useState<string | null>(null)
  
  // Refs
  const canvas_container_ref = useRef<HTMLDivElement>(null)
  const viewport_size = useRef({ width: 0, height: 0 })
  
  // Text editing state
  const [text_input, set_text_input] = useState('')
  const [text_color, set_text_color] = useState('#000000')
  const [text_size, set_text_size] = useState(24)
  const [text_font, set_text_font] = useState('Arial')
  const [text_weight, set_text_weight] = useState('normal')
  const [text_opacity, set_text_opacity] = useState(100)
  const [text_shadow, set_text_shadow] = useState({
    blur: 0,
    color: '#000000',
    offset_x: 0,
    offset_y: 0
  })
  
  // Background state
  const [background_type, set_background_type] = useState<'none' | 'color' | 'gradient'>('none')
  const [background_color, set_background_color] = useState('#ffffff')
  const [gradient_start, set_gradient_start] = useState('#ffffff')
  const [gradient_end, set_gradient_end] = useState('#000000')
  const [gradient_direction, set_gradient_direction] = useState('to bottom')
  const [user_background_colors] = useState<string[]>([])
  
  // Event handlers would go here...
  
  return (
    <div className="relative w-full h-screen overflow-hidden bg-base-300">
      <Image_editor_header
        on_save={save_session}
        on_load={load_session}
        on_export={export_session}
        on_import={import_session}
        on_undo={undo}
        on_redo={redo}
        can_undo={can_undo}
        can_redo={can_redo}
      />
      
      <div className="flex h-full pt-16">
        <Image_editor_toolbar
          active_tool={active_tool}
          on_tool_change={set_active_tool}
          on_toggle_grid={() => toggle_panel('layers')}
          show_grid={canvas_state.show_grid}
        />
        
        <div ref={canvas_container_ref} className="flex-1 relative">
          <CanvasRenderer
            canvas_state={{ ...canvas_state, zoom, pan_x, pan_y }}
            selected_text_id={selected_text_id}
            viewport_width={viewport_size.current.width}
            viewport_height={viewport_size.current.height}
          />
        </div>
        
        {panel_state.text && (
          <TextPropertiesPanel
            text_elements={canvas_state.text_elements}
            selected_text_id={selected_text_id}
            text_input={text_input}
            text_color={text_color}
            text_size={text_size}
            text_font={text_font}
            text_weight={text_weight}
            text_opacity={text_opacity}
            text_shadow={text_shadow}
            on_text_input_change={set_text_input}
            on_text_color_change={set_text_color}
            on_text_size_change={set_text_size}
            on_text_font_change={set_text_font}
            on_text_weight_change={set_text_weight}
            on_text_opacity_change={set_text_opacity}
            on_text_shadow_change={set_text_shadow}
            on_update_text={() => {}}
            on_delete_text={() => {}}
            on_duplicate_text={() => {}}
            on_move_layer_up={() => {}}
            on_move_layer_down={() => {}}
            on_bring_to_front={() => {}}
            on_send_to_back={() => {}}
            on_close={() => close_panel('text')}
          />
        )}
        
        {panel_state.background && (
          <BackgroundPanel
            background_type={background_type}
            background_color={background_color}
            gradient_start={gradient_start}
            gradient_end={gradient_end}
            gradient_direction={gradient_direction}
            user_background_colors={user_background_colors}
            on_background_type_change={set_background_type}
            on_background_color_change={set_background_color}
            on_gradient_start_change={set_gradient_start}
            on_gradient_end_change={set_gradient_end}
            on_gradient_direction_change={set_gradient_direction}
            on_add_user_color={() => {}}
            on_close={() => close_panel('background')}
          />
        )}
        
        {panel_state.image && (
          <ImagePropertiesPanel
            image_transform={canvas_state.image_transform}
            original_image_size={{ width: 1000, height: 1000 }}
            on_transform_change={() => {}}
            on_reset_transform={() => {}}
            on_fit_to_canvas={() => {}}
            on_close={() => close_panel('image')}
          />
        )}
      </div>
    </div>
  )
}