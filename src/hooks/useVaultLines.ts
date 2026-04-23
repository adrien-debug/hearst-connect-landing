'use client'

import { useMemo } from 'react'
import type { VaultLine, ActiveVault, AvailableVault, Aggregate } from '@/components/connect/data'
import { useVaultRegistry } from './useVaultRegistry'
import { DEMO_VAULT } from '@/config/demo-vault'

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
  const { activeVaults, isLoading: isRegistryLoading, hasVaults } = useVaultRegistry()

  const vaultLines = useMemo<VaultLine[]>(() => {
    const configuredLines: AvailableVault[] = activeVaults.map((config) => ({
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
    }))

    // Always include demo vault if no real vaults exist
    if (configuredLines.length === 0) {
      return [DEMO_VAULT]
    }

    return configuredLines
  }, [activeVaults])

  const agg = useMemo(() => calculateAggregate(vaultLines), [vaultLines])

  return {
    vaults: vaultLines,
    agg,
    // Always true — demo vault guarantees at least 1
    hasVaults: true,
    isLoading: isRegistryLoading,
  }
}
