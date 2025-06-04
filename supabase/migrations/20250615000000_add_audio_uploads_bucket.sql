-- Create audio-uploads storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  true, -- Public bucket for easier access via URL
  false,
  10485760, -- 10MB limit
  ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/m4a'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for audio-uploads bucket
CREATE POLICY "Users can upload their own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[1] = 'voice-samples' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[1] = 'voice-samples' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  (storage.foldername(name))[1] = 'voice-samples' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public access to audio files (since they need to be accessed by fal.ai)
CREATE POLICY "Public can view audio files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-uploads');