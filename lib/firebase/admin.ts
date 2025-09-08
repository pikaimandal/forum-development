// Firebase Admin SDK configuration for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const adminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // For production, you'll need to add the service account key
  // credential: cert({
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // }),
}

// Initialize Firebase Admin (only once)
const app = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0]

// Initialize Firestore Admin
export const adminDb = getFirestore(app)

export default app
