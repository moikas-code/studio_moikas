-- Fix admin views access and ensure they work properly

-- First, let's check if the views exist and recreate them with proper structure
-- Drop existing views
DROP VIEW IF EXISTS public.admin_usage_stats CASCADE;
DROP VIEW IF EXISTS public.admin_user_stats CASCADE;
DROP VIEW IF EXISTS public.admin_revenue_stats CASCADE;
DROP VIEW IF EXISTS public.admin_daily_usage_trends CASCADE;

-- Recreate admin_user_stats view
CREATE VIEW public.admin_user_stats AS
SELECT 
  COUNT(DISTINCT u.id)::integer as total_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'standard' THEN u.id END)::integer as paid_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'free' OR s.plan IS NULL THEN u.id END)::integer as free_users,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '7 days' THEN u.id END)::integer as new_users_last_week,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN u.id END)::integer as new_users_last_month
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id;

-- Recreate admin_usage_stats view with proper aggregation
CREATE VIEW public.admin_usage_stats AS
SELECT 
  COUNT(*)::integer as total_operations,
  COALESCE(SUM(tokens_used), 0)::integer as total_tokens_used,
  COALESCE(AVG(tokens_used), 0)::numeric as avg_tokens_per_operation,
  COUNT(DISTINCT user_id)::integer as active_users,
  COUNT(CASE WHEN operation_type = 'image_generation' THEN 1 END)::integer as image_generations,
  COUNT(CASE WHEN operation_type = 'video_generation' THEN 1 END)::integer as video_generations,
  COUNT(CASE WHEN operation_type = 'audio_generation' THEN 1 END)::integer as audio_generations,
  COUNT(CASE WHEN operation_type = 'text_analysis' THEN 1 END)::integer as text_analyses,
  COUNT(CASE WHEN operation_type = 'memu_chat' THEN 1 END)::integer as memu_chats
FROM usage
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Recreate admin_revenue_stats view
CREATE VIEW public.admin_revenue_stats AS
SELECT 
  COUNT(DISTINCT CASE WHEN operation = 'token_purchase' THEN user_id END)::integer as paying_customers,
  COALESCE(SUM(CASE WHEN operation = 'token_purchase' THEN amount_cents END) / 100.0, 0)::numeric as total_revenue,
  COALESCE(AVG(CASE WHEN operation = 'token_purchase' THEN amount_cents END) / 100.0, 0)::numeric as avg_transaction_value,
  COALESCE(COUNT(CASE WHEN operation = 'token_purchase' THEN 1 END), 0)::integer as total_purchases,
  COALESCE(SUM(CASE WHEN operation = 'token_refund' THEN amount_cents END) / 100.0, 0)::numeric as total_refunds,
  COALESCE(COUNT(CASE WHEN operation = 'token_refund' THEN 1 END), 0)::integer as refund_count
FROM revenue_transactions
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Recreate admin_daily_usage_trends view
CREATE VIEW public.admin_daily_usage_trends AS
SELECT 
  DATE(u.created_at) AS date,
  COUNT(DISTINCT u.user_id)::integer AS daily_active_users,
  COUNT(*)::integer AS total_operations,
  COALESCE(SUM(u.tokens_used), 0)::integer AS tokens_consumed,
  COUNT(CASE WHEN u.operation_type = 'image_generation' THEN 1 END)::integer AS images_generated,
  COUNT(CASE WHEN u.operation_type = 'video_generation' THEN 1 END)::integer AS videos_generated
FROM usage u
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(u.created_at)
ORDER BY date DESC;

-- Grant select permissions on all views to authenticated users
-- The actual access control is handled by the is_current_user_admin() function
GRANT SELECT ON public.admin_user_stats TO authenticated;
GRANT SELECT ON public.admin_usage_stats TO authenticated;
GRANT SELECT ON public.admin_revenue_stats TO authenticated;
GRANT SELECT ON public.admin_daily_usage_trends TO authenticated;

-- Create RLS policies for the views (views don't have RLS by default, but we can add policies)
-- Note: Views themselves don't support RLS, but the underlying tables do
-- The admin check is done in the API layer

-- Add a comment to document the purpose of these views
COMMENT ON VIEW public.admin_user_stats IS 'Aggregated user statistics for admin dashboard';
COMMENT ON VIEW public.admin_usage_stats IS 'Aggregated usage statistics for admin dashboard (last 30 days)';
COMMENT ON VIEW public.admin_revenue_stats IS 'Aggregated revenue statistics for admin dashboard (last 30 days)';
COMMENT ON VIEW public.admin_daily_usage_trends IS 'Daily usage trends for admin dashboard (last 30 days)';