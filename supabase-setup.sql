-- Enable RLS
ALTER TABLE base_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for base_prompts (public read)
CREATE POLICY "Anyone can view active base prompts" ON base_prompts
  FOR SELECT USING (is_active = true);

-- Create policies for generations
CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own generations" ON generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Create policies for usage_tracking
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for user uploads (run in Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', true);

-- Create storage policies (run in Supabase Dashboard)
-- CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-uploads');
-- CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'user-uploads');

-- Note: For Clerk integration, you might need to adjust the auth.jwt() ->> 'sub' 
-- to match how Clerk user IDs are stored. You may need to use a different claim.
-- Check your JWT payload in Supabase to see the exact structure.