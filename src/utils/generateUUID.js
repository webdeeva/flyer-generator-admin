// Convert Clerk user ID to a deterministic UUID
// This creates a consistent UUID v5 based on the Clerk ID
export function generateUUIDFromClerkId(clerkId) {
  // Simple deterministic UUID generation
  // Using a namespace UUID and the Clerk ID to generate a consistent UUID
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8' // Standard namespace UUID
  let hash = 0
  const str = namespace + clerkId
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Format as UUID
  const hex = Math.abs(hash).toString(16).padStart(32, '0')
  return [
    hex.substr(0, 8),
    hex.substr(8, 4),
    '5' + hex.substr(13, 3), // Version 5
    ((parseInt(hex.substr(16, 2), 16) & 0x3f) | 0x80).toString(16) + hex.substr(18, 2),
    hex.substr(20, 12)
  ].join('-')
}