/**
 * Backend User Hook
 * Manages the backend user entity tied to the connected wallet
 * Creates/finds user in backend when wallet connects
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { UsersApi, setApiWalletAddress } from '@/lib/api-client'
import type { DbUser } from '@/lib/db/schema'

const USER_QUERY_KEY = 'backend-user'

export function useBackendUser() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  // Sync wallet address with API client for authenticated requests
  useEffect(() => {
    if (isConnected && address) {
      setApiWalletAddress(address)
    } else {
      setApiWalletAddress(null)
    }
  }, [isConnected, address])

  // Query to get user by wallet
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<DbUser | null>({
    queryKey: [USER_QUERY_KEY, address],
    queryFn: async () => {
      if (!address) return null
      try {
        // This will now use the x-wallet-address header
        const result = await UsersApi.findOrCreate(address)
        return result.user
      } catch (e) {
        console.error('[useBackendUser] Failed to find/create user:', e)
        return null
      }
    },
    enabled: isConnected && !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  // Auto-create user when wallet connects
  useEffect(() => {
    if (isConnected && address && !user && !isLoading) {
      refetch()
    }
  }, [isConnected, address, user, isLoading, refetch])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, address] })
  }

  return {
    user,
    userId: user?.id ?? null,
    walletAddress: user?.walletAddress ?? address ?? null,
    isLoading,
    error,
    isAuthenticated: !!user,
    refresh,
  }
}
