-- Add supports_both_size_modes column to models table
ALTER TABLE IF EXISTS models ADD COLUMN IF NOT EXISTS supports_both_size_modes BOOLEAN DEFAULT false; 