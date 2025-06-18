-- Add comprehensive user ban system

-- Add metadata column to users table if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create banned_users table for permanent ban records
CREATE TABLE IF NOT EXISTS public.banned_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    -- Store multiple identifiers to prevent re-registration
    email text,
    clerk_id text,
    ip_address inet,
    device_fingerprint text,
    -- Ban details
    ban_reason text NOT NULL,
    ban_type text NOT NULL DEFAULT 'permanent', -- permanent, temporary
    banned_at timestamptz NOT NULL DEFAULT now(),
    banned_until timestamptz, -- NULL for permanent bans
    banned_by uuid, -- admin who banned, NULL for automatic bans
    -- Additional tracking
    attempted_registrations integer DEFAULT 0,
    last_attempt_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT banned_users_pkey PRIMARY KEY (id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_clerk_id ON public.banned_users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_ip_address ON public.banned_users(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_users_device_fingerprint ON public.banned_users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_banned_users_ban_type ON public.banned_users(ban_type);

-- Create function to check if a user is banned
CREATE OR REPLACE FUNCTION check_user_banned(
    check_email text DEFAULT NULL,
    check_clerk_id text DEFAULT NULL,
    check_ip inet DEFAULT NULL,
    check_fingerprint text DEFAULT NULL
) RETURNS TABLE(is_banned boolean, ban_reason text, banned_until timestamptz) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true as is_banned,
        bu.ban_reason,
        bu.banned_until
    FROM banned_users bu
    WHERE 
        (bu.ban_type = 'permanent' OR (bu.ban_type = 'temporary' AND bu.banned_until > now()))
        AND (
            (check_email IS NOT NULL AND bu.email = check_email) OR
            (check_clerk_id IS NOT NULL AND bu.clerk_id = check_clerk_id) OR
            (check_ip IS NOT NULL AND bu.ip_address = check_ip) OR
            (check_fingerprint IS NOT NULL AND bu.device_fingerprint = check_fingerprint)
        )
    LIMIT 1;
    
    -- If no ban found, return not banned
    IF NOT FOUND THEN
        RETURN QUERY SELECT false as is_banned, NULL::text as ban_reason, NULL::timestamptz as banned_until;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to ban a user (for underage users)
CREATE OR REPLACE FUNCTION ban_underage_user(
    user_email text,
    user_clerk_id text DEFAULT NULL,
    user_ip inet DEFAULT NULL,
    user_fingerprint text DEFAULT NULL,
    user_birth_date date DEFAULT NULL
) RETURNS void AS $$
DECLARE
    user_age integer;
BEGIN
    -- Calculate age if birth date provided
    IF user_birth_date IS NOT NULL THEN
        user_age := DATE_PART('year', AGE(user_birth_date));
    END IF;
    
    -- Insert ban record
    INSERT INTO banned_users (
        email,
        clerk_id,
        ip_address,
        device_fingerprint,
        ban_reason,
        ban_type,
        metadata
    ) VALUES (
        user_email,
        user_clerk_id,
        user_ip,
        user_fingerprint,
        CASE 
            WHEN user_age IS NOT NULL THEN 
                'User is under 18 years old (age: ' || user_age || '). Access permanently denied.'
            ELSE 
                'User failed age verification - under 18 years old. Access permanently denied.'
        END,
        'permanent',
        jsonb_build_object(
            'ban_source', 'age_verification',
            'user_age', user_age,
            'birth_date', user_birth_date
        )
    );
    
    -- Update attempted registrations if they try again
    UPDATE banned_users
    SET 
        attempted_registrations = attempted_registrations + 1,
        last_attempt_at = now()
    WHERE 
        email = user_email OR
        (clerk_id IS NOT NULL AND clerk_id = user_clerk_id) OR
        (ip_address IS NOT NULL AND ip_address = user_ip) OR
        (device_fingerprint IS NOT NULL AND device_fingerprint = user_fingerprint);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin function to manually ban users
CREATE OR REPLACE FUNCTION admin_ban_user(
    target_user_id uuid,
    ban_reason text,
    ban_type text DEFAULT 'permanent',
    banned_until timestamptz DEFAULT NULL,
    admin_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user details
    SELECT * INTO user_record FROM users WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update user metadata to mark as banned
    UPDATE users
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{banned}',
        jsonb_build_object(
            'is_banned', true,
            'ban_reason', ban_reason,
            'ban_type', ban_type,
            'banned_at', now(),
            'banned_until', banned_until,
            'banned_by', admin_id
        )
    )
    WHERE id = target_user_id;
    
    -- Add to banned_users table
    INSERT INTO banned_users (
        email,
        clerk_id,
        ban_reason,
        ban_type,
        banned_until,
        banned_by,
        metadata
    ) VALUES (
        user_record.email,
        user_record.clerk_id,
        ban_reason,
        ban_type,
        banned_until,
        admin_id,
        jsonb_build_object(
            'ban_source', 'admin_action',
            'original_user_id', target_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view banned users
CREATE POLICY "Admins can view banned users" ON public.banned_users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can insert banned users (system functions bypass RLS)
CREATE POLICY "Admins can ban users" ON public.banned_users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_banned TO authenticated, anon;
GRANT EXECUTE ON FUNCTION ban_underage_user TO authenticated, anon;
GRANT EXECUTE ON FUNCTION admin_ban_user TO authenticated;

-- Add comments
COMMENT ON TABLE public.banned_users IS 'Permanent record of banned users to prevent re-registration';
COMMENT ON COLUMN public.banned_users.ban_type IS 'permanent or temporary ban';
COMMENT ON COLUMN public.banned_users.device_fingerprint IS 'Browser/device fingerprint for additional tracking';
COMMENT ON FUNCTION check_user_banned IS 'Check if a user is banned by any identifier';
COMMENT ON FUNCTION ban_underage_user IS 'Permanently ban users who are under 18';
COMMENT ON FUNCTION admin_ban_user IS 'Admin function to manually ban users';