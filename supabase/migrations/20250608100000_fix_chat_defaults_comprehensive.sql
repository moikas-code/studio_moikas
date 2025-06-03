-- Comprehensive fix for chat defaults functionality
-- This migration ensures the user_chat_defaults table exists with correct structure
-- and provides working functions for the API

-- First, ensure the table exists with correct structure
DO $$ 
BEGIN
    -- Check if table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_chat_defaults') THEN
        CREATE TABLE "public"."user_chat_defaults" (
            "id" uuid not null default gen_random_uuid(),
            "user_id" uuid not null references users(id) on delete cascade,
            "system_prompt" text default 'You are a helpful AI assistant.',
            "response_style" text default 'conversational' check (response_style in ('conversational', 'formal', 'creative', 'technical', 'concise')),
            "temperature" numeric(3,2) default 0.7 check (temperature >= 0 and temperature <= 1),
            "max_tokens" integer default 2048 check (max_tokens > 0 and max_tokens <= 4096),
            "context_window" integer default 20 check (context_window > 0 and context_window <= 50),
            "enable_memory" boolean default true,
            "enable_web_search" boolean default false,
            "enable_code_execution" boolean default false,
            "custom_instructions" text,
            "model_preference" text default 'grok-3-mini-latest',
            "created_at" timestamp with time zone not null default now(),
            "updated_at" timestamp with time zone not null default now(),
            constraint "user_chat_defaults_pkey" primary key ("id"),
            constraint "user_chat_defaults_user_unique" unique ("user_id")
        );

        -- Create index for performance
        CREATE INDEX "idx_user_chat_defaults_user_id" ON "public"."user_chat_defaults" ("user_id");

        -- Enable RLS
        ALTER TABLE "public"."user_chat_defaults" ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Ensure model_preference column has correct default (update existing if needed)
    UPDATE user_chat_defaults 
    SET model_preference = 'grok-3-mini-latest' 
    WHERE model_preference IN ('grok-beta', 'grok-2-mini-latest', 'grok-2-latest');

    -- Update default value for new rows
    ALTER TABLE user_chat_defaults ALTER COLUMN model_preference SET DEFAULT 'grok-3-mini-latest';
END $$;

-- Drop and recreate the main function to ensure it works correctly
DROP FUNCTION IF EXISTS get_or_create_user_chat_defaults(UUID);

