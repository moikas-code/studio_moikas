-- Add simple deduct_tokens function that matches the audio API expectations
-- This function will intelligently deduct from renewable tokens first, then permanent tokens

-- First, ensure the usage table has a description column
ALTER TABLE public.usage ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

CREATE OR REPLACE FUNCTION public.deduct_tokens(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_renewable integer;
  current_permanent integer;
  renewable_to_deduct integer;
  permanent_to_deduct integer;
BEGIN
  -- Input validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Token amount must be positive';
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
  IF (current_renewable + current_permanent) < p_amount THEN
    RAISE EXCEPTION 'Insufficient tokens. Required: %. Available: % renewable + % permanent = %', 
      p_amount, current_renewable, current_permanent, (current_renewable + current_permanent);
  END IF;
  
  -- Calculate how to deduct tokens (renewable first, then permanent)
  renewable_to_deduct := LEAST(p_amount, current_renewable);
  permanent_to_deduct := p_amount - renewable_to_deduct;
  
  -- Deduct tokens atomically
  UPDATE subscriptions
  SET 
    renewable_tokens = renewable_tokens - renewable_to_deduct,
    permanent_tokens = permanent_tokens - permanent_to_deduct,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the token usage with description
  INSERT INTO usage (user_id, tokens_used, description, created_at)
  VALUES (p_user_id, p_amount, COALESCE(p_description, 'Token deduction'), NOW());
END;
$$;

-- Update refund_tokens function to include description parameter for consistency
CREATE OR REPLACE FUNCTION public.refund_tokens(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL
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
        WHEN plan = 'free' THEN 125 
        WHEN plan = 'standard' THEN 20480
        ELSE renewable_tokens + p_amount
      END),
    permanent_tokens = permanent_tokens + GREATEST(0, 
      p_amount - (CASE 
        WHEN plan = 'free' THEN 125 - renewable_tokens
        WHEN plan = 'standard' THEN 20480 - renewable_tokens
        ELSE 0
      END)),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the refund in usage table with negative amount
  INSERT INTO usage (user_id, tokens_used, description, created_at)
  VALUES (p_user_id, -p_amount, COALESCE(p_description, 'Token refund'), NOW());
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.deduct_tokens(uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_tokens(uuid, integer, text) TO service_role;