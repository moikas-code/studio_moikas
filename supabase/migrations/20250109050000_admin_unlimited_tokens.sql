-- Ensure admins have unlimited tokens
-- Set admin subscriptions to have very high token counts that effectively act as unlimited

-- First, update any existing admin users to have max tokens
UPDATE subscriptions
SET 
  renewable_tokens = 999999999,
  permanent_tokens = 999999999,
  plan = 'admin'
FROM users
WHERE subscriptions.user_id = users.id
  AND users.role = 'admin';

-- Create a trigger to automatically set unlimited tokens when a user becomes admin
CREATE OR REPLACE FUNCTION set_admin_unlimited_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user's role changes to admin, give them unlimited tokens
  IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
    UPDATE subscriptions
    SET 
      renewable_tokens = 999999999,
      permanent_tokens = 999999999,
      plan = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  -- When a user's role changes from admin, reset to free plan defaults
  IF NEW.role != 'admin' AND OLD.role = 'admin' THEN
    UPDATE subscriptions
    SET 
      renewable_tokens = CASE 
        WHEN plan = 'standard' THEN 20480  -- Standard plan tokens
        ELSE 125  -- Free plan tokens
      END,
      plan = CASE 
        WHEN plan = 'admin' THEN 'free'
        ELSE plan
      END
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS admin_token_management ON users;
CREATE TRIGGER admin_token_management
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_unlimited_tokens();

-- Also ensure new admin users get unlimited tokens on insert
CREATE OR REPLACE FUNCTION ensure_admin_tokens_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Wait a moment for the subscription to be created, then update it
    PERFORM pg_sleep(0.1);
    UPDATE subscriptions
    SET 
      renewable_tokens = 999999999,
      permanent_tokens = 999999999,
      plan = 'admin'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS admin_token_on_user_insert ON users;
CREATE TRIGGER admin_token_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_admin_tokens_on_insert();

-- Add admin plan type to subscriptions constraint
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('free', 'standard', 'admin'));

-- Update any existing admin users to have the admin plan
UPDATE subscriptions 
SET plan = 'admin'
FROM users 
WHERE subscriptions.user_id = users.id 
  AND users.role = 'admin' 
  AND subscriptions.plan != 'admin';

-- Create a function to check if user should bypass token deduction
CREATE OR REPLACE FUNCTION should_bypass_token_deduction(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = should_bypass_token_deduction.user_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the token deduction function to skip admins
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_renewable_tokens INTEGER;
  v_permanent_tokens INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT should_bypass_token_deduction(p_user_id) INTO v_is_admin;
  
  -- Admins bypass token deduction
  IF v_is_admin THEN
    RETURN QUERY SELECT true, 'Admin user - tokens not deducted'::TEXT;
    RETURN;
  END IF;
  
  -- Get current token balances
  SELECT renewable_tokens, permanent_tokens 
  INTO v_renewable_tokens, v_permanent_tokens
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  -- Check if user has enough tokens
  IF (v_renewable_tokens + v_permanent_tokens) < p_amount THEN
    RETURN QUERY SELECT false, 'Insufficient tokens'::TEXT;
    RETURN;
  END IF;
  
  -- Deduct from renewable first, then permanent
  IF v_renewable_tokens >= p_amount THEN
    UPDATE subscriptions
    SET renewable_tokens = renewable_tokens - p_amount
    WHERE user_id = p_user_id;
  ELSE
    UPDATE subscriptions
    SET 
      renewable_tokens = 0,
      permanent_tokens = permanent_tokens - (p_amount - v_renewable_tokens)
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT true, 'Tokens deducted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION should_bypass_token_deduction(UUID) IS 'Check if a user (admin) should bypass token deduction';
COMMENT ON FUNCTION deduct_tokens(UUID, INTEGER) IS 'Deduct tokens from user balance, admins bypass deduction';