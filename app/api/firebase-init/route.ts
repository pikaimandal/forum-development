// API endpoint to initialize Firebase with default communities
import { NextRequest, NextResponse } from "next/server"
import { initializeFirebase } from "@/lib/firebase/init"

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 Initializing Firebase with default communities...")
    
    await initializeFirebase()
    
    console.log("✅ Firebase initialization completed successfully")
    
    return NextResponse.json({ 
      success: true,
      message: "Firebase initialized with default communities"
    })
    
  } catch (error) {
    console.error("💥 Firebase initialization error:", error)
    
    return NextResponse.json(
      { 
        error: "Firebase initialization failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { checkFirebaseInitialization } = await import("@/lib/firebase/init")
    const isInitialized = await checkFirebaseInitialization()
    
    return NextResponse.json({
      initialized: isInitialized,
      message: isInitialized 
        ? "Firebase is properly initialized"
        : "Firebase needs initialization"
    })
    
  } catch (error) {
    console.error("Error checking Firebase initialization:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to check Firebase initialization",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
