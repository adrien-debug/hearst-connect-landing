export interface VaultLine {
  id: string
  name: string
  type: 'active' | 'available'
  apr: number
  deposited?: number
  claimable?: number
  lockedUntil?: number
  canWithdraw?: boolean
  maturity?: string
  target?: string
  progress?: number
  minDeposit?: number
  lockPeriod?: string
  risk?: string
  fees?: string
  strategy?: string
}

export interface Aggregate {
  totalDeposited: number
  totalClaimable: number
  avgApr: number
  anyLocked: boolean
}

const NOW = Math.floor(Date.now() / 1000)

export const VAULTS: VaultLine[] = [
  {
    id: 'prime-1',
    name: 'HashVault Prime #1',
    type: 'active',
    apr: 12.0,
    deposited: 500000,
    claimable: 42100,
    lockedUntil: NOW + 86400 * 540,
    canWithdraw: false,
    maturity: '15 Oct 2027',
    target: '36%',
    progress: 61,
    strategy: 'RWA Mining · USDC Yield · BTC Hedged',
  },
  {
    id: 'growth-1',
    name: 'HashVault Growth #1',
    type: 'active',
    apr: 15.0,
    deposited: 250000,
    claimable: 10240,
    lockedUntil: NOW + 86400 * 700,
    canWithdraw: false,
    maturity: '04 Apr 2028',
    target: '45%',
    progress: 24,
    strategy: 'BTC Spot · Collateral Mining',
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
  },
]

export function aggregate(vaults: VaultLine[]): Aggregate {
  const active = vaults.filter(v => v.type === 'active')
  const totalDeposited = active.reduce((s, v) => s + (v.deposited || 0), 0)
  return {
    totalDeposited,
    totalClaimable: active.reduce((s, v) => s + (v.claimable || 0), 0),
    avgApr: totalDeposited > 0
      ? active.reduce((s, v) => s + v.apr * (v.deposited || 0), 0) / totalDeposited
      : 0,
    anyLocked: active.some(v => !v.canWithdraw),
  }
}

/**
 * Monthly yield model:
 * produced = (deposited × APR / 12) × (dayOfMonth / daysInMonth)
 * remaining = monthlyYield - produced
 */
export function computeMonthlyYield(deposited: number, apr: number, dayOfMonth: number, daysInMonth: number) {
  const monthlyYield = (deposited * apr) / 100 / 12
  const dailyYield = monthlyYield / daysInMonth
  const produced = dailyYield * dayOfMonth
  const remaining = Math.max(0, monthlyYield - produced)
  return { monthlyYield, produced, remaining }
}
