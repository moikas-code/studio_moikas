-- Update age verification to require 18+ for all users
-- Update the comment to reflect new requirement
COMMENT ON COLUMN public.users.region IS 'User region (all users must be 18+)';

-- Update function to check user age to require 18+ for all users
CREATE OR REPLACE FUNCTION check_user_age(
  birth_date DATE,
  region VARCHAR(10) DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  min_age INTEGER;
  user_age INTEGER;
BEGIN
  -- All users must be 18+
  min_age := 18;
  
  -- Calculate user age
  user_age := DATE_PART('year', AGE(birth_date));
  
  RETURN user_age >= min_age;
END;
$$ LANGUAGE plpgsql;

-- Update the verify_user_age function to use the updated check_user_age function
-- No changes needed as it already calls check_user_age which now enforces 18+