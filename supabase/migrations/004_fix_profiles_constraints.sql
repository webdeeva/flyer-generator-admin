-- Fix all foreign key constraints on profiles table

-- First, check and drop any foreign key constraints
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find all foreign key constraints on profiles table
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

-- Make sure the id column is the right type (UUID)
ALTER TABLE profiles ALTER COLUMN id TYPE UUID USING id::UUID;

-- Add primary key if it doesn't exist
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Ensure email column exists and has the right constraints
ALTER TABLE profiles ALTER COLUMN email TYPE TEXT;

-- Drop and recreate the unique constraint on email
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create index on email if it doesn't exist
DROP INDEX IF EXISTS idx_profiles_email;
CREATE INDEX idx_profiles_email ON profiles(email);

-- Now you can insert your admin profile without any foreign key issues