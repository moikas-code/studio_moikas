-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS get_or_create_user_chat_defaults(UUID);

-- Create function to get or create user chat defaults
CREATE OR REPLACE FUNCTION get_or_create_user_chat_defaults(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Try to get existing defaults
    SELECT * INTO defaults_record
    FROM user_chat_defaults 
    WHERE user_id = p_user_id;
    
    -- If no defaults exist, create them with default values
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            temperature,
            max_tokens,
            model_preference,
            system_prompt,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            0.7,
            2048,
            'grok-3-mini-latest',
            'You are a helpful AI assistant.',
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'model', defaults_record.model_preference,
        'system_prompt', defaults_record.system_prompt,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Create function to update user chat defaults
CREATE OR REPLACE FUNCTION update_user_chat_defaults(
    p_user_id UUID,
    p_temperature DECIMAL DEFAULT NULL,
    p_max_tokens INTEGER DEFAULT NULL,
    p_model TEXT DEFAULT NULL,
    p_system_prompt TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Update the defaults, only setting provided values
    UPDATE user_chat_defaults 
    SET 
        temperature = COALESCE(p_temperature, temperature),
        max_tokens = COALESCE(p_max_tokens, max_tokens),
        model = COALESCE(p_model, model),
        system_prompt = COALESCE(p_system_prompt, system_prompt),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO defaults_record;
    
    -- If user doesn't exist, create with provided values and defaults
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            temperature,
            max_tokens,
            model_preference,
            system_prompt,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            COALESCE(p_temperature, 0.7),
            COALESCE(p_max_tokens, 2048),
            COALESCE(p_model, 'grok-2-mini-latest'),
            COALESCE(p_system_prompt, 'You are a helpful AI assistant.'),
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'model', defaults_record.model_preference,
        'system_prompt', defaults_record.system_prompt,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Create function to reset user chat defaults to system defaults
CREATE OR REPLACE FUNCTION reset_user_chat_defaults(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Update to default values
    UPDATE user_chat_defaults 
    SET 
        temperature = 0.7,
        max_tokens = 2048,
        model = 'grok-2-mini-latest',
        system_prompt = 'You are a helpful AI assistant.',
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO defaults_record;
    
    -- If user doesn't exist, create with defaults
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            temperature,
            max_tokens,
            model_preference,
            system_prompt,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            0.7,
            2048,
            'grok-3-mini-latest',
            'You are a helpful AI assistant.',
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'model', defaults_record.model_preference,
        'system_prompt', defaults_record.system_prompt,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_chat_defaults(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_chat_defaults(UUID, DECIMAL, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_chat_defaults(UUID) TO authenticated;