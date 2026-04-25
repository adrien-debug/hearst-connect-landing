/**
 * Backend User Hook
 * Manages the backend user entity tied to the authenticated wallet
 * Uses SIWE session cookie for authentication (HTTP-only, set by /api/auth/verify)
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { UsersApi, setApiAuthenticated } from '@/lib/api-client'
import { useSiweAuth } from './useSiweAuth'
import type { DbUser } from '@/lib/db/schema'

const USER_QUERY_KEY = 'backend-user'

export function useBackendUser() {
  const { address } = useAccount()
  const { isAuthenticated: isSiweAuthenticated, isLoading: isSiweLoading } = useSiweAuth()
  const queryClient = useQueryClient()

  // Query to get/create user (only when SIWE authenticated)
  const {
    data: user,
    isLoading: isUserLoading,
    error,
    refetch,
  } = useQuery<DbUser | null>({
    queryKey: [USER_QUERY_KEY],
    queryFn: async () => {
      if (!isSiweAuthenticated) return null
      try {
        const result = await UsersApi.findOrCreate()
        return result.user
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[useBackendUser] Failed to find/create user:', e)
        }
        // If API returns 401, mark as not authenticated
        if (e instanceof Error && e.message.includes('401')) {
          setApiAuthenticated(false)
        }
        return null
      }
    },
    enabled: isSiweAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  // Auto-create user when SIWE authenticated
  useEffect(() => {
    if (isSiweAuthenticated && !user && !isUserLoading) {
      refetch()
    }
  }, [isSiweAuthenticated, user, isUserLoading, refetch])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] })
  }

  return {
    user,
    userId: user?.id ?? null,
    walletAddress: user?.walletAddress ?? address ?? null,
    isLoading: isSiweLoading || isUserLoading,
    error,
    isAuthenticated: isSiweAuthenticated && !!user,
    refresh,
  }
}
