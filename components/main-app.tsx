"use client"

import { useState, useEffect } from "react"
import { CommunitiesScreen } from "@/components/communities-screen"
import { CommunityDetailScreen } from "@/components/community-detail-screen"
import { ChatScreen } from "@/components/chat-screen"
import { DiscoverScreen } from "@/components/discover-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { BottomNavigation } from "@/components/bottom-navigation"
import { getUserCommunities } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"
import type { MainScreen } from "@/types"
import { DEFAULT_JOINED_COMMUNITIES } from "@/lib/constants"

interface MainAppProps {
  onLogout: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [currentScreen, setCurrentScreen] = useState<MainScreen>("communities")
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("")
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set(DEFAULT_JOINED_COMMUNITIES))
  const [firebaseJoinedCommunities, setFirebaseJoinedCommunities] = useState<Set<string>>(new Set())
  const { user } = useUser()

  // Load user's joined communities from Firebase
  useEffect(() => {
    async function loadUserCommunities() {
      if (user?.address) {
        try {
          const userCommunityIds = await getUserCommunities(user.address)
          setFirebaseJoinedCommunities(new Set(userCommunityIds))
        } catch (error) {
          console.error('Error loading user communities:', error)
        }
      }
    }

    loadUserCommunities()
  }, [user?.address])

  const handleNavigateToCommunity = (communityId: string) => {
    setSelectedCommunityId(communityId)
    setCurrentScreen("community-detail")
  }

  const handleJoinCommunity = (communityId: string) => {
    // Update local state and Firebase state will be updated by the component
    setJoinedCommunities((prev) => new Set([...prev, communityId]))
    setFirebaseJoinedCommunities((prev) => new Set([...prev, communityId]))
  }

  const handleLeaveCommunity = (communityId: string) => {
    // Update local state and Firebase state will be updated by the component
    setJoinedCommunities((prev) => {
      const newSet = new Set(prev)
      newSet.delete(communityId)
      return newSet
    })
    setFirebaseJoinedCommunities((prev) => {
      const newSet = new Set(prev)
      newSet.delete(communityId)
      return newSet
    })
  }

  const handleEnterChat = (communityId: string) => {
    setSelectedCommunityId(communityId)
    setCurrentScreen("chat")
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "communities":
        return (
          <CommunitiesScreen 
            onNavigateToCommunity={handleNavigateToCommunity} 
            joinedCommunities={joinedCommunities} 
          />
        )
      case "community-detail":
        return (
          <CommunityDetailScreen
            communityId={selectedCommunityId}
            onBack={() => setCurrentScreen("communities")}
            onJoinCommunity={handleJoinCommunity}
            onLeaveCommunity={handleLeaveCommunity}
            onEnterChat={handleEnterChat}
            isJoined={firebaseJoinedCommunities.has(selectedCommunityId) || joinedCommunities.has(selectedCommunityId)}
          />
        )
      case "chat":
        return <ChatScreen communityId={selectedCommunityId} onBack={() => setCurrentScreen("community-detail")} />
      case "discover":
        return <DiscoverScreen onNavigateToCommunity={handleNavigateToCommunity} />
      case "profile":
        return <ProfileScreen onLogout={onLogout} />
      default:
        return (
          <CommunitiesScreen onNavigateToCommunity={handleNavigateToCommunity} joinedCommunities={joinedCommunities} />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex-1 overflow-hidden min-h-0">{renderScreen()}</div>
      <BottomNavigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
    </div>
  )
}
