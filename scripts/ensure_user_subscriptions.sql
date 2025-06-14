-- Ensure all users have subscriptions
-- This script creates missing subscriptions for users

-- First, find users without subscriptions
WITH users_without_subscriptions AS (
  SELECT u.id, u.email, u.clerk_id, u.created_at
  FROM users u
  LEFT JOIN subscriptions s ON u.id = s.user_id
  WHERE s.id IS NULL
)
-- Create subscriptions for these users
INSERT INTO subscriptions (user_id, plan, renewable_tokens, permanent_tokens, created_at)
SELECT 
  id as user_id,
  'free' as plan,
  125 as renewable_tokens,
  0 as permanent_tokens,
  created_at
FROM users_without_subscriptions;

-- Show results
SELECT 
  'Users without subscriptions' as status,
  COUNT(*) as count
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.id IS NULL

UNION ALL

SELECT 
  'Total users' as status,
  COUNT(*) as count
FROM users

UNION ALL

SELECT 
  'Total subscriptions' as status,
  COUNT(*) as count
FROM subscriptions;