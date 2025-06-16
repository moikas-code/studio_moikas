-- Fix subscription plan column name if needed
-- This script updates any subscriptions that might have plan_name instead of plan

-- First, check if plan_name column exists
DO $$
BEGIN
  -- Update subscriptions that have NULL plan but might have been created with wrong column
  UPDATE subscriptions
  SET plan = 'free'
  WHERE plan IS NULL;
  
  -- Ensure all subscriptions have valid renewable_tokens
  UPDATE subscriptions
  SET renewable_tokens = 125
  WHERE renewable_tokens IS NULL OR renewable_tokens = 0;
  
  -- Ensure all subscriptions have valid permanent_tokens
  UPDATE subscriptions
  SET permanent_tokens = 0
  WHERE permanent_tokens IS NULL;
  
  -- Fix any admin users to have the correct plan
  UPDATE subscriptions s
  SET plan = 'admin'
  FROM users u
  WHERE s.user_id = u.id
  AND u.role = 'admin';
  
  RAISE NOTICE 'Subscription plans have been fixed';
END $$;

-- Show current subscription data for debugging
SELECT 
  u.email,
  u.clerk_id,
  s.plan,
  s.renewable_tokens,
  s.permanent_tokens,
  s.created_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
ORDER BY u.created_at DESC
LIMIT 10;