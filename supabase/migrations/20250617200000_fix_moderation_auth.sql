-- Fix moderation logs authentication to use Clerk instead of Supabase Auth

-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own moderation logs" ON public.moderation_logs;
DROP POLICY IF EXISTS "Admins can view all moderation logs" ON public.moderation_logs;
DROP POLICY IF EXISTS "Users can report false positives" ON public.moderation_logs;

-- Recreate policies using Clerk authentication functions
CREATE POLICY "Users can view own moderation logs" ON public.moderation_logs
  FOR SELECT 
  USING (user_id = get_user_id_from_clerk());

CREATE POLICY "Admins can view all moderation logs" ON public.moderation_logs
  FOR ALL 
  USING (is_current_user_admin());

CREATE POLICY "Users can report false positives" ON public.moderation_logs
  FOR UPDATE 
  USING (
    user_id = get_user_id_from_clerk() AND 
    false_positive_reported = FALSE
  )
  WITH CHECK (
    user_id = get_user_id_from_clerk() AND 
    false_positive_reported = TRUE AND
    false_positive_reviewed = FALSE
  );

-- Update get_moderation_stats function to use Clerk authentication
CREATE OR REPLACE FUNCTION get_moderation_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_checks BIGINT,
  total_blocked BIGINT,
  block_rate NUMERIC,
  false_positive_reports BIGINT,
  false_positive_rate NUMERIC,
  violations_breakdown JSONB,
  daily_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin using Clerk authentication
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE NOT safe) AS blocked,
      COUNT(*) FILTER (WHERE false_positive_reported) AS fp_reports
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
  ),
  violations AS (
    SELECT 
      unnest(violations) AS violation,
      COUNT(*) AS count
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
    AND NOT safe
    GROUP BY violation
  ),
  daily AS (
    SELECT 
      DATE(created_at) AS date,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE NOT safe) AS blocked
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  )
  SELECT 
    stats.total,
    stats.blocked,
    CASE 
      WHEN stats.total > 0 
      THEN ROUND((stats.blocked::NUMERIC / stats.total) * 100, 2)
      ELSE 0
    END AS block_rate,
    stats.fp_reports,
    CASE 
      WHEN stats.blocked > 0 
      THEN ROUND((stats.fp_reports::NUMERIC / stats.blocked) * 100, 2)
      ELSE 0
    END AS false_positive_rate,
    COALESCE(
      (SELECT jsonb_object_agg(violation, count) FROM violations),
      '{}'::jsonb
    ) AS violations_breakdown,
    COALESCE(
      (SELECT jsonb_agg(row_to_json(daily.*)) FROM daily),
      '[]'::jsonb
    ) AS daily_stats
  FROM stats;
END;
$$;

-- Grant execute permission on the function to authenticated users
-- (The function itself will check for admin access)
GRANT EXECUTE ON FUNCTION get_moderation_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;