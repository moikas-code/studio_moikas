-- Create moderation_logs table to track prompt moderation decisions
CREATE TABLE public.moderation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  safe BOOLEAN NOT NULL,
  violations TEXT[] DEFAULT '{}',
  confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  false_positive_reported BOOLEAN DEFAULT FALSE,
  false_positive_reviewed BOOLEAN DEFAULT FALSE,
  false_positive_notes TEXT,
  model_used TEXT DEFAULT 'grok-3-mini-latest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_moderation_logs_user_id ON public.moderation_logs(user_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);
CREATE INDEX idx_moderation_logs_safe ON public.moderation_logs(safe);
CREATE INDEX idx_moderation_logs_violations ON public.moderation_logs USING GIN(violations);
CREATE INDEX idx_moderation_logs_false_positive ON public.moderation_logs(false_positive_reported) WHERE false_positive_reported = TRUE;

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own moderation logs
CREATE POLICY "Users can view own moderation logs" ON public.moderation_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can view all moderation logs
CREATE POLICY "Admins can view all moderation logs" ON public.moderation_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Users can report false positives on their own logs
CREATE POLICY "Users can report false positives" ON public.moderation_logs
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    false_positive_reported = FALSE
  )
  WITH CHECK (
    auth.uid() = user_id AND 
    false_positive_reported = TRUE AND
    false_positive_reviewed = FALSE
  );

-- Create function to get moderation statistics (admin only)
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
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
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

-- Create function to log moderation decision
CREATE OR REPLACE FUNCTION log_moderation_decision(
  p_user_id UUID,
  p_prompt TEXT,
  p_safe BOOLEAN,
  p_violations TEXT[],
  p_confidence NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.moderation_logs (
    user_id, 
    prompt, 
    safe, 
    violations, 
    confidence
  )
  VALUES (
    p_user_id,
    p_prompt,
    p_safe,
    p_violations,
    p_confidence
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_moderation_logs_updated_at
  BEFORE UPDATE ON public.moderation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.moderation_logs IS 'Tracks all prompt moderation decisions for image generation';
COMMENT ON COLUMN public.moderation_logs.safe IS 'Whether the prompt was deemed safe for generation';
COMMENT ON COLUMN public.moderation_logs.violations IS 'Array of violation categories detected';
COMMENT ON COLUMN public.moderation_logs.confidence IS 'AI confidence score for the moderation decision (0-1)';
COMMENT ON COLUMN public.moderation_logs.false_positive_reported IS 'User reported this as incorrectly blocked';
COMMENT ON COLUMN public.moderation_logs.false_positive_reviewed IS 'Admin has reviewed the false positive report';