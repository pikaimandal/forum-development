// Firebase user service for authentication and user management
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore'
import { db } from './config'

export interface FirebaseUser {
  uid: string // wallet address will be used as uid
  walletAddress: string
  username: string
  profilePictureUrl?: string
  isVerified: boolean
  firstLogin: Timestamp
  lastLogin: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateUserData {
  walletAddress: string
  username: string
  profilePictureUrl?: string
  isVerified: boolean
}

export interface UpdateUserData {
  username?: string
  profilePictureUrl?: string
  isVerified?: boolean
  lastLogin?: Timestamp
}

const USERS_COLLECTION = 'users'

/**
 * Create a new user in Firestore
 */
export async function createUser(userData: CreateUserData): Promise<FirebaseUser> {
  const { walletAddress, username, profilePictureUrl, isVerified } = userData
  
  // Use wallet address as the document ID (uid)
  const userRef = doc(db, USERS_COLLECTION, walletAddress)
  
  const now = serverTimestamp()
  
  const user: Omit<FirebaseUser, 'uid'> = {
    walletAddress,
    username,
    profilePictureUrl,
    isVerified,
    firstLogin: now as Timestamp,
    lastLogin: now as Timestamp,
    createdAt: now as Timestamp,
    updatedAt: now as Timestamp,
  }
  
  await setDoc(userRef, user)
  
  return {
    uid: walletAddress,
    ...user,
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByAddress(walletAddress: string): Promise<FirebaseUser | null> {
  const userRef = doc(db, USERS_COLLECTION, walletAddress)
  const userSnap = await getDoc(userRef)
  
  if (userSnap.exists()) {
    const userData = userSnap.data()
    return {
      uid: walletAddress,
      ...userData,
    } as FirebaseUser
  }
  
  return null
}

/**
 * Update user data
 */
export async function updateUser(
  walletAddress: string, 
  updateData: UpdateUserData
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, walletAddress)
  
  const updatePayload = {
    ...updateData,
    updatedAt: serverTimestamp(),
  }
  
  await updateDoc(userRef, updatePayload)
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(walletAddress: string): Promise<void> {
  await updateUser(walletAddress, {
    lastLogin: serverTimestamp() as Timestamp,
  })
}

/**
 * Check if user exists in Firestore
 */
export async function userExists(walletAddress: string): Promise<boolean> {
  const user = await getUserByAddress(walletAddress)
  return user !== null
}

/**
 * Create or update user (upsert operation)
 */
export async function createOrUpdateUser(userData: CreateUserData): Promise<FirebaseUser> {
  const { walletAddress } = userData
  
  // Check if user already exists
  const existingUser = await getUserByAddress(walletAddress)
  
  if (existingUser) {
    // Update existing user's last login and other data
    await updateUser(walletAddress, {
      username: userData.username,
      profilePictureUrl: userData.profilePictureUrl,
      isVerified: userData.isVerified,
      lastLogin: serverTimestamp() as Timestamp,
    })
    
    // Return updated user data
    return await getUserByAddress(walletAddress) as FirebaseUser
  } else {
    // Create new user
    return await createUser(userData)
  }
}
