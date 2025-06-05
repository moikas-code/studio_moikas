-- Script to create a test user for local development
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID

-- Create user
INSERT INTO users (clerk_id, email, created_at)
VALUES ('YOUR_CLERK_USER_ID', 'test@example.com', NOW())
ON CONFLICT (clerk_id) DO UPDATE
SET email = EXCLUDED.email
RETURNING id;

-- Create subscription for the user (using the returned user ID)
INSERT INTO subscriptions (user_id, plan, tokens_renewable, tokens_permanent, renewed_at)
SELECT id, 'free', 125, 0, NOW()
FROM users
WHERE clerk_id = 'YOUR_CLERK_USER_ID'
ON CONFLICT (user_id) DO NOTHING;