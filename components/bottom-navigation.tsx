"use client"

import type { MainScreen } from "@/components/main-app"

interface BottomNavigationProps {
  currentScreen: MainScreen
  onScreenChange: (screen: MainScreen) => void
}

export function BottomNavigation({ currentScreen, onScreenChange }: BottomNavigationProps) {
  const navItems = [
    {
      id: "communities" as MainScreen,
      label: "Communities",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
    {
      id: "chat" as MainScreen,
      label: "Chat",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      id: "profile" as MainScreen,
      label: "Profile",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className="flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors"
          >
            {item.icon(currentScreen === item.id)}
            <span
              className={`text-xs font-medium ${currentScreen === item.id ? "text-primary" : "text-muted-foreground"}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
