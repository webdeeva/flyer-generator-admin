-- Disable RLS for now (since we're using Clerk, not Supabase Auth)
ALTER TABLE base_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_usage(text);

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(user_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, generation_count)
  VALUES (user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    generation_count = usage_tracking.generation_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for user uploads (run in Supabase Dashboard)
-- Go to Storage section and create a bucket named 'user-uploads' with public access

-- Storage policies for public bucket (run in Supabase Dashboard after creating bucket)
-- CREATE POLICY "Anyone can upload to user-uploads" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'user-uploads');
-- CREATE POLICY "Anyone can view user-uploads" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'user-uploads');