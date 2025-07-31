-- Direct SQL to make a user admin with Clerk authentication
-- Run this in Supabase SQL Editor after getting your Clerk user ID

-- IMPORTANT: This app uses Clerk for authentication, not Supabase Auth.
-- You MUST get your Clerk user ID first!

-- Step 1: Get your Clerk user ID
-- Method 1 (Easiest - Console):
-- 1. Sign in to your app at http://localhost:3001
-- 2. Open browser developer tools (F12)
-- 3. Go to Console tab
-- 4. Run this command: JSON.parse(localStorage.getItem('__clerk_db_jwt')).sub
-- 5. Copy the user ID that starts with "user_"

-- Method 2 (Network Tab):
-- 1. Open Network tab in developer tools
-- 2. Look for API calls that include your user ID

-- Step 2: Check if you already have a profile
SELECT * FROM profiles WHERE email = 'tavonia@gmail.com';

-- Step 3: Make yourself admin
-- Replace 'user_YOUR_CLERK_ID' with your actual Clerk user ID from Step 1
INSERT INTO profiles (id, email, is_admin) 
VALUES (
  'user_YOUR_CLERK_ID',  -- Replace this with your actual Clerk user ID
  'tavonia@gmail.com',
  true
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = true;

-- Alternative: If you already have a row in profiles, just update it:
UPDATE profiles 
SET is_admin = true 
WHERE email = 'tavonia@gmail.com';

-- Verify the admin status
SELECT * FROM profiles WHERE email = 'tavonia@gmail.com';