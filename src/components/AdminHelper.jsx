import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { generateUUIDFromClerkId } from '../utils/generateUUID'

export function AdminHelper() {
  const { user } = useUser()
  const [showHelper, setShowHelper] = useState(false)

  if (!user) return null

  // Only show for specific email
  if (user.emailAddresses[0]?.emailAddress !== 'tavonia@gmail.com') {
    return null
  }

  const uuid = generateUUIDFromClerkId(user.id)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showHelper ? (
        <div className="bg-gray-900 text-white p-6 rounded-lg shadow-xl max-w-md">
          <h3 className="font-bold text-lg mb-3">Admin Setup Helper</h3>
          <p className="text-sm mb-2">Your Clerk User ID:</p>
          <div className="bg-gray-800 p-3 rounded font-mono text-sm mb-2 select-all">
            {user.id}
          </div>
          <p className="text-sm mb-2">Generated UUID for Supabase:</p>
          <div className="bg-gray-800 p-3 rounded font-mono text-sm mb-4 select-all">
            {uuid}
          </div>
          <p className="text-xs mb-3">
            To make yourself admin, run this SQL in Supabase:
          </p>
          <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto mb-4">
{`INSERT INTO profiles (id, email, is_admin) 
VALUES (
  '${uuid}',
  '${user.emailAddresses[0]?.emailAddress}',
  true
)
ON CONFLICT (id) 
DO UPDATE SET is_admin = true;`}
          </pre>
          <button
            onClick={() => setShowHelper(false)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            Close
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowHelper(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg"
        >
          Admin Setup
        </button>
      )}
    </div>
  )
}