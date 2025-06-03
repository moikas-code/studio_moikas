-- CRITICAL SECURITY FIXES
-- This migration addresses serious RLS vulnerabilities

-- 1. Revoke dangerous anon permissions
REVOKE DELETE ON TABLE "public"."subscriptions" FROM "anon";
REVOKE INSERT ON TABLE "public"."subscriptions" FROM "anon";
REVOKE UPDATE ON TABLE "public"."subscriptions" FROM "anon";

REVOKE DELETE ON TABLE "public"."users" FROM "anon";
REVOKE INSERT ON TABLE "public"."users" FROM "anon";
REVOKE UPDATE ON TABLE "public"."users" FROM "anon";

REVOKE DELETE ON TABLE "public"."video_jobs" FROM "anon";
REVOKE INSERT ON TABLE "public"."video_jobs" FROM "anon";
REVOKE UPDATE ON TABLE "public"."video_jobs" FROM "anon";

REVOKE DELETE ON TABLE "public"."usage" FROM "anon";
REVOKE INSERT ON TABLE "public"."usage" FROM "anon";
REVOKE UPDATE ON TABLE "public"."usage" FROM "anon";

-- 2. Replace overly permissive service role policy
DROP POLICY IF EXISTS "Service role can do everything" ON public.video_jobs;

-- Create more restrictive service role policies
CREATE POLICY "Service role can update video job status" ON public.video_jobs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can read video jobs for webhooks" ON public.video_jobs
FOR SELECT
TO service_role
USING (true);

-- 3. Add missing RLS policies for usage table
CREATE POLICY "Users can view their own usage"
ON "public"."usage"
FOR SELECT
TO authenticated
USING (user_id = get_user_id_from_clerk());

CREATE POLICY "Service role can insert usage records"
ON "public"."usage"
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Add audit logging function
CREATE OR REPLACE FUNCTION log_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all sensitive operations
  INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id, timestamp)
  VALUES (
    TG_TABLE_NAME,
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW),
    get_user_id_from_clerk(),
    NOW()
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "Service role can manage audit logs" ON audit_log
FOR ALL
TO service_role
USING (true);

-- 6. Add triggers for sensitive tables
CREATE TRIGGER audit_subscriptions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operations();

CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_sensitive_operations();

-- 7. Strengthen token deduction function
CREATE OR REPLACE FUNCTION public.deduct_tokens(
  p_user_id uuid,
  p_renewable_tokens numeric,
  p_permanent_tokens numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_renewable numeric;
  current_permanent numeric;
BEGIN
  -- Input validation
  IF p_renewable_tokens < 0 OR p_permanent_tokens < 0 THEN
    RAISE EXCEPTION 'Token amounts must be non-negative';
  END IF;
  
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  -- Get current token amounts with row lock
  SELECT renewable_tokens, permanent_tokens 
  INTO current_renewable, current_permanent
  FROM subscriptions 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User subscription not found';
  END IF;
  
  -- Check if sufficient tokens are available
  IF current_renewable < p_renewable_tokens OR current_permanent < p_permanent_tokens THEN
    RAISE EXCEPTION 'Insufficient tokens. Required: % renewable, % permanent. Available: % renewable, % permanent', 
      p_renewable_tokens, p_permanent_tokens, current_renewable, current_permanent;
  END IF;
  
  -- Deduct tokens atomically
  UPDATE subscriptions
  SET 
    renewable_tokens = renewable_tokens - p_renewable_tokens,
    permanent_tokens = permanent_tokens - p_permanent_tokens,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the token usage
  INSERT INTO usage (user_id, tokens_used, created_at)
  VALUES (p_user_id, p_renewable_tokens + p_permanent_tokens, NOW());
END;
$$;

-- 8. Add rate limiting for sensitive operations
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  operation TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, operation, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" ON rate_limits
FOR SELECT
TO authenticated
USING (user_id = get_user_id_from_clerk());

-- 9. Function to check rate limits (simplified)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_operation TEXT,
  p_max_per_hour INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  current_hour TIMESTAMP WITH TIME ZONE;
BEGIN
  current_hour := date_trunc('hour', NOW());
  
  -- Get current hour's count
  SELECT COALESCE(count, 0) INTO current_count
  FROM rate_limits
  WHERE user_id = p_user_id 
    AND operation = p_operation
    AND window_start = current_hour;
  
  -- Check if limit exceeded
  IF current_count >= p_max_per_hour THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limits (user_id, operation, count, window_start)
  VALUES (p_user_id, p_operation, 1, current_hour)
  ON CONFLICT (user_id, operation, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_sensitive_operations() TO service_role; 