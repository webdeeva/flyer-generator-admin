-- Simple approach: Work with existing UUID column type
-- This just fixes the policies to not depend on auth.uid()

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Create simple RLS policies that don't depend on auth.uid()
-- Allow all authenticated users to read profiles
CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true);

-- Drop the trigger that tries to auto-create profiles from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- For Clerk users, you'll need to manually insert your profile
-- The Clerk user ID needs to be converted to a UUID format
-- You can use a deterministic UUID based on the Clerk ID