-- Create the main function that returns JSONB for API compatibility
CREATE OR REPLACE FUNCTION get_or_create_user_chat_defaults(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
            system_prompt,
            response_style,
            temperature,
            max_tokens,
            context_window,
            enable_memory,
            enable_web_search,
            enable_code_execution,
            custom_instructions,
            model_preference,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            'You are a helpful AI assistant.',
            'conversational',
            0.7,
            2048,
            20,
            true,
            false,
            false,
            '',
            'grok-3-mini-latest',
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB with all necessary fields
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'system_prompt', defaults_record.system_prompt,
        'response_style', defaults_record.response_style,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'context_window', defaults_record.context_window,
        'enable_memory', defaults_record.enable_memory,
        'enable_web_search', defaults_record.enable_web_search,
        'enable_code_execution', defaults_record.enable_code_execution,
        'custom_instructions', defaults_record.custom_instructions,
        'model_preference', defaults_record.model_preference,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Create function to update user chat defaults
CREATE OR REPLACE FUNCTION update_user_chat_defaults(
    p_user_id UUID,
    p_system_prompt TEXT DEFAULT NULL,
    p_response_style TEXT DEFAULT NULL,
    p_temperature DECIMAL DEFAULT NULL,
    p_max_tokens INTEGER DEFAULT NULL,
    p_context_window INTEGER DEFAULT NULL,
    p_enable_memory BOOLEAN DEFAULT NULL,
    p_enable_web_search BOOLEAN DEFAULT NULL,
    p_enable_code_execution BOOLEAN DEFAULT NULL,
    p_custom_instructions TEXT DEFAULT NULL,
    p_model_preference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Update the defaults, only setting provided values
    UPDATE user_chat_defaults 
    SET 
        system_prompt = COALESCE(p_system_prompt, system_prompt),
        response_style = COALESCE(p_response_style, response_style),
        temperature = COALESCE(p_temperature, temperature),
        max_tokens = COALESCE(p_max_tokens, max_tokens),
        context_window = COALESCE(p_context_window, context_window),
        enable_memory = COALESCE(p_enable_memory, enable_memory),
        enable_web_search = COALESCE(p_enable_web_search, enable_web_search),
        enable_code_execution = COALESCE(p_enable_code_execution, enable_code_execution),
        custom_instructions = COALESCE(p_custom_instructions, custom_instructions),
        model_preference = COALESCE(p_model_preference, model_preference),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO defaults_record;
    
    -- If user doesn't exist, create with provided values and defaults
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            system_prompt,
            response_style,
            temperature,
            max_tokens,
            context_window,
            enable_memory,
            enable_web_search,
            enable_code_execution,
            custom_instructions,
            model_preference,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            COALESCE(p_system_prompt, 'You are a helpful AI assistant.'),
            COALESCE(p_response_style, 'conversational'),
            COALESCE(p_temperature, 0.7),
            COALESCE(p_max_tokens, 2048),
            COALESCE(p_context_window, 20),
            COALESCE(p_enable_memory, true),
            COALESCE(p_enable_web_search, false),
            COALESCE(p_enable_code_execution, false),
            COALESCE(p_custom_instructions, ''),
            COALESCE(p_model_preference, 'grok-3-mini-latest'),
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'system_prompt', defaults_record.system_prompt,
        'response_style', defaults_record.response_style,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'context_window', defaults_record.context_window,
        'enable_memory', defaults_record.enable_memory,
        'enable_web_search', defaults_record.enable_web_search,
        'enable_code_execution', defaults_record.enable_code_execution,
        'custom_instructions', defaults_record.custom_instructions,
        'model_preference', defaults_record.model_preference,
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
SET search_path = public
AS $$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Update to default values
    UPDATE user_chat_defaults 
    SET 
        system_prompt = 'You are a helpful AI assistant.',
        response_style = 'conversational',
        temperature = 0.7,
        max_tokens = 2048,
        context_window = 20,
        enable_memory = true,
        enable_web_search = false,
        enable_code_execution = false,
        custom_instructions = '',
        model_preference = 'grok-3-mini-latest',
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO defaults_record;
    
    -- If user doesn't exist, create with defaults
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            system_prompt,
            response_style,
            temperature,
            max_tokens,
            context_window,
            enable_memory,
            enable_web_search,
            enable_code_execution,
            custom_instructions,
            model_preference,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            'You are a helpful AI assistant.',
            'conversational',
            0.7,
            2048,
            20,
            true,
            false,
            false,
            '',
            'grok-3-mini-latest',
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'system_prompt', defaults_record.system_prompt,
        'response_style', defaults_record.response_style,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'context_window', defaults_record.context_window,
        'enable_memory', defaults_record.enable_memory,
        'enable_web_search', defaults_record.enable_web_search,
        'enable_code_execution', defaults_record.enable_code_execution,
        'custom_instructions', defaults_record.custom_instructions,
        'model_preference', defaults_record.model_preference,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$$;

-- Ensure RLS policies exist if get_user_id_from_clerk function exists
DO $$
BEGIN
    -- Check if the RLS helper function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_id_from_clerk') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own chat defaults" ON user_chat_defaults;
        DROP POLICY IF EXISTS "Users can create their own chat defaults" ON user_chat_defaults;
        DROP POLICY IF EXISTS "Users can update their own chat defaults" ON user_chat_defaults;
        DROP POLICY IF EXISTS "Users can delete their own chat defaults" ON user_chat_defaults;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own chat defaults"
            ON user_chat_defaults
            FOR SELECT
            USING (user_id = get_user_id_from_clerk());

        CREATE POLICY "Users can create their own chat defaults"
            ON user_chat_defaults
            FOR INSERT
            WITH CHECK (user_id = get_user_id_from_clerk());

        CREATE POLICY "Users can update their own chat defaults"
            ON user_chat_defaults
            FOR UPDATE
            USING (user_id = get_user_id_from_clerk());

        CREATE POLICY "Users can delete their own chat defaults"
            ON user_chat_defaults
            FOR DELETE
            USING (user_id = get_user_id_from_clerk());
    END IF;
END $$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_user_chat_defaults(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_chat_defaults(UUID, TEXT, TEXT, DECIMAL, INTEGER, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_chat_defaults(UUID) TO authenticated;

-- Grant usage on the table to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_chat_defaults TO authenticated;