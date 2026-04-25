'use client'

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '@/config/storage-keys'
import { SESSION_DURATION_MS } from '@/lib/constants'

interface AdminSession {
  email: string
  timestamp: number
}

function hasValidAdminSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION)
    if (!saved) return false
    const session: AdminSession = JSON.parse(saved)
    return Date.now() - session.timestamp <= SESSION_DURATION_MS
  } catch {
    return false
  }
}

/**
 * Hook for managing app mode (demo/live).
 *
 * Rules:
 * - Default mode is always 'live' for public users
 * - Demo mode requires a valid admin session + explicit activation
 * - Without valid admin session, any stored 'demo' mode falls back to 'live'
 */
export function useAppMode() {
  const [mode, setMode] = useState<'demo' | 'live'>('live')
  const [hasAdminSession, setHasAdminSession] = useState(false)

  useEffect(() => {
    // Check admin session validity
    const adminValid = hasValidAdminSession()
    setHasAdminSession(adminValid)

    // Load saved mode, but only respect 'demo' if admin session is valid
    const saved = localStorage.getItem(STORAGE_KEYS.APP_MODE)
    if (saved === 'demo' && adminValid) {
      setMode('demo')
    } else if (saved === 'live') {
      setMode('live')
    } else {
      // Default to live, clear any orphaned demo flag
      setMode('live')
      localStorage.setItem(STORAGE_KEYS.APP_MODE, 'live')
    }
  }, [])

  const setAppMode = useCallback((newMode: 'demo' | 'live', options?: { skipReload?: boolean }) => {
    // Prevent setting demo mode without valid admin session
    if (newMode === 'demo' && !hasValidAdminSession()) {
      console.warn('[useAppMode] Cannot activate demo mode without valid admin session')
      return
    }

    setMode(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.APP_MODE, newMode)
      // Force reload unless explicitly skipped (e.g., when redirecting)
      if (!options?.skipReload) {
        window.location.reload()
      }
    }
  }, [])

  const toggleMode = useCallback(() => {
    const newMode = mode === 'demo' ? 'live' : 'demo'
    setAppMode(newMode)
  }, [mode, setAppMode])

  // Effective demo access requires both mode='demo' AND valid admin session
  const effectiveDemo = mode === 'demo' && hasAdminSession

  return {
    mode,
    isDemo: effectiveDemo,
    isLive: !effectiveDemo,
    hasAdminSession,
    setMode: setAppMode,
    toggleMode,
  }
}
