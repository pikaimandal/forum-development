"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, ChevronRight, Search, Globe, Code, Newspaper, Brain, HelpCircle, Megaphone } from "lucide-react"
import { getUserCommunities } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"

interface Community {
  id: string
  name: string
  description: string
  humans: number
  color: string
  icon: React.ReactNode
}

interface CommunitiesScreenProps {
  onNavigateToCommunity: (communityId: string) => void
  joinedCommunities: Set<string>
}

// Original hardcoded communities - ALWAYS available
const communities: Community[] = [
  {
    id: "global-chat",
    name: "Global Chat",
    description: "General discussion room for all topics and community introductions",
    humans: 18500,
    color: "bg-primary",
    icon: <Globe className="w-5 h-5 text-primary-foreground" />,
  },
  {
    id: "developer",
    name: "Developer",
    description: "Technical discussions, code reviews, and development help",
    humans: 5600,
    color: "bg-emerald-500",
    icon: <Code className="w-5 h-5 text-white" />,
  },
  {
    id: "world-news",
    name: "World News",
    description: "Global news, current events, and world affairs discussion",
    humans: 12300,
    color: "bg-blue-500",
    icon: <Newspaper className="w-5 h-5 text-white" />,
  },
  {
    id: "ai-tech",
    name: "AI & Tech",
    description: "Artificial intelligence, technology innovations, and future trends",
    humans: 8900,
    color: "bg-purple-500",
    icon: <Brain className="w-5 h-5 text-white" />,
  },
  {
    id: "qa",
    name: "Q&A",
    description: "Questions, answers, and knowledge sharing from the community",
    humans: 6700,
    color: "bg-amber-500",
    icon: <HelpCircle className="w-5 h-5 text-white" />,
  },
  {
    id: "announcements",
    name: "Announcements",
    description: "Official updates, news, and important platform announcements",
    humans: 15200,
    color: "bg-orange-500",
    icon: <Megaphone className="w-5 h-5 text-white" />,
  },
]

export function CommunitiesScreen({ onNavigateToCommunity, joinedCommunities }: CommunitiesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [firebaseJoinedCommunities, setFirebaseJoinedCommunities] = useState<Set<string>>(new Set())
  const { user } = useUser()

  // Load user's joined communities from Firebase (optional)
  useEffect(() => {
    async function loadUserCommunities() {
      if (user?.address) {
        try {
          const userCommunityIds = await getUserCommunities(user.address)
          setFirebaseJoinedCommunities(new Set(userCommunityIds))
        } catch (error) {
          console.log('Firebase user communities not available:', error)
          // Continue with local state only
        }
      }
    }

    loadUserCommunities()
  }, [user?.address])

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k"
    }
    return num.toString()
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="px-4 pt-6 pb-4 flex-shrink-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border rounded-full h-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {filteredCommunities.map((community) => {
            // Use Firebase joined communities with fallback to props
            const isJoined = firebaseJoinedCommunities.has(community.id) || joinedCommunities.has(community.id)

            return (
              <Card
                key={community.id}
                className="cursor-pointer hover:bg-muted/50 transition-all duration-200 border-border bg-card active:scale-95"
                onClick={() => onNavigateToCommunity(community.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full ${community.color} flex items-center justify-center flex-shrink-0`}
                      >
                        {community.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-base text-foreground">{community.name}</h3>
                          {isJoined && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              Joined
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-2">{community.description}</p>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span className="text-xs">{formatNumber(community.humans)} humans</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No communities found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  )
}
