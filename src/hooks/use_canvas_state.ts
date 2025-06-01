import { useState, useCallback } from 'react';
import { Canvas_state, create_history_entry } from '@/lib/image_editor_utils';

const initial_canvas_state: Canvas_state = {
  image_base64: null,
  background_base64: null,
  text_elements: [],
  canvas_width: 400,
  canvas_height: 300,
  zoom: 1,
  pan_x: 0,
  pan_y: 0,
  history: [],
  history_index: -1,
};

export const useCanvasState = () => {
  const [canvas_state, set_canvas_state] = useState<Canvas_state>(initial_canvas_state);

  const save_to_history = useCallback((state: Canvas_state): Canvas_state => {
    const history_entry = create_history_entry(state);
    const new_history = state.history.slice(0, state.history_index + 1);
    new_history.push(history_entry);
    
    return {
      ...state,
      history: new_history,
      history_index: new_history.length - 1,
    };
  }, []);

  const update_canvas_state = useCallback((updates: Partial<Canvas_state>) => {
    set_canvas_state(prev => ({ ...prev, ...updates }));
  }, []);

  const update_canvas_state_with_history = useCallback((updates: Partial<Canvas_state>) => {
    set_canvas_state(prev => save_to_history({ ...prev, ...updates }));
  }, [save_to_history]);

  return {
    canvas_state,
    set_canvas_state,
    update_canvas_state,
    update_canvas_state_with_history,
    save_to_history,
  };
}; 