-- Create embeddings table for SDXL models
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('embedding', 'lora')),
  model_type TEXT NOT NULL CHECK (model_type IN ('sdxl', 'sd15', 'universal')),
  tokens TEXT[] DEFAULT ARRAY['<s0>', '<s1>'],
  url TEXT NOT NULL, -- URL to the embedding/LoRA file
  thumbnail_url TEXT,
  created_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_embeddings_type ON embeddings(type);
CREATE INDEX idx_embeddings_model_type ON embeddings(model_type);
CREATE INDEX idx_embeddings_is_public ON embeddings(is_public);
CREATE INDEX idx_embeddings_is_default ON embeddings(is_default);
CREATE INDEX idx_embeddings_created_by ON embeddings(created_by);

-- RLS policies
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Everyone can view public embeddings
CREATE POLICY "Public embeddings are viewable by everyone" ON embeddings
  FOR SELECT
  USING (is_public = true);

-- Users can view their own embeddings
CREATE POLICY "Users can view their own embeddings" ON embeddings
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can create their own embeddings
CREATE POLICY "Users can create their own embeddings" ON embeddings
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own embeddings
CREATE POLICY "Users can update their own embeddings" ON embeddings
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own embeddings
CREATE POLICY "Users can delete their own embeddings" ON embeddings
  FOR DELETE
  USING (auth.uid() = created_by);

-- Admins can manage all embeddings
CREATE POLICY "Admins can manage all embeddings" ON embeddings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create user_embedding_favorites table for users to save their favorite embeddings
CREATE TABLE IF NOT EXISTS user_embedding_favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  embedding_id UUID REFERENCES embeddings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, embedding_id)
);

-- RLS for favorites
ALTER TABLE user_embedding_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites" ON user_embedding_favorites
  FOR ALL
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some default embeddings
INSERT INTO embeddings (name, description, type, model_type, url, is_public, is_default, tags, metadata) VALUES
-- Default embeddings
('Detailed Photography', 'Enhances photographic detail and realism', 'embedding', 'sdxl', 
 'https://example.com/embeddings/detailed-photo-v1.safetensors', true, true, 
 ARRAY['photography', 'detail', 'realism'],
 jsonb_build_object('strength', 0.8, 'recommended_weight', 0.8)),

('Anime Style', 'Converts to anime/manga art style', 'lora', 'sdxl',
 'https://example.com/loras/anime-style-sdxl.safetensors', true, true,
 ARRAY['anime', 'manga', 'style'],
 jsonb_build_object('strength', 0.7, 'recommended_weight', 0.7)),

('Film Grain', 'Adds cinematic film grain effect', 'embedding', 'sdxl',
 'https://example.com/embeddings/film-grain-v1.safetensors', true, true,
 ARRAY['film', 'grain', 'cinematic'],
 jsonb_build_object('strength', 0.5, 'recommended_weight', 0.5));

-- Add support for embedding uploads in the models metadata
UPDATE models 
SET metadata = metadata || jsonb_build_object(
  'max_embeddings', 5,
  'max_loras', 3,
  'embedding_token_limit', 10,
  'lora_scale_range', jsonb_build_object('min', 0, 'max', 1)
)
WHERE model_id = 'fal-ai/fast-sdxl';

-- Add comment
COMMENT ON TABLE embeddings IS 'Stores embeddings and LoRA models for SDXL image generation';