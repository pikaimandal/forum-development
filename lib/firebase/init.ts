// Firebase initialization utilities
import { initializeDefaultCommunities } from './communities'

/**
 * Initialize Firebase with default data
 * Call this once to set up the database with default communities
 */
export async function initializeFirebase(): Promise<void> {
  try {
    console.log('Initializing Firebase with default data...')
    
    // Initialize default communities
    await initializeDefaultCommunities()
    
    console.log('Firebase initialization completed successfully')
  } catch (error) {
    console.error('Firebase initialization error:', error)
    throw error
  }
}

/**
 * Check if Firebase is properly initialized
 */
export async function checkFirebaseInitialization(): Promise<boolean> {
  try {
    const { getAllCommunities } = await import('./communities')
    const communities = await getAllCommunities()
    
    // Check if we have the expected default communities
    const expectedCommunities = ['global-chat', 'developer', 'world-news', 'ai-tech', 'qa', 'announcements']
    const existingCommunityIds = communities.map(c => c.id)
    
    const hasAllDefaultCommunities = expectedCommunities.every(id => 
      existingCommunityIds.includes(id)
    )
    
    return hasAllDefaultCommunities
  } catch (error) {
    console.error('Error checking Firebase initialization:', error)
    return false
  }
}
