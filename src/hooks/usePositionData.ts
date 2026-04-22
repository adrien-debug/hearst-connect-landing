'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PositionData, PositionError } from '@/types/position'

interface UsePositionDataOptions {
  vaultId: string
  walletAddress?: string
  refreshInterval?: number
}

interface UsePositionDataReturn {
  data: PositionData | null
  isLoading: boolean
  error: PositionError | null
  refresh: () => void
}

// Generate deterministic mock data based on vaultId
function generateMockData(vaultId: string): PositionData {
  // Use vaultId to create different data for each vault
  const seed = vaultId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  const vaultConfigs: Record<string, Partial<PositionData>> = {
    'prime-1': {
      capitalDeployed: 542100,
      accruedYield: 42100,
      apr: 12.0,
      target: '36%',
      unlockTimeline: {
        daysRemaining: 539,
        maturityDate: '15 Oct 2027',
        progressPercent: 61,
      },
    },
    'growth-1': {
      capitalDeployed: 260240,
      accruedYield: 10240,
      apr: 15.0,
      target: '45%',
      unlockTimeline: {
        daysRemaining: 700,
        maturityDate: '04 Apr 2028',
        progressPercent: 24,
      },
    },
    'yield-1': {
      capitalDeployed: 125000,
      accruedYield: 8500,
      apr: 18.5,
      target: '28%',
      unlockTimeline: {
        daysRemaining: 365,
        maturityDate: '15 Jan 2027',
        progressPercent: 42,
      },
    },
  }

  const config = vaultConfigs[vaultId] || vaultConfigs['prime-1']
  
  const capitalDeployed = config.capitalDeployed ?? 500000
  const accruedYield = config.accruedYield ?? 30000
  
  return {
    capitalDeployed,
    accruedYield,
    positionValue: capitalDeployed + accruedYield,
    unlockTimeline: config.unlockTimeline || {
      daysRemaining: 365,
      maturityDate: '15 Jan 2027',
      progressPercent: 50,
    },
    epoch: {
      currentEpoch: 147 + (seed % 10),
      epochProgress: 20 + (seed % 60),
      epochEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    },
    canWithdraw: false,
    isTargetReached: (config.unlockTimeline?.progressPercent ?? 50) >= 100,
    apr: config.apr ?? 12.0,
    target: config.target ?? '36%',
  }
}

export function usePositionData({
  vaultId,
  walletAddress,
  refreshInterval = 30000,
}: UsePositionDataOptions): UsePositionDataReturn {
  const [data, setData] = useState<PositionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PositionError | null>(null)

  const fetchPosition = useCallback(async () => {
    if (!walletAddress) {
      setError({ code: 'WALLET_NOT_CONNECTED', message: 'Wallet not connected' })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/vaults/${vaultId}/position?wallet=${walletAddress}`)
      // if (!response.ok) throw new Error('Failed to fetch')
      // const result = await response.json()

      // Mock for now — simulates network delay with vault-specific data
      await new Promise((r) => setTimeout(r, 400))
      setData(generateMockData(vaultId))
    } catch {
      setError({ code: 'FETCH_ERROR', message: 'Failed to load position data' })
    } finally {
      setIsLoading(false)
    }
  }, [vaultId, walletAddress])

  useEffect(() => {
    fetchPosition()
  }, [fetchPosition])

  useEffect(() => {
    if (!refreshInterval || !walletAddress) return

    const interval = setInterval(fetchPosition, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchPosition, refreshInterval, walletAddress])

  return {
    data,
    isLoading,
    error,
    refresh: fetchPosition,
  }
}
