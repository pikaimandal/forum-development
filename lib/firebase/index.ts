// Firebase utilities index
export { db, auth } from './config'
// Note: adminDb is only for server-side use in API routes
export * from './users'
export * from './communities'
export * from './memberships'
export * from './init'

// Re-export Firebase types and functions
export type { Timestamp } from 'firebase/firestore'
export { serverTimestamp } from 'firebase/firestore'
