-- This script adds the age verification columns to the users table
-- Run this if you're getting errors about missing age_verified_at column

-- Add age verification fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS region VARCHAR(10);

-- Create index for region-based queries
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);

-- Add comments for clarity
COMMENT ON COLUMN public.users.birth_date IS 'User birth date for age verification';
COMMENT ON COLUMN public.users.age_verified_at IS 'Timestamp when age was verified';
COMMENT ON COLUMN public.users.region IS 'User region for age requirement determination (EU requires 16+)';

-- Check if columns were added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN ('birth_date', 'age_verified_at', 'region')
ORDER BY 
    ordinal_position;