-- Complete fix for profiles table to work with Clerk
-- This handles all policies, constraints, and dependencies

-- First, drop ALL RLS policies that might reference profiles
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename;
    END LOOP;

    -- Also drop policies on other tables that might reference profiles
    -- Using the correct column names for pg_policies
    FOR policy_record IN 
        SELECT DISTINCT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual LIKE '%profiles%' 
           OR with_check LIKE '%profiles%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename;
    END LOOP;
END $$;

-- Drop all foreign key constraints
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Now we can safely work with the table
-- Ensure the id column is UUID type (it already should be)
-- Just verify the structure without altering the type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Ensure other columns exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create indexes
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email ON profiles(email);

-- Create simple RLS policies for profiles
CREATE POLICY "Enable read access for all users"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for service role"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Enable update for service role"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for service role"
  ON profiles FOR DELETE
  TO service_role
  USING (true);

-- Recreate safe policies for other tables that don't depend on auth.uid()
-- For admin_logs
DROP POLICY IF EXISTS "Service role full access to admin_logs" ON admin_logs;
CREATE POLICY "Service role full access to admin_logs"
  ON admin_logs FOR ALL
  TO service_role
  USING (true);

-- For prompt_categories
DROP POLICY IF EXISTS "Everyone can view categories" ON prompt_categories;
CREATE POLICY "Everyone can view categories"
  ON prompt_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role manages categories" ON prompt_categories;
CREATE POLICY "Service role manages categories"
  ON prompt_categories FOR ALL
  TO service_role
  USING (true);

-- For base_prompts
DROP POLICY IF EXISTS "Everyone can view active prompts" ON base_prompts;
CREATE POLICY "Everyone can view active prompts"
  ON base_prompts FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role manages prompts" ON base_prompts;
CREATE POLICY "Service role manages prompts"
  ON base_prompts FOR ALL
  TO service_role
  USING (true);

-- Now you can insert your admin profile!