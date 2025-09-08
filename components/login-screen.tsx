"use client"

import { useState } from "react"
import { MiniKit } from "@worldcoin/minikit-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/contexts/user-context"
import { checkOrbVerification, isUserAllowed } from "@/lib/verification"
import { createOrUpdateUser } from "@/lib/firebase/users"

interface LoginScreenProps {
  onLogin: () => void
}

type LoadingState = 'idle' | 'authenticating' | 'verifying'

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string>('')
  const { fetchUserData, setUser } = useUser()

  const handleWalletAuth = async () => {
    try {
      setError('') // Clear any previous errors
      setLoadingState('authenticating')

      // Check if MiniKit is installed and running in World App
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open this app in World App.')
      }

      // Get nonce from backend
      const nonceResponse = await fetch('/api/nonce')
      if (!nonceResponse.ok) {
        throw new Error('Failed to connect to server')
      }
      const { nonce } = await nonceResponse.json()

      // Trigger wallet authentication using MiniKit
      const walletAuthResult = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: `auth-${Date.now()}`,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        notBefore: new Date(),
        statement: "Sign in to Forum - Human Verified Community",
      })

      // According to docs, we should use finalPayload for SIWE verification
      if (!walletAuthResult.finalPayload) {
        throw new Error('Authentication failed - no response from wallet')
      }

      // Check if finalPayload indicates an error
      if (walletAuthResult.finalPayload.status === 'error') {
        throw new Error('Wallet authentication failed')
      }

      // Verify the SIWE signature on backend
      const verifyResponse = await fetch('/api/complete-siwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: walletAuthResult.finalPayload,
          nonce,
          skipOrbVerification: true // We'll do ORB verification separately in the frontend
        })
      })

      if (!verifyResponse.ok) {
        throw new Error('Authentication verification failed')
      }

      const { address } = await verifyResponse.json()

      // Check ORB verification
      setLoadingState('verifying')
      const isOrbVerified = await checkOrbVerification(address)
      
      // Check if user is allowed to use the app
      if (!isUserAllowed(address, isOrbVerified)) {
        setError('Get ORB verified to use Forum')
        return
      }

      // Create session after successful ORB verification
      const sessionResponse = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json()
        throw new Error(errorData.error || 'Session creation failed')
      }

      // Fetch user data and complete login
      const userData = await fetchUserData(address, isOrbVerified)
      
      // Store user data in Firebase
      try {
        console.log('Storing user data in Firebase...')
        const firebaseUserData = {
          walletAddress: address,
          username: userData.username,
          profilePictureUrl: userData.profilePicture,
          isVerified: isOrbVerified,
        }
        
        await createOrUpdateUser(firebaseUserData)
        console.log('User data successfully stored in Firebase')
      } catch (firebaseError) {
        console.error('Firebase storage error:', firebaseError)
        // Don't block login if Firebase fails, but log the error
        setError('User data stored locally. Some features may be limited.')
      }
      
      setUser(userData)

      // Complete login
      onLogin()

    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
    } finally {
      setLoadingState('idle')
    }
  }

  const getButtonText = () => {
    switch (loadingState) {
      case 'authenticating':
        return 'Authenticating...'
      case 'verifying':
        return 'Verifying...'
      default:
        return 'Login with Wallet'
    }
  }

  const isLoading = loadingState !== 'idle'
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* App Logo */}
      <div className="mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-black">
          <img 
            src="/world-forum-logo.png" 
            alt="Forum Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Forum</CardTitle>
          <CardDescription>Join the world's first human-verified community platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Connect with verified humans from around the world</p>
          </div>

          <Button 
            onClick={handleWalletAuth} 
            disabled={isLoading}
            className="w-full h-12 text-lg font-semibold" 
            size="lg"
          >
            <img 
              src="/worldcoinlogo.png" 
              alt="Worldcoin Logo" 
              className="w-5 h-5 mr-2 object-contain"
            />
            {getButtonText()}
          </Button>

          {/* Error message */}
          {error && (
            <div className="text-center">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Human verification badge */}
      <div className="mt-8 flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span>Human-verified community</span>
      </div>
    </div>
  )
}
