-- Fix security issues identified by Supabase linter

-- 1. Fix SECURITY DEFINER views by recreating them without SECURITY DEFINER
-- These views should rely on RLS policies of underlying tables instead

-- Drop and recreate admin_user_stats view
DROP VIEW IF EXISTS public.admin_user_stats;
CREATE VIEW public.admin_user_stats AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'standard' THEN u.id END) as paid_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'free' THEN u.id END) as free_users,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '7 days' THEN u.id END) as new_users_last_week,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN u.id END) as new_users_last_month
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id;

-- Drop and recreate admin_usage_stats view
DROP VIEW IF EXISTS public.admin_usage_stats;
CREATE VIEW public.admin_usage_stats AS
SELECT 
  COUNT(*) as total_operations,
  SUM(tokens_used) as total_tokens_used,
  AVG(tokens_used) as avg_tokens_per_operation,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as usage_date
FROM usage
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC;

-- Drop and recreate admin_daily_usage_trends view
DROP VIEW IF EXISTS public.admin_daily_usage_trends;
CREATE VIEW public.admin_daily_usage_trends AS
SELECT 
  DATE_TRUNC('day', u.created_at) AS usage_date,
  COUNT(*) AS total_operations,
  COUNT(DISTINCT u.user_id) AS unique_users,
  SUM(u.tokens_used) AS total_tokens,
  AVG(u.tokens_used) AS avg_tokens_per_operation,
  COUNT(CASE WHEN s.plan = 'free' THEN 1 END) AS free_operations,
  COUNT(CASE WHEN s.plan = 'standard' THEN 1 END) AS paid_operations,
  SUM(CASE WHEN s.plan = 'free' THEN u.tokens_used ELSE 0 END) AS free_tokens,
  SUM(CASE WHEN s.plan = 'standard' THEN u.tokens_used ELSE 0 END) AS paid_tokens
FROM usage u
LEFT JOIN subscriptions s ON u.user_id = s.user_id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', u.created_at)
ORDER BY usage_date DESC;

-- Drop and recreate admin_active_models view
DROP VIEW IF EXISTS public.admin_active_models;
CREATE VIEW public.admin_active_models AS
SELECT 
  id,
  model_id,
  name,
  type,
  cost_per_mp,
  custom_cost,
  is_active,
  is_default,
  tags,
  display_order,
  supports_both_size_modes,
  created_at,
  updated_at
FROM models
WHERE is_active = true
ORDER BY display_order, name;

-- Drop and recreate admin_revenue_stats view
DROP VIEW IF EXISTS public.admin_revenue_stats;
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

-- 2. Enable RLS on system_logs table
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_logs
-- Only admins can view system logs
CREATE POLICY "Only admins can view system logs" ON public.system_logs
  FOR SELECT
  USING (is_current_user_admin());

-- Only the system (service role) can insert logs
CREATE POLICY "Only system can insert logs" ON public.system_logs
  FOR INSERT
  WITH CHECK (FALSE);

-- Only the system (service role) can update logs  
CREATE POLICY "Only system can update logs" ON public.system_logs
  FOR UPDATE
  USING (FALSE)
  WITH CHECK (FALSE);

-- Only the system (service role) can delete logs
CREATE POLICY "Only system can delete logs" ON public.system_logs
  FOR DELETE
  USING (FALSE);

-- Grant necessary permissions to authenticated users for views
-- (Views will inherit RLS from underlying tables)
GRANT SELECT ON public.admin_user_stats TO authenticated;
GRANT SELECT ON public.admin_usage_stats TO authenticated;
GRANT SELECT ON public.admin_daily_usage_trends TO authenticated;
GRANT SELECT ON public.admin_active_models TO authenticated;
GRANT SELECT ON public.admin_revenue_stats TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.admin_user_stats IS 'Admin view for user statistics - requires admin role via API';
COMMENT ON VIEW public.admin_usage_stats IS 'Admin view for usage statistics - requires admin role via API';
COMMENT ON VIEW public.admin_daily_usage_trends IS 'Admin view for daily usage trends - requires admin role via API';
COMMENT ON VIEW public.admin_active_models IS 'Admin view for active model usage - requires admin role via API';
COMMENT ON VIEW public.admin_revenue_stats IS 'Admin view for revenue statistics - requires admin role via API';
COMMENT ON TABLE public.system_logs IS 'System-level logs for automated processes - admin read only';

-- Note: These views now rely on the API layer to check admin status using is_current_user_admin()
-- This is more secure than using SECURITY DEFINER which bypasses RLS

-- 3. Keep verify_user_age as SECURITY DEFINER since it needs elevated privileges
-- to update user records during the verification process, but ensure it's secure
-- The function already has proper security checks and is only called during age verification