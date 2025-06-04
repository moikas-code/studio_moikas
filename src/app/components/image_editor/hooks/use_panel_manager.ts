'use client'

import { useState, useCallback } from 'react'

type PanelName = 'text' | 'templates' | 'background' | 'image' | 'layers'

interface PanelState {
  text: boolean
  templates: boolean
  background: boolean
  image: boolean
  layers: boolean
}

export function use_panel_manager() {
  const [panel_state, set_panel_state] = useState<PanelState>({
    text: false,
    templates: false,
    background: false,
    image: false,
    layers: false
  })
  
  const toggle_panel = useCallback((panel: PanelName) => {
    set_panel_state(prev => {
      // Close all other panels when opening a new one
      const new_state: PanelState = {
        text: false,
        templates: false,
        background: false,
        image: false,
        layers: false
      }
      
      // Toggle the requested panel
      new_state[panel] = !prev[panel]
      
      return new_state
    })
  }, [])
  
  const close_all_panels = useCallback(() => {
    set_panel_state({
      text: false,
      templates: false,
      background: false,
      image: false,
      layers: false
    })
  }, [])
  
  const close_panel = useCallback((panel: PanelName) => {
    set_panel_state(prev => ({
      ...prev,
      [panel]: false
    }))
  }, [])
  
  return {
    panel_state,
    toggle_panel,
    close_all_panels,
    close_panel
  }
}