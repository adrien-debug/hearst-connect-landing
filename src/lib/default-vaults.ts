/**
 * Default marketing vaults shown on public pages when no live vaults are configured.
 * These are for demonstration purposes only - users cannot actually invest in them
 * until an admin creates real vaults in the registry.
 */

import type { VaultConfig } from '@/types/vault'
import type { AvailableVault } from '@/components/connect/data'
import { base } from 'wagmi/chains'
import { DAYS_PER_YEAR } from './constants'

export const DEFAULT_MARKETING_VAULTS: Omit<VaultConfig, 'id' | 'createdAt'>[] = [
  {
    name: 'Hearst Prime Yield',
    description: 'Flagship vault targeting ~12% APR through diversified industrial mining operations with volatility hedging.',
    vaultAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    chain: base,
    apr: 12.4,
    target: '36%',
    lockPeriodDays: 1095, // 3 years
    minDeposit: 250000,
    strategy: 'Diversified Mining · Stable Income',
    fees: '1.5% Mgmt · 15% Perf',
    risk: 'Low',
    image: '/logos/hearst.svg',
    isActive: true,
  },
  {
    name: 'Hearst Growth BTC',
    description: 'Forward BTC mining exposure with spot price upside and USDC buffer. Target 16-22% APR.',
    vaultAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    chain: base,
    apr: 18.2,
    target: '54%',
    lockPeriodDays: 1095,
    minDeposit: 250000,
    strategy: 'BTC Upside · Growth Focus',
    fees: '2.0% Mgmt · 20% Perf',
    risk: 'Medium',
    image: '/logos/hearst.svg',
    isActive: true,
  },
  {
    name: 'Hearst Ultra Yield',
    description: 'Aggressive mining allocation targeting maximum yield with managed risk exposure.',
    vaultAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    chain: base,
    apr: 24.8,
    target: '74%',
    lockPeriodDays: 730, // 2 years
    minDeposit: 500000,
    strategy: 'Aggressive Mining · High Yield',
    fees: '2.5% Mgmt · 25% Perf',
    risk: 'High',
    image: '/logos/hearst.svg',
    isActive: true,
  },
]

/**
 * Convert VaultConfig to AvailableVault display format
 */
export function toAvailableVault(config: VaultConfig): AvailableVault {
  const years = config.lockPeriodDays / DAYS_PER_YEAR
  const lockLabel = years >= 1 ? `${Math.floor(years)} Years` : `${config.lockPeriodDays} Days`
  const termLabel = years >= 1 ? `${Math.floor(years)}Y` : `${config.lockPeriodDays}D`

  return {
    id: config.id,
    name: config.name,
    type: 'available',
    apr: config.apr,
    target: config.target,
    strategy: config.strategy,
    image: config.image,
    minDeposit: config.minDeposit,
    lockPeriod: lockLabel,
    term: termLabel,
    token: 'USDC',
    risk: config.risk,
    fees: config.fees,
  }
}
