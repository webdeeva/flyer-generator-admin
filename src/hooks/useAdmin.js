import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateUUIDFromClerkId } from '../utils/generateUUID'

export const useAdmin = () => {
  const { user, isLoaded: userLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userLoaded || !user) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      try {
        // Generate consistent UUID from Clerk ID
        const uuid = generateUUIDFromClerkId(user.id)
        
        // Check if user exists in profiles table and is admin
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', uuid)
          .single()

        if (error) {
          // If profile doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: uuid,
                email: user.primaryEmailAddress?.emailAddress,
                is_admin: false
              })
              .select()
              .single()

            if (!insertError && newProfile) {
              setIsAdmin(newProfile.is_admin)
            }
          }
          console.error('Error checking admin status:', error)
        } else if (data) {
          setIsAdmin(data.is_admin === true)
        }
      } catch (err) {
        console.error('Error in admin check:', err)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, userLoaded])

  return {
    isAdmin,
    isLoading,
    user
  }
}

// Hook to require admin access - redirects if not admin
export const useRequireAdmin = () => {
  const { isAdmin, isLoading } = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard')
    }
  }, [isAdmin, isLoading, navigate])

  return { isAdmin, isLoading }
}