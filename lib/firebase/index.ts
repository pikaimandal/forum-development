// Firebase utilities index
export { db, auth } from './config'
export { adminDb } from './admin'
export * from './users'

// Re-export Firebase types and functions
export type { Timestamp } from 'firebase/firestore'
export { serverTimestamp } from 'firebase/firestore'
