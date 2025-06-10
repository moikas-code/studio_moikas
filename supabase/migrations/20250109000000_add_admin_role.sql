-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create an index on role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add check constraint to ensure valid roles
ALTER TABLE users ADD CONSTRAINT valid_user_role CHECK (role IN ('user', 'admin'));

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user_id from the JWT claims
  user_id := get_user_id_from_clerk();
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN is_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin analytics views (without operation_type dependency)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'standard' THEN u.id END) as paid_users,
  COUNT(DISTINCT CASE WHEN s.plan = 'free' THEN u.id END) as free_users,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '7 days' THEN u.id END) as new_users_last_week,
  COUNT(DISTINCT CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN u.id END) as new_users_last_month
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id;

-- Create revenue analytics view (placeholder - actual revenue tracking table not yet implemented)
CREATE OR REPLACE VIEW admin_revenue_stats AS
SELECT 
  0 as paying_customers,
  0.0 as total_revenue,
  0.0 as avg_transaction_value,
  0 as total_purchases,
  0.0 as total_refunds,
  0 as refund_count;

-- Add RLS policies for admin views
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin can view all user data
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (is_current_user_admin());

-- Regular RLS policy for users to see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (id = get_user_id_from_clerk());

-- Note: Views are accessible to authenticated users by default
-- The is_current_user_admin() check in queries will enforce admin-only access

-- Create RLS for admin views (PostgreSQL doesn't support RLS on views directly, 
-- but the underlying tables have RLS, and we'll check admin status in the API)

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: either "user" or "admin"';
COMMENT ON FUNCTION is_admin IS 'Check if a specific user ID has admin role';
COMMENT ON FUNCTION is_current_user_admin IS 'Check if the currently authenticated user has admin role';