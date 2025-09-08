"use client"

import { useState, useEffect, useCallback } from "react"
import { MiniKit } from "@worldcoin/minikit-js"
import { SplashScreen } from "@/components/splash-screen"
import { LoginScreen } from "@/components/login-screen"
import { MainApp } from "@/components/main-app"
import { WorldAppWarning } from "@/components/world-app-warning"
import { useUser } from "@/contexts/user-context"
import { createOrUpdateUser } from "@/lib/firebase/users"
import type { Screen } from "@/types"

export default function ForumApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash")
  const [isWorldApp, setIsWorldApp] = useState<boolean | null>(null)
  const [miniKitInitialized, setMiniKitInitialized] = useState(false)
  const [initializationComplete, setInitializationComplete] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false) // Prevent re-initialization
  const { user, setUser, fetchUserData } = useUser()

  // Use authentication state from user context
  const isAuthenticated = user !== null

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) return

    // Initialize MiniKit and check World App environment immediately
    const initializeMiniKit = async () => {
      try {
        setHasInitialized(true) // Mark as initialized immediately
        
        // Check if running in World App environment (immediate check)
        const isInWorldApp = typeof window !== "undefined" && MiniKit.isInstalled()
        console.log("World App detection:", isInWorldApp)
        setIsWorldApp(isInWorldApp)
        
        if (isInWorldApp) {
          // MiniKit is available and installed
          setMiniKitInitialized(true)
          console.log("MiniKit initialized successfully in World App")
          
          // Check for existing session quickly
          try {
            const sessionResponse = await fetch('/api/session')
            if (sessionResponse.ok) {
              const { isAuthenticated, address, isOrbVerified } = await sessionResponse.json()
              if (isAuthenticated && address) {
                // Restore user session
                const userData = await fetchUserData(address, isOrbVerified)
                
                // Update Firebase with latest login
                try {
                  const firebaseUserData = {
                    walletAddress: address,
                    username: userData.username,
                    profilePictureUrl: userData.profilePicture,
                    isVerified: isOrbVerified,
                  }
                  await createOrUpdateUser(firebaseUserData)
                  console.log('Firebase user data updated on session restore')
                } catch (firebaseError) {
                  console.error('Firebase update error on session restore:', firebaseError)
                }
                
                setUser(userData)
              }
            }
          } catch (error) {
            console.log("Session check failed:", error)
          }
        } else {
          console.log("App is not running in World App environment")
        }
      } catch (error) {
        console.error("MiniKit initialization error:", error)
        setIsWorldApp(false)
      }
    }

    // Start initialization immediately
    initializeMiniKit()
  }, []) // Remove setUser from dependencies to prevent re-runs

  // Handle splash screen completion (only run once)
  const handleSplashComplete = useCallback(() => {
    if (initializationComplete) return // Prevent multiple calls
    
    console.log("Splash complete - isWorldApp:", isWorldApp, "miniKitInitialized:", miniKitInitialized, "isAuthenticated:", isAuthenticated)
    setInitializationComplete(true)
    
    // Move to appropriate screen based on current environment detection
    if (isWorldApp === false) {
      // Definitely not in World App - show warning
      setCurrentScreen("world-app-warning")
    } else if (isWorldApp === true && miniKitInitialized) {
      // Definitely in World App and initialized
      if (isAuthenticated) {
        setCurrentScreen("main")
      } else {
        setCurrentScreen("login")
      }
    } else {
      // If still uncertain about environment after 3 seconds, assume not in World App
      console.log("Environment detection uncertain after timeout, assuming not in World App")
      setIsWorldApp(false)
      setCurrentScreen("world-app-warning")
    }
  }, [initializationComplete, isWorldApp, miniKitInitialized, isAuthenticated])
  const handleLogin = () => {
    // Authentication is handled in LoginScreen via user context
    setCurrentScreen("main")
  }

  const handleLogout = async () => {
    try {
      // Clear session on server
      await fetch('/api/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout API error:', error)
    }
    // Clear user data in frontend
    setUser(null)
    setCurrentScreen("login")
  }

  // Show splash screen during initialization
  if (currentScreen === "splash" || !initializationComplete) {
    return <SplashScreen onInitializationComplete={handleSplashComplete} />
  }

  // Block access if not in World App (explicit screen state or environment check)
  if (currentScreen === "world-app-warning" || isWorldApp === false) {
    return <WorldAppWarning />
  }

  // Show loading if still checking World App environment
  if (isWorldApp === null) {
    return <SplashScreen onInitializationComplete={handleSplashComplete} />
  }

  if (currentScreen === "login") {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <MainApp onLogout={handleLogout} />
}
