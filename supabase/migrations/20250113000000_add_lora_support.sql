-- Add LoRA-specific fields to models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_loras BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_embeddings BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_controlnet BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_ip_adapter BOOLEAN DEFAULT false;

-- Add scheduler options
ALTER TABLE models ADD COLUMN IF NOT EXISTS supported_schedulers TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_scheduler TEXT;

-- Add advanced parameters support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_tile_size BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_tile_width INTEGER;
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_tile_height INTEGER;
ALTER TABLE models ADD COLUMN IF NOT EXISTS max_tile_width INTEGER;
ALTER TABLE models ADD COLUMN IF NOT EXISTS max_tile_height INTEGER;

-- Add prediction type support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supported_prediction_types TEXT[] DEFAULT ARRAY['epsilon']::TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_prediction_type TEXT DEFAULT 'epsilon';

-- Add guidance scale range for LoRA models (they might have different ranges)
ALTER TABLE models ADD COLUMN IF NOT EXISTS min_cfg NUMERIC(4, 2) DEFAULT 0;

-- Add clip skip support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_clip_skip BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_clip_skip INTEGER DEFAULT 0;
ALTER TABLE models ADD COLUMN IF NOT EXISTS max_clip_skip INTEGER DEFAULT 2;

-- Add eta support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_eta BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_eta NUMERIC(3, 2) DEFAULT 0;
ALTER TABLE models ADD COLUMN IF NOT EXISTS max_eta NUMERIC(3, 2) DEFAULT 1;

-- Add prompt weighting support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_prompt_weighting BOOLEAN DEFAULT false;

-- Add model variants support (e.g., fp16, fp32)
ALTER TABLE models ADD COLUMN IF NOT EXISTS supported_variants TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE models ADD COLUMN IF NOT EXISTS default_variant TEXT;

-- Add safety checker flag
ALTER TABLE models ADD COLUMN IF NOT EXISTS has_safety_checker BOOLEAN DEFAULT true;

-- Add sigmas/timesteps configuration support
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_custom_sigmas BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS supports_custom_timesteps BOOLEAN DEFAULT false;

-- Update metadata comment to reflect new usage
COMMENT ON COLUMN models.metadata IS 'Additional model-specific configuration as JSON (e.g., LoRA paths, embedding tokens, etc.)';

-- Add new columns to handle specific LoRA/SD model requirements
COMMENT ON COLUMN models.supports_loras IS 'Whether the model supports LoRA weights';
COMMENT ON COLUMN models.supports_embeddings IS 'Whether the model supports custom embeddings';
COMMENT ON COLUMN models.supports_controlnet IS 'Whether the model supports ControlNet';
COMMENT ON COLUMN models.supports_ip_adapter IS 'Whether the model supports IP Adapter';
COMMENT ON COLUMN models.supported_schedulers IS 'List of supported schedulers (e.g., DPM++ 2M, Euler, LCM)';
COMMENT ON COLUMN models.supports_prompt_weighting IS 'Whether the model supports prompt weighting syntax and >77 token prompts';

-- Create a separate table for LoRA configurations that can be reused
CREATE TABLE IF NOT EXISTS lora_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- URL or path to LoRA weights
  scale NUMERIC(3, 2) DEFAULT 1.0 CHECK (scale >= 0 AND scale <= 4),
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes for LoRA configs
CREATE INDEX idx_lora_configs_name ON lora_configs(name);
CREATE INDEX idx_lora_configs_is_active ON lora_configs(is_active);
CREATE INDEX idx_lora_configs_created_by ON lora_configs(created_by);

-- RLS for LoRA configs
ALTER TABLE lora_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active LoRA configs
CREATE POLICY "Public can view active LoRA configs" ON lora_configs
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage LoRA configs
CREATE POLICY "Admins can manage LoRA configs" ON lora_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_lora_configs_updated_at
  BEFORE UPDATE ON lora_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create embedding configurations table
CREATE TABLE IF NOT EXISTS embedding_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- URL or path to embedding weights
  tokens TEXT[] NOT NULL DEFAULT ARRAY['<s0>', '<s1>']::TEXT[], -- Tokens to map to embedding
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes for embedding configs
CREATE INDEX idx_embedding_configs_name ON embedding_configs(name);
CREATE INDEX idx_embedding_configs_is_active ON embedding_configs(is_active);
CREATE INDEX idx_embedding_configs_created_by ON embedding_configs(created_by);

-- RLS for embedding configs
ALTER TABLE embedding_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active embedding configs
CREATE POLICY "Public can view active embedding configs" ON embedding_configs
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage embedding configs
CREATE POLICY "Admins can manage embedding configs" ON embedding_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_embedding_configs_updated_at
  BEFORE UPDATE ON embedding_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create controlnet configurations table
CREATE TABLE IF NOT EXISTS controlnet_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- URL or path to controlnet weights
  config_url TEXT, -- Optional config.json URL
  variant TEXT, -- Optional variant for HuggingFace repos
  type TEXT NOT NULL, -- e.g., 'canny', 'depth', 'pose', etc.
  description TEXT,
  conditioning_scale NUMERIC(3, 2) DEFAULT 1.0 CHECK (conditioning_scale >= 0 AND conditioning_scale <= 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes for controlnet configs
CREATE INDEX idx_controlnet_configs_name ON controlnet_configs(name);
CREATE INDEX idx_controlnet_configs_type ON controlnet_configs(type);
CREATE INDEX idx_controlnet_configs_is_active ON controlnet_configs(is_active);

-- RLS for controlnet configs
ALTER TABLE controlnet_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active controlnet configs
CREATE POLICY "Public can view active controlnet configs" ON controlnet_configs
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage controlnet configs
CREATE POLICY "Admins can manage controlnet configs" ON controlnet_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_controlnet_configs_updated_at
  BEFORE UPDATE ON controlnet_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();