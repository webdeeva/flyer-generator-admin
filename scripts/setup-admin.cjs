// Script to set up admin user
// Run this after applying the migration to make yourself an admin

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdmin(email) {
  try {
    // First, find the user by email in auth.users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error fetching users:', userError)
      return
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`User with email ${email} not found in auth.users`)
      console.log('\nAvailable users:')
      if (users.users.length === 0) {
        console.log('No users found. Please sign up first through the application.')
      } else {
        users.users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`))
      }
      console.log('\nNote: You need to sign up through the application first before making yourself an admin.')
      return
    }

    // Update or insert the profile with admin status
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        is_admin: true
      })

    if (error) {
      console.error('Error updating profile:', error)
      return
    }

    console.log(`✅ Successfully made ${email} an admin!`)
    console.log(`User ID: ${user.id}`)
    console.log('\nYou can now access the admin panel at /admin')
  } catch (err) {
    console.error('Error:', err)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/setup-admin.js <email>')
  console.log('Example: node scripts/setup-admin.js your@email.com')
  process.exit(1)
}

setupAdmin(email)