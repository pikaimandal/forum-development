// Firebase community membership service
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp, 
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { updateCommunityMemberCount } from './communities'

export interface CommunityMembership {
  id: string // Document ID: {walletAddress}_{communityId}
  walletAddress: string
  communityId: string
  joinedAt: Timestamp
  isActive: boolean
}

export interface CreateMembershipData {
  walletAddress: string
  communityId: string
}

const MEMBERSHIPS_COLLECTION = 'community_memberships'

/**
 * Generate membership document ID
 */
function getMembershipId(walletAddress: string, communityId: string): string {
  return `${walletAddress}_${communityId}`
}

/**
 * Join a community
 */
export async function joinCommunity(membershipData: CreateMembershipData): Promise<CommunityMembership> {
  const { walletAddress, communityId } = membershipData
  const membershipId = getMembershipId(walletAddress, communityId)
  
  const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId)
  
  // Check if membership already exists
  const existingMembership = await getDoc(membershipRef)
  if (existingMembership.exists() && existingMembership.data().isActive) {
    // Already a member
    return {
      id: membershipId,
      ...existingMembership.data(),
    } as CommunityMembership
  }
  
  const now = serverTimestamp()
  
  const membership: Omit<CommunityMembership, 'id'> = {
    walletAddress,
    communityId,
    joinedAt: now as Timestamp,
    isActive: true,
  }
  
  // Use batch to update both membership and community member count
  const batch = writeBatch(db)
  batch.set(membershipRef, membership)
  
  await batch.commit()
  
  // Update community member count
  await updateCommunityMemberCount(communityId, 1)
  
  return {
    id: membershipId,
    ...membership,
  }
}

/**
 * Leave a community
 */
export async function leaveCommunity(walletAddress: string, communityId: string): Promise<void> {
  const membershipId = getMembershipId(walletAddress, communityId)
  const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId)
  
  // Check if membership exists
  const existingMembership = await getDoc(membershipRef)
  if (!existingMembership.exists() || !existingMembership.data().isActive) {
    return // Not a member
  }
  
  // Delete membership
  await deleteDoc(membershipRef)
  
  // Update community member count
  await updateCommunityMemberCount(communityId, -1)
}

/**
 * Check if user is a member of a community
 */
export async function isCommunityMember(walletAddress: string, communityId: string): Promise<boolean> {
  const membershipId = getMembershipId(walletAddress, communityId)
  const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId)
  
  const membershipSnap = await getDoc(membershipRef)
  
  return membershipSnap.exists() && membershipSnap.data().isActive === true
}

/**
 * Get all communities a user has joined
 */
export async function getUserCommunities(walletAddress: string): Promise<string[]> {
  const membershipsRef = collection(db, MEMBERSHIPS_COLLECTION)
  const q = query(
    membershipsRef,
    where('walletAddress', '==', walletAddress),
    where('isActive', '==', true)
  )
  
  const querySnapshot = await getDocs(q)
  const communityIds: string[] = []
  
  querySnapshot.forEach((doc) => {
    const membership = doc.data() as CommunityMembership
    communityIds.push(membership.communityId)
  })
  
  return communityIds
}

/**
 * Get community membership details
 */
export async function getCommunityMembership(
  walletAddress: string, 
  communityId: string
): Promise<CommunityMembership | null> {
  const membershipId = getMembershipId(walletAddress, communityId)
  const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId)
  
  const membershipSnap = await getDoc(membershipRef)
  
  if (membershipSnap.exists()) {
    return {
      id: membershipId,
      ...membershipSnap.data(),
    } as CommunityMembership
  }
  
  return null
}

/**
 * Auto-join user to Global Chat community (called after user creation)
 */
export async function autoJoinGlobalChat(walletAddress: string): Promise<void> {
  const globalChatId = 'global-chat'
  
  try {
    // Check if already a member
    const isAlreadyMember = await isCommunityMember(walletAddress, globalChatId)
    
    if (!isAlreadyMember) {
      await joinCommunity({
        walletAddress,
        communityId: globalChatId
      })
      console.log(`User ${walletAddress} auto-joined Global Chat`)
    }
  } catch (error) {
    console.error('Error auto-joining Global Chat:', error)
    // Don't throw error - this shouldn't block user registration
  }
}

/**
 * Batch join multiple communities
 */
export async function joinMultipleCommunities(
  walletAddress: string, 
  communityIds: string[]
): Promise<void> {
  const batch = writeBatch(db)
  
  for (const communityId of communityIds) {
    const membershipId = getMembershipId(walletAddress, communityId)
    const membershipRef = doc(db, MEMBERSHIPS_COLLECTION, membershipId)
    
    // Check if membership already exists
    const existingMembership = await getDoc(membershipRef)
    if (!existingMembership.exists() || !existingMembership.data().isActive) {
      const now = serverTimestamp()
      const membership = {
        walletAddress,
        communityId,
        joinedAt: now,
        isActive: true,
      }
      
      batch.set(membershipRef, membership)
    }
  }
  
  await batch.commit()
  
  // Update member counts for each community
  for (const communityId of communityIds) {
    const isAlreadyMember = await isCommunityMember(walletAddress, communityId)
    if (!isAlreadyMember) {
      await updateCommunityMemberCount(communityId, 1)
    }
  }
}
