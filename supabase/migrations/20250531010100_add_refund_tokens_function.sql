-- Create a function to refund tokens to a user
CREATE OR REPLACE FUNCTION public.refund_tokens(
  p_user_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the subscription to add back the refunded tokens
  -- Priority: Add to renewable_tokens first, then permanent if needed
  UPDATE subscriptions
  SET 
    renewable_tokens = LEAST(renewable_tokens + p_amount, 
      CASE 
        WHEN plan_type = 'free' THEN 125 
        WHEN plan_type = 'standard' THEN 20480
        ELSE renewable_tokens + p_amount
      END),
    permanent_tokens = permanent_tokens + GREATEST(0, 
      p_amount - (CASE 
        WHEN plan_type = 'free' THEN 125 - renewable_tokens
        WHEN plan_type = 'standard' THEN 20480 - renewable_tokens
        ELSE 0
      END))
  WHERE user_id = p_user_id;
  
  -- Log the refund in usage table with negative amount
  INSERT INTO usage (user_id, tokens_used, description, created_at)
  VALUES (p_user_id, -p_amount, 'Token refund for failed video generation', NOW());
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.refund_tokens(uuid, integer) TO service_role;

-- Add tokens_refunded column to video_jobs table
ALTER TABLE "public"."video_jobs" 
ADD COLUMN IF NOT EXISTS "tokens_refunded" integer;