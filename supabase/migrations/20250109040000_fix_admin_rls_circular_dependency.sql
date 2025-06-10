-- Fix circular dependency in admin RLS policies
-- The issue: is_current_user_admin() queries users table, but users table RLS uses is_current_user_admin()

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Create a simplified admin check function that doesn't cause recursion
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin_by_clerk_id(clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Direct query without going through RLS
  SELECT role INTO user_role
  FROM users
  WHERE users.clerk_id = is_admin_by_clerk_id.clerk_id;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new RLS policies that avoid circular dependency
-- Users can always see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (
    clerk_id = auth.jwt() ->> 'sub'
  );

-- Admins can view all users - using direct clerk_id check
CREATE POLICY "Admins can view all users" ON users  
  FOR SELECT
  USING (
    is_admin_by_clerk_id(auth.jwt() ->> 'sub')
  );

-- Also fix the admin check functions to be more efficient
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_clerk_id TEXT;
BEGIN
  -- Get clerk_id from JWT
  current_clerk_id := auth.jwt() ->> 'sub';
  
  IF current_clerk_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Use the new function that doesn't cause recursion
  RETURN is_admin_by_clerk_id(current_clerk_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION is_admin_by_clerk_id IS 'Check if a user is admin by clerk_id without triggering RLS recursion';
COMMENT ON FUNCTION is_current_user_admin IS 'Check if the current authenticated user is admin';