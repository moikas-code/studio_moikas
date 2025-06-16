-- Add age verification fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS region VARCHAR(10);

-- Create index for region-based queries
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);

-- Add comment for clarity
COMMENT ON COLUMN public.users.birth_date IS 'User birth date for age verification';
COMMENT ON COLUMN public.users.age_verified_at IS 'Timestamp when age was verified';
COMMENT ON COLUMN public.users.region IS 'User region for age requirement determination (EU requires 16+)';

-- Create function to check user age
CREATE OR REPLACE FUNCTION check_user_age(
  birth_date DATE,
  region VARCHAR(10) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  min_age INTEGER;
  user_age INTEGER;
BEGIN
  -- Determine minimum age based on region
  IF region IN ('AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE') THEN
    min_age := 16; -- EU countries
  ELSE
    min_age := 13; -- Rest of world
  END IF;
  
  -- Calculate user age
  user_age := DATE_PART('year', AGE(birth_date));
  
  RETURN user_age >= min_age;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policy to ensure users can only update their own age data
CREATE POLICY "Users can update own age data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle age verification during signup
CREATE OR REPLACE FUNCTION verify_user_age(
  user_id UUID,
  birth_date DATE,
  region VARCHAR(10) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  is_valid_age BOOLEAN;
BEGIN
  -- Check if user meets age requirement
  is_valid_age := check_user_age(birth_date, region);
  
  IF is_valid_age THEN
    -- Update user record with verified age
    UPDATE public.users
    SET 
      birth_date = verify_user_age.birth_date,
      age_verified_at = NOW(),
      region = verify_user_age.region
    WHERE id = user_id;
    
    RETURN TRUE;
  ELSE
    -- Delete user if underage
    DELETE FROM public.users WHERE id = user_id;
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_user_age TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_age TO authenticated;