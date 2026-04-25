import type { VaultConfig } from '@/types/vault'
import type { AvailableVault } from '@/components/connect/data'
import { DAYS_PER_YEAR } from './constants'

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
    isTest: config.isTest,
  }
}
