'use client'

import { useMemo } from 'react'
import type { VaultLine, ActiveVault, Aggregate } from '@/components/connect/data'
import { useVaultRegistry } from './useVaultRegistry'
import { useUserData } from './useUserData'
import { useAccount } from 'wagmi'
import { toAvailableVault } from '@/lib/default-vaults'

function calculateAggregate(vaults: VaultLine[]): Aggregate {
  const active = vaults.filter((v): v is ActiveVault => v.type === 'active')

  const totalDeposited = active.reduce((sum, v) => sum + v.deposited, 0)
  const totalClaimable = active.reduce((sum, v) => sum + v.claimable, 0)

  const avgApr =
    totalDeposited > 0
      ? active.reduce((sum, v) => sum + v.apr * v.deposited, 0) / totalDeposited
      : 0

  return {
    totalDeposited,
    totalClaimable,
    avgApr,
  }
}

export function useVaultLines() {
  const { activeVaults, isLoading: isRegistryLoading } = useVaultRegistry()
  const { positions: userPositions, stats: userStats, isLoading: isUserDataLoading } = useUserData()
  const { isConnected } = useAccount()

  return useMemo(() => {
    if (isConnected) {
      // Combine registry vaults with user positions
      const vaultLines: VaultLine[] = activeVaults.map((vaultConfig) => {
        const userPosition = userPositions.find((p) => p.vaultId === vaultConfig.id && p.state !== 'withdrawn')

        if (userPosition) {
          // User has an active position in this vault
          const activeVault: ActiveVault = {
            type: 'active',
            id: vaultConfig.id,
            name: vaultConfig.name,
            apr: vaultConfig.apr,
            target: vaultConfig.target,
            strategy: vaultConfig.strategy,
            image: vaultConfig.image,
            deposited: userPosition.deposited,
            claimable: userPosition.claimable,
            lockedUntil: userPosition.maturityDate,
            canWithdraw: userPosition.canWithdraw,
            maturity: userPosition.isMatured ? 'Matured' : `${userPosition.daysRemaining} days`,
            progress: userPosition.progressPercent,
          }
          return activeVault
        }

        // No position - show as available
        return toAvailableVault(vaultConfig)
      })

      return {
        vaults: vaultLines,
        agg: {
          totalDeposited: userStats.totalDeposited,
          totalClaimable: userStats.totalClaimable,
          avgApr: userStats.totalDeposited > 0
            ? userPositions.reduce((sum, p) => sum + p.apr * p.deposited, 0) / userStats.totalDeposited
            : 0,
        },
        hasVaults: vaultLines.length > 0,
        isLoading: isRegistryLoading || isUserDataLoading,
        mode: 'live' as const,
      }
    }

    // MODE LIVE (wallet not connected): Show available vaults from registry only
    const configuredLines = activeVaults.map(toAvailableVault)

    return {
      vaults: configuredLines,
      agg: calculateAggregate(configuredLines),
      hasVaults: configuredLines.length > 0,
      isLoading: isRegistryLoading,
      mode: 'live' as const,
    }
  }, [
    activeVaults,
    userPositions,
    userStats,
    isRegistryLoading,
    isUserDataLoading,
    isConnected,
  ])
}
