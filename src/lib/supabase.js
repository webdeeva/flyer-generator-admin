import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SECURITY WARNING: This should only be used in development!
// In production, storage operations should be done through a secure backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)