"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Users, MessageCircle, Shield, CheckCircle, UserMinus, Crown, Clock, Globe, Code, Newspaper, Brain, HelpCircle, Megaphone } from "lucide-react"
import { joinCommunity, leaveCommunity, isCommunityMember } from "@/lib/firebase"
import { useUser } from "@/contexts/user-context"
import { formatNumber } from "@/lib/utils"
import { DEMO_COMMUNITIES } from "@/lib/data"

interface CommunityDetailScreenProps {
  communityId: string
  onBack: () => void
  onJoinCommunity: (communityId: string) => void
  onLeaveCommunity: (communityId: string) => void
  onEnterChat: (communityId: string) => void
  isJoined: boolean
}

// Icon mapping for communities
const getIconForCommunity = (communityId: string): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "global-chat": Globe,
    "developer": Code,
    "world-news": Newspaper,
    "ai-tech": Brain,
    "qa": HelpCircle,
    "announcements": Megaphone,
  }
  
  return iconMap[communityId] || Globe
}

export function CommunityDetailScreen({
  communityId,
  onBack,
  onJoinCommunity,
  onLeaveCommunity,
  onEnterChat,
  isJoined,
}: CommunityDetailScreenProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [community, setCommunity] = useState<FirebaseCommunity | null>(null)
  const [firebaseIsJoined, setFirebaseIsJoined] = useState(false)
  const { user } = useUser()

  // Load community data and membership status from Firebase
  useEffect(() => {
    async function loadCommunity() {
      try {
        setLoading(true)
        
        // Load community data
        const communityData = await getCommunityById(communityId)
        setCommunity(communityData)
        
        // Check if user is a member
        if (user?.address && communityData) {
          const memberStatus = await isCommunityMember(user.address, communityId)
          setFirebaseIsJoined(memberStatus)
        }
        
      } catch (error) {
        console.error('Error loading community:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCommunity()
  }, [communityId, user?.address])

  // Handle join community
  const handleJoin = async () => {
    if (!user?.address || !community) return
    
    try {
      setIsJoining(true)
      await joinCommunity({
        walletAddress: user.address,
        communityId: community.id
      })
      
      setFirebaseIsJoined(true)
      onJoinCommunity(community.id)
      
      // Update member count in local state
      setCommunity(prev => prev ? {
        ...prev,
        memberCount: prev.memberCount + 1
      } : prev)
      
    } catch (error) {
      console.error('Error joining community:', error)
    } finally {
      setIsJoining(false)
    }
  }

  // Handle leave community
  const handleLeave = async () => {
    if (!user?.address || !community) return
    
    try {
      setIsLeaving(true)
      await leaveCommunity(user.address, community.id)
      
      setFirebaseIsJoined(false)
      onLeaveCommunity(community.id)
      
      // Update member count in local state
      setCommunity(prev => prev ? {
        ...prev,
        memberCount: Math.max(0, prev.memberCount - 1)
      } : prev)
      
    } catch (error) {
      console.error('Error leaving community:', error)
    } finally {
      setIsLeaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Community not found</h2>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getIconTextColor = (communityId: string) => {
    if (communityId === "global-chat") {
      return "text-primary-foreground"
    }
    return "text-white"
  }

  // Use Firebase membership status with fallback to props
  const membershipStatus = firebaseIsJoined || isJoined
  const CommunityIcon = getIconForCommunity(community.id)

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0 bg-background">
        <div className="flex items-center space-x-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Community</h1>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl ${community.color} flex items-center justify-center flex-shrink-0`}
              >
                <CommunityIcon className={`w-8 h-8 ${getIconTextColor(community.id)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h2 className="text-xl font-bold text-foreground">{community.name}</h2>
                  {membershipStatus && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Joined
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{formatNumber(community.memberCount || 0)} humans</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </div>
                <p className="text-foreground text-sm leading-relaxed">{community.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {membershipStatus ? (
            <div className="flex space-x-3">
              <Button onClick={() => onEnterChat(communityId)} size="default" className="flex-1 h-12">
                <MessageCircle className="w-5 h-5 mr-2" />
                Enter Chat Room
              </Button>
              <Button
                onClick={handleLeave}
                disabled={isLeaving}
                variant="outline"
                size="default"
                className="px-4 h-12 bg-transparent border-destructive/20 text-destructive hover:bg-destructive/10"
              >
                {isLeaving ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                ) : (
                  <UserMinus className="w-5 h-5" />
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={handleJoin} disabled={isJoining} size="default" className="w-full h-12">
              {isJoining ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Joining Community...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Join Community
                </>
              )}
            </Button>
          )}

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Community Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{formatNumber(community.memberCount || 0)}</div>
                  <div className="text-xs text-muted-foreground">Total Humans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">24/7</div>
                  <div className="text-xs text-muted-foreground">Always Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Community Guidelines</h3>
              </div>
              <div className="space-y-3">
                {community.rules.map((rule: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-semibold text-foreground">Community Moderators</h3>
              </div>
              <div className="space-y-2">
                {community.moderators.map((moderator, index) => (
                  <div key={moderator} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{moderator}</span>
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/20">
                          Moderator
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Active now</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">About This Community</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground font-medium">September 2025</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="secondary" className="bg-muted text-foreground">
                    {community.category}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verification Required</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-foreground font-medium">ORB Verified</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
