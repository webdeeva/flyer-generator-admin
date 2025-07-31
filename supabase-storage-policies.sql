-- First, make sure the bucket exists and is public
-- Run this in Supabase Dashboard SQL Editor

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload to user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update user-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete user-uploads" ON storage.objects;

-- Create permissive policies for the bucket
CREATE POLICY "Anyone can upload to user-uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can view user-uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can update user-uploads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can delete user-uploads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'user-uploads');

-- Alternative: If you want to completely disable RLS on storage (not recommended for production)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;