import {
  type Aggregate as VaultAggregate,
  computeMonthlyYield as computeMonthlyYieldCore,
} from '@/lib/vault-math'

interface BaseVault {
  id: string
  name: string
  apr: number
  target: string
  strategy: string
  image?: string
  isTest?: boolean
}

export interface ActiveVault extends BaseVault {
  type: 'active'
  deposited: number
  claimable: number
  createdAt: number
  lockedUntil: number
  canWithdraw: boolean
  maturity: string
  progress: number
  risk: string
}

export interface MaturedVault extends BaseVault {
  type: 'matured'
  deposited: number
  claimable: number
  maturity: string
  progress: number
}

export interface AvailableVault extends BaseVault {
  type: 'available'
  minDeposit: number
  lockPeriod: string
  term: string
  token: string
  risk: string
  fees: string
}

export type VaultLine = ActiveVault | MaturedVault | AvailableVault

export type Aggregate = VaultAggregate

export function computeMonthlyYield(
  deposited: number,
  apr: number,
  dayOfMonth: number,
  daysInMonth: number,
) {
  return computeMonthlyYieldCore(deposited, apr, dayOfMonth, daysInMonth)
}
