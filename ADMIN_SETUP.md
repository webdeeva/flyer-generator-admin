# Admin Panel Setup Instructions

## Overview
The admin panel provides a comprehensive interface for managing prompts, categories, and monitoring platform usage.

## Setting Up Admin Access

### Step 1: Apply Database Migrations
First, you need to apply the admin database migrations to create the necessary tables and functions.

```bash
# Apply the migration using Supabase CLI or dashboard
# The migration file is located at: supabase/migrations/002_admin_features.sql
```

### Step 2: Sign Up First
**Important**: You must sign up through the application first before making yourself an admin.

1. Start the application: `npm start`
2. Go to http://localhost:3001
3. Click "Sign Up" and create an account with your email
4. Complete the sign-up process

### Step 3: Get Your Clerk User ID

Since the app uses Clerk for authentication, you need to find your Clerk user ID:

1. After signing up and logging in, open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command: `JSON.parse(localStorage.getItem('__clerk_db_jwt')).sub`
4. Copy the user ID that starts with "user_"

Alternatively:
- Check the Network tab for API calls that include your user ID
- Or look in Application > Local Storage for Clerk-related keys

### Step 4: Make Yourself an Admin

There are three ways to grant admin access:

#### Option A: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor"
3. Run this SQL command with your Clerk user ID:
```sql
INSERT INTO profiles (id, email, is_admin) 
VALUES (
  'user_YOUR_CLERK_ID',  -- Replace with your actual Clerk user ID from Step 3
  'your@email.com',      -- Replace with your email
  true
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = true;
```

#### Option B: Using Supabase Table Editor
1. Go to your Supabase project dashboard
2. Navigate to the "Table Editor"
3. Find the `profiles` table
4. If your profile exists, edit it and set `is_admin` to `true`
5. If not, create a new row:
   - `id`: Your Clerk user ID (from Step 3)
   - `email`: Your email address
   - `is_admin`: `true`

#### Option C: Using the Clerk-Compatible Setup Script
```bash
# First make sure you've signed up through the app
# Then run with your Clerk user ID:
node scripts/setup-admin-clerk.cjs user_YOUR_CLERK_ID your@email.com
```

### Step 5: Access the Admin Panel
1. Log in to the application with your admin account
2. You'll see an "Admin" button in the top navigation
3. Click it to access the admin panel at `/admin`

## Admin Features

### Dashboard
- Overview of platform statistics
- Total prompts, active prompts, generations, and users
- Recent generation activity
- Popular prompts by usage

### Prompt Management
- **View All Prompts**: List of all prompts with search and filtering
- **Create New Prompt**: Add new flyer generation prompts
- **Edit Prompts**: Modify existing prompts
- **Toggle Status**: Activate/deactivate prompts
- **Duplicate**: Clone existing prompts for variations
- **Delete**: Remove prompts (with confirmation)

### Prompt Features
- **Categories**: Organize prompts by type (Realistic, Fantasy, Bold, etc.)
- **Tags**: Add searchable tags for better organization
- **Additional Elements**: Define optional elements users can add
- **Advanced Settings**:
  - Face swap requirements
  - Style type preferences
  - Recommended quality settings

### Security
- Admin actions are logged in the `admin_logs` table
- Row Level Security (RLS) ensures only admins can access admin data
- All modifications are tracked with timestamps and user IDs

## Troubleshooting

### "Access Denied" Error
- Ensure your user has `is_admin = true` in the profiles table
- Check that you're logged in with the correct account
- Verify the database migrations were applied successfully

### Profile Not Found
- Make sure you have your correct Clerk user ID (starts with "user_")
- The profile ID must match your Clerk user ID exactly
- Ensure you're using the correct email address associated with your Clerk account

### Database Errors
- Check that all migrations have been applied
- Verify your Supabase connection is working
- Check the browser console for detailed error messages

## Development Notes

### Adding New Admin Features
1. Add routes in `/src/App.jsx`
2. Create page components in `/src/admin/pages/`
3. Update navigation in `/src/admin/components/AdminLayout.jsx`
4. Ensure proper admin authentication checks

### Database Schema
Key tables for admin functionality:
- `profiles`: User profiles with admin flag
- `prompt_categories`: Categorization for prompts
- `admin_logs`: Audit trail of admin actions
- `base_prompts`: Enhanced with usage tracking and metadata

### Future Enhancements
- Analytics dashboard with usage graphs
- Bulk import/export of prompts
- A/B testing framework
- User management interface
- API key management
- Performance monitoring