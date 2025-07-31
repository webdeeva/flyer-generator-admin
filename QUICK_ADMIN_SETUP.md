# Quick Admin Setup for tavonia@gmail.com

## Steps to become admin:

### 1. Apply the complete fix migration
```bash
# Run this ONE migration in Supabase SQL Editor:
supabase/migrations/005_complete_profiles_fix.sql
```

This migration will:
- Drop ALL RLS policies that reference profiles or auth
- Remove ALL foreign key constraints
- Fix the profiles table structure
- Create new simple RLS policies that work with Clerk
- Handle all dependencies and policy issues

### 2. Sign up in your app
1. Start the app: `npm start`
2. Go to http://localhost:3001
3. Click "Sign Up" 
4. Use email: tavonia@gmail.com
5. Complete the sign-up process

### 3. Get your UUID for Supabase
After signing in, you'll see an "Admin Setup" button in the bottom right corner (only visible for tavonia@gmail.com).

Click it to see:
- Your Clerk user ID (starts with "user_")
- A generated UUID that works with Supabase
- The exact SQL command to run

### 4. Run the SQL command
The helper will show you the exact SQL with a proper UUID, like:
```sql
INSERT INTO profiles (id, email, is_admin) 
VALUES (
  'xxxxxxxx-xxxx-5xxx-xxxx-xxxxxxxxxxxx',  -- Generated UUID will be shown
  'tavonia@gmail.com',
  true
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = true;
```

### 5. Access Admin Panel
After running the SQL, refresh the page. You should now see an "Admin" button in the top navigation.

## How it works
The app converts your Clerk user ID to a deterministic UUID that's compatible with Supabase's UUID column type. This conversion is consistent - the same Clerk ID always produces the same UUID.

## Troubleshooting
- If you see "policy" errors, make sure you ran the migration first
- The UUID shown in the helper is specific to your Clerk user ID
- The same Clerk ID will always generate the same UUID