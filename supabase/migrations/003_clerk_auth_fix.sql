-- Fix profiles table to work with Clerk authentication instead of Supabase Auth
-- This migration removes the foreign key constraint to auth.users

-- First, drop all RLS policies that depend on the id column
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change the id column to TEXT to support Clerk user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Drop the trigger that references auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Add a unique constraint on email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_unique' 
    AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- Create new RLS policies that don't depend on auth.uid()
-- Since we're using Clerk, we'll handle auth in the application layer
-- These policies allow authenticated users to read profiles
CREATE POLICY "Allow authenticated users to read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only allow updates through service role (backend will handle auth)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true);

-- Update admin_logs to use TEXT for user_id
ALTER TABLE admin_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Update function to track prompt usage (remove auth.uid() reference)
CREATE OR REPLACE FUNCTION increment_prompt_usage(prompt_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE base_prompts 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql;

-- Note: After this migration, make sure to:
-- 1. Sign up through your application at http://localhost:3001
-- 2. Get your Clerk user ID (starts with "user_")
-- 3. Run the admin setup SQL with your Clerk user ID