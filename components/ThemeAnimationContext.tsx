'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeAnimationContextType {
  startAnimation: () => void
}

const ThemeAnimationContext = createContext<ThemeAnimationContextType | undefined>(undefined)

export function useThemeAnimation() {
  const context = useContext(ThemeAnimationContext)
  if (!context) {
    throw new Error('useThemeAnimation must be used within ThemeAnimationProvider')
  }
  return context
}

export function ThemeAnimationProvider({ children }: { children: ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }

  return (
    <ThemeAnimationContext.Provider value={{ startAnimation }}>
      {children}
      {isAnimating && (
        <div
          key="theme-transition"
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          style={{
            animation: 'themeSlide 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          <div className="absolute inset-0 bg-background/98 backdrop-blur-sm" />
        </div>
      )}
    </ThemeAnimationContext.Provider>
  )
}
