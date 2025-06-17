-- Fix admin_usage_stats view to return aggregated stats as expected by the frontend

-- Drop the existing view that groups by date
DROP VIEW IF EXISTS public.admin_usage_stats;

-- Recreate the view to return a single row with aggregated statistics
CREATE VIEW public.admin_usage_stats AS
SELECT 
  COUNT(*) as total_operations,
  COALESCE(SUM(tokens_used), 0) as total_tokens_used,
  COALESCE(AVG(tokens_used), 0) as avg_tokens_per_operation,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(CASE WHEN operation_type = 'image_generation' THEN 1 END) as image_generations,
  COUNT(CASE WHEN operation_type = 'video_generation' THEN 1 END) as video_generations,
  COUNT(CASE WHEN operation_type = 'audio_generation' THEN 1 END) as audio_generations,
  COUNT(CASE WHEN operation_type = 'text_analysis' THEN 1 END) as text_analyses,
  COUNT(CASE WHEN operation_type = 'memu_chat' THEN 1 END) as memu_chats
FROM usage
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Grant select permission on the view to authenticated users
-- Admin RLS policies will control actual access
GRANT SELECT ON public.admin_usage_stats TO authenticated;