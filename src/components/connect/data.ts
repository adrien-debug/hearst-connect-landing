interface BaseVault {
  id: string
  name: string
  apr: number
  target: string
  strategy: string
  image?: string
}

export interface ActiveVault extends BaseVault {
  type: 'active'
  deposited: number
  claimable: number
  lockedUntil: number
  canWithdraw: boolean
  maturity: string
  progress: number
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
  risk: string
  fees: string
}

export type VaultLine = ActiveVault | MaturedVault | AvailableVault

export interface Activity {
  id: string
  type: 'deposit' | 'claim' | 'system'
  title: string
  vaultName?: string
  amount?: number
  timestamp: number
  status: 'completed' | 'pending'
}

import {
  type Aggregate as VaultAggregate,
  aggregateVaults,
  computeMonthlyYield as computeMonthlyYieldCore,
} from '@/lib/vault-math'

export type Aggregate = VaultAggregate

const NOW = Math.floor(Date.now() / 1000)

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'claim',
    title: 'Yield Claimed',
    vaultName: 'HashVault Yield #1',
    amount: 8500,
    timestamp: NOW - 86400 * 2, // 2 days ago
    status: 'completed'
  },
  {
    id: 'act-2',
    type: 'deposit',
    title: 'Capital Deployed',
    vaultName: 'HashVault Prime #1',
    amount: 500000,
    timestamp: NOW - 86400 * 15, // 15 days ago
    status: 'completed'
  },
  {
    id: 'act-3',
    type: 'system',
    title: 'Portfolio Rebalanced',
    timestamp: NOW - 86400 * 30, // 30 days ago
    status: 'completed'
  }
]

export const VAULTS: VaultLine[] = [
  {
    id: 'prime-1',
    name: 'HashVault Prime #1',
    type: 'active',
    apr: 12.0,
    deposited: 542100, // Mis à jour pour correspondre au visuel (500k + 42.1k)
    claimable: 42100,
    lockedUntil: NOW + 86400 * 540,
    canWithdraw: false,
    maturity: '15 Oct 2027',
    target: '36%',
    progress: 61,
    strategy: 'RWA Mining · USDC Yield · BTC Hedged',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    id: 'growth-1',
    name: 'HashVault Growth #1',
    type: 'active',
    apr: 15.0,
    deposited: 260240,
    claimable: 10240,
    lockedUntil: NOW + 86400 * 700,
    canWithdraw: false,
    maturity: '04 Apr 2028',
    target: '45%',
    progress: 24,
    strategy: 'BTC Spot · Collateral Mining',
    image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    id: 'yield-1',
    name: 'HashVault Yield #1',
    type: 'active',
    apr: 18.5,
    deposited: 125000,
    claimable: 8500,
    lockedUntil: NOW + 86400 * 365,
    canWithdraw: false,
    maturity: '15 Jan 2027',
    target: '28%',
    progress: 42,
    strategy: 'DeFi Yield · Stablecoin',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    id: 'prime-new',
    name: 'HashVault Prime',
    type: 'available',
    apr: 12.0,
    minDeposit: 500000,
    lockPeriod: '3 Years',
    target: '36%',
    risk: 'Moderate',
    fees: '1.5% Mgmt · 15% Perf',
    strategy: 'RWA Mining · USDC Yield · BTC Hedged',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    id: 'growth-new',
    name: 'HashVault Growth',
    type: 'available',
    apr: 15.0,
    minDeposit: 250000,
    lockPeriod: '3 Years',
    target: '45%',
    risk: 'Growth',
    fees: '2.0% Mgmt · 15% Perf',
    strategy: 'BTC Spot · Collateral Mining',
    image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=200&h=200',
  },
]

export function aggregate(vaults: VaultLine[]): Aggregate {
  const active = vaults.filter((v): v is ActiveVault => v.type === 'active')
  return aggregateVaults(active)
}

export function computeMonthlyYield(
  deposited: number,
  apr: number,
  dayOfMonth: number,
  daysInMonth: number,
) {
  return computeMonthlyYieldCore(deposited, apr, dayOfMonth, daysInMonth)
}
