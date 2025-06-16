-- Enable realtime for audio_jobs table
ALTER TABLE audio_jobs REPLICA IDENTITY FULL;

-- Enable realtime for video_jobs table  
ALTER TABLE video_jobs REPLICA IDENTITY FULL;

-- Create publication for realtime if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE audio_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE video_jobs;