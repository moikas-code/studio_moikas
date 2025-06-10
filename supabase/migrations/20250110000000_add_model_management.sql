-- Create enum for model types
CREATE TYPE model_type AS ENUM ('image', 'video', 'audio', 'text');

-- Create enum for size mode
CREATE TYPE size_mode AS ENUM ('pixel', 'aspect_ratio');

-- Create the main models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id TEXT UNIQUE NOT NULL, -- The unique identifier used in API calls
  name TEXT NOT NULL,
  type model_type NOT NULL,
  cost_per_mp NUMERIC(10, 6) NOT NULL,
  custom_cost NUMERIC(10, 6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Image/Video specific flags
  supports_image_input BOOLEAN DEFAULT false,
  is_text_only BOOLEAN DEFAULT false,
  
  -- Size configuration
  size_mode size_mode DEFAULT 'aspect_ratio',
  supported_pixel_sizes JSONB DEFAULT '[]'::jsonb, -- Array of {width, height} objects
  supported_aspect_ratios TEXT[] DEFAULT ARRAY['1:1', '16:9', '9:16', '4:3', '3:4'],
  
  -- Generation parameters
  supports_cfg BOOLEAN DEFAULT false,
  default_cfg NUMERIC(4, 2),
  max_cfg NUMERIC(4, 2),
  
  supports_steps BOOLEAN DEFAULT false,
  default_steps INTEGER,
  max_steps INTEGER,
  
  -- Image specific
  max_images INTEGER DEFAULT 1,
  
  -- Video specific
  duration_options INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5], -- seconds
  supports_audio_generation BOOLEAN DEFAULT false,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- API configuration
  api_endpoint TEXT,
  api_version TEXT,
  
  -- Display configuration
  display_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Default model flag
  is_default BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX idx_models_model_id ON models(model_id);
CREATE INDEX idx_models_type ON models(type);
CREATE INDEX idx_models_is_active ON models(is_active);
CREATE INDEX idx_models_display_order ON models(display_order);
CREATE INDEX idx_models_is_default ON models(is_default) WHERE is_default = true;

-- Create RLS policies
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Everyone can read active models
CREATE POLICY "Public can view active models" ON models
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage models
CREATE POLICY "Admins can manage models" ON models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default model per type
CREATE OR REPLACE FUNCTION ensure_single_default_per_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a model as default
  IF NEW.is_default = true AND (OLD.is_default IS NULL OR OLD.is_default = false) THEN
    -- Unset any other default models of the same type
    UPDATE models 
    SET is_default = false 
    WHERE type = NEW.type 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default per type
CREATE TRIGGER enforce_single_default_model
  BEFORE INSERT OR UPDATE OF is_default ON models
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_per_type();

-- Create model presets table for common configurations
CREATE TABLE IF NOT EXISTS model_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Stores preset configuration
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for presets
CREATE INDEX idx_model_presets_model_id ON model_presets(model_id);

-- RLS for presets
ALTER TABLE model_presets ENABLE ROW LEVEL SECURITY;

-- Everyone can read presets
CREATE POLICY "Public can view model presets" ON model_presets
  FOR SELECT
  USING (true);

-- Only admins can manage presets
CREATE POLICY "Admins can manage model presets" ON model_presets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add trigger for presets updated_at
CREATE TRIGGER update_model_presets_updated_at
  BEFORE UPDATE ON model_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit log for model changes
CREATE TABLE IF NOT EXISTS model_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'activate', 'deactivate'
  changes JSONB, -- JSON diff of changes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit log
CREATE INDEX idx_model_audit_log_model_id ON model_audit_log(model_id);
CREATE INDEX idx_model_audit_log_admin_id ON model_audit_log(admin_id);
CREATE INDEX idx_model_audit_log_created_at ON model_audit_log(created_at DESC);

-- RLS for audit log
ALTER TABLE model_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view model audit logs" ON model_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to log model changes
CREATE OR REPLACE FUNCTION log_model_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine specific action based on changes
    IF OLD.is_active != NEW.is_active THEN
      v_action := CASE WHEN NEW.is_active THEN 'activate' ELSE 'deactivate' END;
    ELSE
      v_action := 'update';
    END IF;
    -- Calculate changes
    v_changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW),
      'diff', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := to_jsonb(OLD);
  END IF;

  INSERT INTO model_audit_log (model_id, admin_id, action, changes)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    v_action,
    v_changes
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER model_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON models
  FOR EACH ROW
  EXECUTE FUNCTION log_model_change();

-- Add comment
COMMENT ON TABLE models IS 'Flexible model configuration table for all AI models';
COMMENT ON COLUMN models.model_id IS 'Unique identifier used in API calls (e.g., "fal-ai/flux/schnell")';
COMMENT ON COLUMN models.metadata IS 'Additional model-specific configuration as JSON';