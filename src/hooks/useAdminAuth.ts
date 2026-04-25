'use client'

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '@/config/storage-keys'
import { SESSION_DURATION_MS } from '@/lib/constants'

// Simple admin credentials - in production, this should be server-side
const ADMIN_EMAIL = 'admin@hearst.app'
const ADMIN_PASSWORD_HASH = '5045c8f03dc38b3428abb7f692e6776492550f2bf1bc188d43dd26fdde34e67e' // "hearst2024"

interface AdminSession {
  email: string
  timestamp: number
}

// Simple SHA-256 hash (client-side only)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION)
      if (!saved) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      const session: AdminSession = JSON.parse(saved)
      const now = Date.now()

      if (now - session.timestamp > SESSION_DURATION_MS) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION)
        setIsAuthenticated(false)
      } else {
        setIsAuthenticated(true)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION)
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null)

    if (email !== ADMIN_EMAIL) {
      setError('Invalid credentials')
      return false
    }

    const hashed = await hashPassword(password)
    if (hashed !== ADMIN_PASSWORD_HASH) {
      setError('Invalid credentials')
      return false
    }

    const session: AdminSession = {
      email,
      timestamp: Date.now(),
    }

    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session))
    setIsAuthenticated(true)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  }
}
