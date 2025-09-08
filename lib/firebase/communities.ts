// Firebase community service for community management
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  serverTimestamp, 
  Timestamp,
  increment,
  writeBatch,
  orderBy
} from 'firebase/firestore'
import { db } from './config'

export interface FirebaseCommunity {
  id: string
  name: string
  description: string
  memberCount: number
  color: string
  category: string
  rules: string[]
  moderators: string[]
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface CreateCommunityData {
  id: string
  name: string
  description: string
  color: string
  category: string
  rules: string[]
  moderators: string[]
  isActive?: boolean
}

const COMMUNITIES_COLLECTION = 'communities'

/**
 * Create a new community in Firestore
 */
export async function createCommunity(communityData: CreateCommunityData): Promise<FirebaseCommunity> {
  const { id, name, description, color, category, rules, moderators, isActive = true } = communityData
  
  const communityRef = doc(db, COMMUNITIES_COLLECTION, id)
  
  const now = serverTimestamp()
  
  const community: Omit<FirebaseCommunity, 'id'> = {
    name,
    description,
    memberCount: 0,
    color,
    category,
    rules,
    moderators,
    isActive,
    createdAt: now as Timestamp,
    updatedAt: now as Timestamp,
  }
  
  await setDoc(communityRef, community)
  
  return {
    id,
    ...community,
  }
}

/**
 * Get community by ID
 */
export async function getCommunityById(communityId: string): Promise<FirebaseCommunity | null> {
  const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId)
  const communitySnap = await getDoc(communityRef)
  
  if (communitySnap.exists()) {
    const communityData = communitySnap.data()
    return {
      id: communityId,
      ...communityData,
    } as FirebaseCommunity
  }
  
  return null
}

/**
 * Get all active communities
 */
export async function getAllCommunities(): Promise<FirebaseCommunity[]> {
  const communitiesRef = collection(db, COMMUNITIES_COLLECTION)
  const q = query(
    communitiesRef, 
    where('isActive', '==', true),
    orderBy('memberCount', 'desc')
  )
  
  const querySnapshot = await getDocs(q)
  const communities: FirebaseCommunity[] = []
  
  querySnapshot.forEach((doc) => {
    communities.push({
      id: doc.id,
      ...doc.data(),
    } as FirebaseCommunity)
  })
  
  return communities
}

/**
 * Update community member count
 */
export async function updateCommunityMemberCount(communityId: string, increment_value: number): Promise<void> {
  const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId)
  
  const batch = writeBatch(db)
  batch.update(communityRef, {
    memberCount: increment(increment_value),
    updatedAt: serverTimestamp()
  })
  
  await batch.commit()
}

/**
 * Initialize default communities (run once during setup)
 */
export async function initializeDefaultCommunities(): Promise<void> {
  const defaultCommunities: CreateCommunityData[] = [
    {
      id: "global-chat",
      name: "Global Chat",
      description: "General discussion room for all topics and community introductions. This is the main hub where verified humans can connect, share ideas, and engage in meaningful conversations about any subject.",
      color: "bg-primary",
      category: "General",
      rules: [
        "Be respectful and kind to all community members",
        "No spam, self-promotion, or off-topic content",
        "Keep discussions constructive and meaningful",
        "Report inappropriate behavior to moderators",
      ],
      moderators: ["@CommunityMod", "@GlobalAdmin"],
      isActive: true,
    },
    {
      id: "developer",
      name: "Developer",
      description: "Technical discussions, code reviews, and development help. Share your projects, ask for advice, and collaborate with fellow developers on various programming languages and technologies.",
      color: "bg-emerald-500",
      category: "Technology",
      rules: [
        "Share code snippets and technical resources",
        "Help others with programming questions",
        "No job postings without prior approval",
        "Keep discussions technical and relevant",
      ],
      moderators: ["@DevLead", "@TechModerator"],
      isActive: true,
    },
    {
      id: "world-news",
      name: "World News",
      description: "Global news, current events, and world affairs discussion. Stay informed about what's happening around the world and engage in thoughtful discussions about current events.",
      color: "bg-blue-500",
      category: "News",
      rules: [
        "Share credible news sources only",
        "Maintain civil discourse on sensitive topics",
        "No misinformation or conspiracy theories",
        "Fact-check before sharing information",
      ],
      moderators: ["@NewsEditor", "@FactChecker"],
      isActive: true,
    },
    {
      id: "ai-tech",
      name: "AI & Tech",
      description: "Artificial intelligence, technology innovations, and future trends. Explore the latest developments in AI, discuss emerging technologies, and share insights about the future of tech.",
      color: "bg-purple-500",
      category: "Technology",
      rules: [
        "Share AI research and tech innovations",
        "Discuss ethical implications of technology",
        "No fear-mongering about AI",
        "Support claims with credible sources",
      ],
      moderators: ["@AIResearcher", "@TechExpert"],
      isActive: true,
    },
    {
      id: "qa",
      name: "Q&A",
      description: "Questions, answers, and knowledge sharing from the community. Ask anything you're curious about and help others by sharing your knowledge and expertise.",
      color: "bg-amber-500",
      category: "Help & Support",
      rules: [
        "Ask clear and specific questions",
        "Provide helpful and accurate answers",
        "Search before asking duplicate questions",
        "Thank contributors for their help",
      ],
      moderators: ["@KnowledgeKeeper", "@HelpModerator"],
      isActive: true,
    },
    {
      id: "announcements",
      name: "Announcements",
      description: "Official updates, news, and important platform announcements. Stay up to date with the latest Forum features, policy changes, and community updates.",
      color: "bg-orange-500",
      category: "Official",
      rules: [
        "Official announcements only",
        "Read announcements before asking questions",
        "Provide feedback constructively",
        "Follow new guidelines promptly",
      ],
      moderators: ["@ForumTeam", "@CommunityManager"],
      isActive: true,
    },
  ]

  const batch = writeBatch(db)
  
  for (const communityData of defaultCommunities) {
    const communityRef = doc(db, COMMUNITIES_COLLECTION, communityData.id)
    
    // Check if community already exists
    const existingCommunity = await getDoc(communityRef)
    if (!existingCommunity.exists()) {
      const now = serverTimestamp()
      const community = {
        name: communityData.name,
        description: communityData.description,
        memberCount: 0,
        color: communityData.color,
        category: communityData.category,
        rules: communityData.rules,
        moderators: communityData.moderators,
        isActive: communityData.isActive,
        createdAt: now,
        updatedAt: now,
      }
      
      batch.set(communityRef, community)
    }
  }
  
  await batch.commit()
  console.log('Default communities initialized successfully')
}
