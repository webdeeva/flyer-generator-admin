// Script to set up admin user for Clerk authentication
// Run this after signing up through the app and getting your Clerk user ID

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdminWithClerk(clerkUserId, email) {
  try {
    // Validate Clerk user ID format
    if (!clerkUserId.startsWith('user_')) {
      console.error('Invalid Clerk user ID. It should start with "user_"')
      console.log('Example: user_2W8KlXp8kJqMLzH8kJqMLzH8')
      return
    }

    console.log(`Setting up admin for Clerk user: ${clerkUserId}`)
    console.log(`Email: ${email}`)

    // Insert or update the profile with admin status
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: clerkUserId,
        email: email,
        is_admin: true
      })
      .select()

    if (error) {
      console.error('Error updating profile:', error)
      if (error.code === '23505') {
        console.log('\nThis might be a duplicate key error. Try updating instead:')
        console.log(`UPDATE profiles SET is_admin = true WHERE id = '${clerkUserId}';`)
      }
      return
    }

    console.log(`✅ Successfully made ${email} an admin!`)
    console.log(`Clerk User ID: ${clerkUserId}`)
    console.log('\nYou can now access the admin panel at /admin')
    
    // Verify the profile was created/updated
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clerkUserId)
      .single()

    if (fetchError) {
      console.error('Error verifying profile:', fetchError)
    } else {
      console.log('\nProfile verified:')
      console.log(profile)
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

// Get arguments from command line
const clerkUserId = process.argv[2]
const email = process.argv[3]

if (!clerkUserId || !email) {
  console.log('Usage: node scripts/setup-admin-clerk.cjs <clerk-user-id> <email>')
  console.log('Example: node scripts/setup-admin-clerk.cjs user_2W8KlXp8kJqMLzH8kJqMLzH8 your@email.com')
  console.log('\nTo find your Clerk user ID:')
  console.log('1. Sign in to your app')
  console.log('2. Open browser console (F12)')
  console.log('3. Run: JSON.parse(localStorage.getItem("__clerk_db_jwt")).sub')
  console.log('4. Copy the user ID that starts with "user_"')
  process.exit(1)
}

setupAdminWithClerk(clerkUserId, email)