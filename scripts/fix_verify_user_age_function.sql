-- Check if the function exists and create it if not

-- First, create the check_user_age helper function if it doesn't exist
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

-- Create the main verify_user_age function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_user_age TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_age TO authenticated;

-- Check if the function was created successfully
SELECT 
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM pg_catalog.pg_proc p
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
AND p.proname = 'verify_user_age';