import { useCallback } from 'react';
import { Canvas_state } from '@/lib/image_editor_utils';

export const useZoomPan = (
  canvas_state: Canvas_state,
  update_canvas_state: (updates: Partial<Canvas_state>) => void
) => {
  const zoom_in = useCallback(() => {
    update_canvas_state({
      zoom: Math.min(canvas_state.zoom * 1.2, 5)
    });
  }, [canvas_state.zoom, update_canvas_state]);

  const zoom_out = useCallback(() => {
    update_canvas_state({
      zoom: Math.max(canvas_state.zoom / 1.2, 0.1)
    });
  }, [canvas_state.zoom, update_canvas_state]);

  const reset_zoom = useCallback(() => {
    update_canvas_state({
      zoom: 1,
      pan_x: 0,
      pan_y: 0
    });
  }, [update_canvas_state]);

  const handle_wheel_zoom = useCallback((
    event: React.WheelEvent<HTMLCanvasElement>,
    canvas_ref: React.RefObject<HTMLCanvasElement>
  ) => {
    event.preventDefault();
    
    const zoom_factor = event.deltaY > 0 ? 0.9 : 1.1;
    const new_zoom = Math.min(Math.max(canvas_state.zoom * zoom_factor, 0.1), 5);
    
    const canvas = canvas_ref.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouse_x = event.clientX - rect.left;
    const mouse_y = event.clientY - rect.top;
    
    const zoom_ratio = new_zoom / canvas_state.zoom;
    const new_pan_x = mouse_x - (mouse_x - canvas_state.pan_x) * zoom_ratio;
    const new_pan_y = mouse_y - (mouse_y - canvas_state.pan_y) * zoom_ratio;
    
    update_canvas_state({
      zoom: new_zoom,
      pan_x: new_pan_x,
      pan_y: new_pan_y,
    });
  }, [canvas_state.zoom, canvas_state.pan_x, canvas_state.pan_y, update_canvas_state]);

  return {
    zoom_in,
    zoom_out,
    reset_zoom,
    handle_wheel_zoom,
  };
}; 