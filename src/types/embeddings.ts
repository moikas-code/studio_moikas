export interface Embedding {
  id: string;
  name: string;
  description?: string;
  type: 'embedding' | 'lora';
  model_type: 'sdxl' | 'sd15' | 'universal';
  tokens: string[];
  url: string;
  thumbnail_url?: string;
  created_by?: string;
  is_public: boolean;
  is_default: boolean;
  tags: string[];
  metadata: {
    strength?: number;
    recommended_weight?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface EmbeddingInput {
  path: string;
  tokens?: string[];
}

export interface LoraWeight {
  path: string;
  scale?: number;
  force?: boolean;
}

export interface UserEmbeddingFavorite {
  user_id: string;
  embedding_id: string;
  created_at: string;
}

export interface EmbeddingFormData {
  name: string;
  description?: string;
  type: 'embedding' | 'lora';
  model_type: 'sdxl' | 'sd15' | 'universal';
  tokens?: string[];
  file?: File;
  url?: string;
  thumbnail_url?: string;
  is_public?: boolean;
  tags?: string[];
  metadata?: {
    strength?: number;
    recommended_weight?: number;
  };
}