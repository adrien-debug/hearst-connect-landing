'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import type { VaultLine, ActiveVault, AvailableVault, Aggregate } from '@/components/connect/data'
import { useVaultRegistry } from './useVaultRegistry'

// Aggregate calculation for vault lines
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
  const { address: userAddress } = useAccount()
  const { activeVaults, isLoading: isRegistryLoading, hasVaults } = useVaultRegistry()

  // Convert configs to vault lines
  // For now, show all vaults as available since position data
  // requires individual contract calls per vault
  const vaultLines = useMemo<VaultLine[]>(() => {
    return activeVaults.map((config) => {
      const availableVault: AvailableVault = {
        id: config.id,
        name: config.name,
        type: 'available',
        apr: config.apr,
        target: config.target,
        strategy: config.strategy,
        image: config.image,
        minDeposit: config.minDeposit,
        lockPeriod: `${Math.floor(config.lockPeriodDays / 365)} Years`,
        risk: config.risk,
        fees: config.fees,
      }
      return availableVault
    })
  }, [activeVaults])

  const agg = useMemo(() => calculateAggregate(vaultLines), [vaultLines])

  return {
    vaults: vaultLines,
    agg,
    hasVaults,
    isLoading: isRegistryLoading,
    userAddress,
  }
}
