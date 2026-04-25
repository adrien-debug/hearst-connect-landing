'use client'

import { useMemo } from 'react'
import type { VaultLine, ActiveVault, Aggregate } from '@/components/connect/data'
import { useVaultRegistry } from './useVaultRegistry'
import { useDemoPortfolio, useSystemVaults } from './useDemoPortfolio'
import { useUserData } from './useUserData'
import { useAppMode } from './useAppMode'
import { useAccount } from 'wagmi'
import { toAvailableVault } from '@/lib/default-vaults'
import { DAYS_PER_YEAR } from '@/lib/constants'

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
  const { hydratedPositions: demoPositions, stats: demoStats } = useDemoPortfolio()
  const { positions: userPositions, stats: userStats, isLoading: isUserDataLoading } = useUserData()
  const systemVaults = useSystemVaults()
  const { isDemo } = useAppMode()
  const { isConnected } = useAccount()

  return useMemo(() => {
    // MODE DÉMO: Forcé par le toggle
    if (isDemo) {
      const demoVaultLines: VaultLine[] = systemVaults.map((sysVault) => {
        const position = demoPositions.find((p) => p.vaultId === sysVault.id)

        if (position && position.state !== 'withdrawn') {
          const activeVault: ActiveVault = {
            type: 'active',
            id: sysVault.id,
            name: sysVault.meta.name,
            apr: sysVault.meta.apr,
            target: sysVault.meta.target,
            strategy: sysVault.meta.strategy,
            image: undefined,
            deposited: position.deposited,
            claimable: position.currentYield,
            lockedUntil: position.maturityDate,
            canWithdraw: position.canWithdraw,
            maturity: position.isMatured ? 'Matured' : `${position.daysRemaining} days`,
            progress: position.progressPercent,
          }
          return activeVault
        }

        const years = sysVault.meta.lockPeriodDays / DAYS_PER_YEAR
        const lockLabel = years >= 1 ? `${Math.floor(years)} Years` : `${sysVault.meta.lockPeriodDays} Days`
        const termLabel = years >= 1 ? `${Math.floor(years)}Y` : `${sysVault.meta.lockPeriodDays}D`

        return {
          type: 'available',
          id: sysVault.id,
          name: sysVault.meta.name,
          apr: sysVault.meta.apr,
          target: sysVault.meta.target,
          strategy: sysVault.meta.strategy,
          image: undefined,
          minDeposit: sysVault.meta.minDeposit,
          lockPeriod: lockLabel,
          term: termLabel,
          token: 'USDC',
          risk: sysVault.meta.risk,
          fees: sysVault.meta.fees,
        }
      })

      const activeForAgg = demoVaultLines
        .filter((v): v is ActiveVault => v.type === 'active')
        .map((v) => ({ deposited: v.deposited, claimable: v.claimable, apr: v.apr }))

      const avgApr = demoStats.totalDeployed > 0
        ? activeForAgg.reduce((sum, v) => sum + v.apr * v.deposited, 0) / demoStats.totalDeployed
        : 0

      return {
        vaults: demoVaultLines,
        agg: { totalDeposited: demoStats.totalDeployed, totalClaimable: demoStats.totalUnclaimedYield, avgApr },
        hasVaults: true,
        isLoading: false,
        mode: 'demo' as const,
      }
    }

    // MODE LIVE: User connected with real backend data
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
    isDemo,
    demoPositions,
    demoStats,
    systemVaults,
    activeVaults,
    userPositions,
    userStats,
    isRegistryLoading,
    isUserDataLoading,
    isConnected,
  ])
}
