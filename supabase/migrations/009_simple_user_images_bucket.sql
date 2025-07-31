-- Simple migration to ensure user-images bucket exists and is public
-- This avoids trying to modify system tables

-- Create or update the user-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images', 
  'user-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Note: Storage policies are managed through Supabase Dashboard
-- Go to Storage > Policies and add these policies for the user-images bucket:
-- 
-- 1. Enable INSERT for authenticated users
-- 2. Enable SELECT for authenticated users (or public)
-- 3. Enable DELETE for authenticated users
-- 4. Enable UPDATE for authenticated users