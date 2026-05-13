/**
 * Centralized mock data for demo mode.
 * Hearst Connect ships 2 products: Hearst Prime (Moderate) and Hearst Growth (Growth).
 * Each user can hold multiple cohort positions per product (Prime #1, Prime #2, Growth #1).
 * Cohort positions inherit product mechanics; only inception/maturity/amount differ.
 */

import type { VaultConfig, MarketRegime, RebalanceWeights } from '@/types/vault'
import type {
  UserPositionLine,
  UserActivityItem,
  UserDataStats,
} from '@/hooks/useUserData'
import { base } from 'viem/chains'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = () => Date.now()

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const

/** Generate a deterministic 12-month yield series clustered around a target APR.
 * Uses a sine-modulated seed so different APRs produce visibly distinct curves. */
function syntheticReturns(targetApr: number, seed: number, months = 12): Array<{ month: string; yieldPct: number }> {
  const out: Array<{ month: string; yieldPct: number }> = []
  const now = new Date(NOW())
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const noise = Math.sin((seed + i) * 0.93) * (targetApr * 0.18)
    const trend = Math.cos((seed * 0.5 + i) * 0.41) * (targetApr * 0.06)
    out.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      yieldPct: +(targetApr + noise + trend).toFixed(2),
    })
  }
  return out
}

// ───────────────────────────────────────────── Market regime (global)

/** Active market regime — drives "currently active" scenario across all products. */
export const DEMO_MARKET_REGIME: MarketRegime = 'sideways'

// ───────────────────────────────────────────── Per-product rebalance weights

const PRIME_REBALANCE: RebalanceWeights = {
  bull: [
    { label: 'RWA Mining',  pct: 55, pitch: 'Mining weight ↑, hedging lighter. Yield compounds faster.' },
    { label: 'USDC Yield',  pct: 25, pitch: '' },
    { label: 'BTC Hedged',  pct: 20, pitch: '' },
  ],
  sideways: [
    { label: 'RWA Mining',  pct: 40, pitch: 'Stable mining production + diversified USDC yield keep generating returns at the default weights.' },
    { label: 'USDC Yield',  pct: 30, pitch: '' },
    { label: 'BTC Hedged',  pct: 30, pitch: '' },
  ],
  bear: [
    { label: 'RWA Mining',  pct: 30, pitch: 'Distribution shifts toward USDC Yield and BTC Hedged. Volatility thresholds tighten, defensive allocation grows.' },
    { label: 'USDC Yield',  pct: 45, pitch: '' },
    { label: 'BTC Hedged',  pct: 25, pitch: '' },
  ],
}

const GROWTH_REBALANCE: RebalanceWeights = {
  bull: [
    { label: 'BTC Spot',          pct: 80, pitch: 'Rising BTC price + mining cashflow accelerate portfolio value. Full BTC exposure maintained.' },
    { label: 'Collateral Mining', pct: 20, pitch: '' },
  ],
  sideways: [
    { label: 'BTC Spot',          pct: 70, pitch: 'Stable mining production keeps generating yield while BTC price trades flat. Default weights.' },
    { label: 'Collateral Mining', pct: 30, pitch: '' },
  ],
  bear: [
    { label: 'BTC Spot',          pct: 55, pitch: 'Mining weight increases to cushion BTC drawdowns. Reward distribution tilts to preservation.' },
    { label: 'Collateral Mining', pct: 45, pitch: '' },
  ],
}

// ───────────────────────────────────────────── Vaults registry (2 products)

export const DEMO_VAULTS: VaultConfig[] = [
  {
    id: 'demo-prime',
    name: 'Hearst Prime',
    description: 'A three-pocket income engine built for consistency. RWA Mining captures real-economy cashflow, USDC Yield anchors a stable income floor, and BTC Hedged adds delta-neutral upside. The tri-pillar mix smooths volatility across market cycles and distributes yield daily. The vault closes and principal unlocks once the 36% cumulative target is reached — or at 3-year maturity.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 12,
    target: '36%',
    cumulativeTarget: 36,
    lockPeriodDays: 36 * 30,
    minDeposit: 500_000,
    strategy: 'Multi-Strategy: RWA Mining · USDC Yield · BTC Hedged',
    fees: '1.5% mgmt · 15% perf',
    risk: 'Moderate',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 540 * DAY_MS,
    inception: NOW() - 540 * DAY_MS,
    tvl: 28_400_000,
    investorCount: 84,
    historicalReturns: syntheticReturns(12, 1),
    composition: PRIME_REBALANCE.sideways,
    rebalanceWeights: PRIME_REBALANCE,
    underlyingExposure: [
      { label: 'BTC-correlated',         pct: 30 },
      { label: 'Mining infrastructure',  pct: 40 },
      { label: 'Stablecoin yield',       pct: 30 },
    ],
    productFamily: 'prime',
    capitalRecoveryYears: 2,
    productPitch: 'A three-pocket income engine built for consistency.',
    maxDrawdown: 4.2,
    volatility: 6.8,
    sharpe: 1.42,
    cumulativeYield: 3_120_000,
    custodian: 'Anchorage Digital · cold storage',
    auditReports: [
      { label: 'Quantstamp · Aug 2025', url: '#' },
      { label: 'OpenZeppelin · Mar 2026', url: '#' },
    ],
  },
  {
    id: 'demo-growth',
    name: 'Hearst Growth',
    description: 'Bitcoin upside with a mining-backed cushion. BTC Spot drives direct cycle-level appreciation while Collateral Mining generates steady cashflow that supports returns during drawdowns. Allocation re-weights dynamically with the market regime, yield is distributed daily. The vault closes and principal unlocks once the 45% cumulative target is reached — or at 3-year maturity.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 15,
    target: '45%',
    cumulativeTarget: 45,
    lockPeriodDays: 36 * 30,
    minDeposit: 250_000,
    strategy: 'Multi-Strategy: BTC Spot · Collateral Mining',
    fees: '2% mgmt · 15% perf',
    risk: 'Growth',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 540 * DAY_MS,
    inception: NOW() - 540 * DAY_MS,
    tvl: 12_650_000,
    investorCount: 38,
    historicalReturns: syntheticReturns(15, 7),
    composition: GROWTH_REBALANCE.sideways,
    rebalanceWeights: GROWTH_REBALANCE,
    underlyingExposure: [
      { label: 'BTC-correlated',         pct: 70 },
      { label: 'Mining infrastructure',  pct: 30 },
      { label: 'Stablecoin yield',       pct: 0 },
    ],
    productFamily: 'growth',
    capitalRecoveryYears: 2,
    productPitch: 'Bitcoin upside with a mining-backed cushion.',
    maxDrawdown: 11.4,
    volatility: 14.2,
    sharpe: 0.89,
    cumulativeYield: 1_580_000,
    custodian: 'Anchorage Digital · cold storage',
    auditReports: [
      { label: 'Trail of Bits · Sep 2025', url: '#' },
    ],
  },
]

// ───────────────────────────────────────────── User positions (3 cohorts)

const _positions: Array<Omit<UserPositionLine, 'daysRemaining' | 'progressPercent' | 'isMatured' | 'canWithdraw' | 'state'> & { state: UserPositionLine['state'] }> = [
  {
    id: 'demo-pos-prime-1',
    vaultId: 'demo-prime',
    vaultName: 'Hearst Prime #1',
    deposited: 500_000,
    claimable: 0,
    currentYield: 28_120,
    createdAt: NOW() - 18 * 30 * DAY_MS,
    maturityDate: NOW() + 18 * 30 * DAY_MS,
    state: 'active',
    apr: 12,
    target: '36%',
    strategy: 'Multi-Strategy: RWA Mining · USDC Yield · BTC Hedged',
    risk: 'Moderate',
    fees: '1.5% mgmt · 15% perf',
  },
  {
    id: 'demo-pos-prime-2',
    vaultId: 'demo-prime',
    vaultName: 'Hearst Prime #2',
    deposited: 200_000,
    claimable: 0,
    currentYield: 5_400,
    createdAt: NOW() - 8 * 30 * DAY_MS,
    maturityDate: NOW() + 28 * 30 * DAY_MS,
    state: 'active',
    apr: 12,
    target: '36%',
    strategy: 'Multi-Strategy: RWA Mining · USDC Yield · BTC Hedged',
    risk: 'Moderate',
    fees: '1.5% mgmt · 15% perf',
  },
  {
    id: 'demo-pos-growth-1',
    vaultId: 'demo-growth',
    vaultName: 'Hearst Growth #1',
    deposited: 250_000,
    claimable: 0,
    currentYield: 14_060,
    createdAt: NOW() - 12 * 30 * DAY_MS,
    maturityDate: NOW() + 24 * 30 * DAY_MS,
    state: 'active',
    apr: 15,
    target: '45%',
    strategy: 'Multi-Strategy: BTC Spot · Collateral Mining',
    risk: 'Growth',
    fees: '2% mgmt · 15% perf',
  },
]

function hydrateDemoPosition(p: typeof _positions[number]): UserPositionLine {
  const now = NOW()
  const daysRemaining = Math.max(0, Math.ceil((p.maturityDate - now) / DAY_MS))
  const totalDays = Math.max(1, Math.ceil((p.maturityDate - p.createdAt) / DAY_MS))
  const progressPercent = Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100))
  const isMatured = now >= p.maturityDate
  return {
    ...p,
    daysRemaining,
    progressPercent,
    isMatured,
    canWithdraw: isMatured && p.state !== 'withdrawn',
    state: isMatured ? 'matured' : p.state,
  }
}

export const DEMO_POSITIONS: UserPositionLine[] = _positions.map(hydrateDemoPosition)

// ───────────────────────────────────────────── User activity
// Daily yield distribution events for the last 6 days, plus a monthly perf fee
// and the original deposits. Mirrors the "Transactions" card of the mockups.

const DAILY_PRIME = 164.38
const DAILY_GROWTH = 102.74

function shortHash(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hex = (h >>> 0).toString(16).padStart(8, '0')
  return `0x${hex.slice(0, 4)}…${hex.slice(-2)}`
}

function dailyPrimeEvents(): UserActivityItem[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `prime-daily-${i}`,
    type: 'claim' as const,
    vaultId: 'demo-prime',
    vaultName: 'Hearst Prime #1',
    amount: DAILY_PRIME,
    txHash: shortHash(`prime-${i}`),
    timestamp: NOW() - (i + 1) * DAY_MS,
  }))
}

function dailyGrowthEvents(): UserActivityItem[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `growth-daily-${i}`,
    type: 'claim' as const,
    vaultId: 'demo-growth',
    vaultName: 'Hearst Growth #1',
    amount: DAILY_GROWTH,
    txHash: shortHash(`growth-${i}`),
    timestamp: NOW() - (i + 1) * DAY_MS,
  }))
}

export const DEMO_ACTIVITY: UserActivityItem[] = ([
  ...dailyPrimeEvents(),
  ...dailyGrowthEvents(),
  // Monthly performance fees (15% of monthly yield).
  { id: 'fee-prime-1',  type: 'fee'     as const, vaultId: 'demo-prime',  vaultName: 'Hearst Prime #1',  amount: DAILY_PRIME * 30 * 0.15,  txHash: shortHash('fee-prime'),  timestamp: NOW() - 30 * DAY_MS },
  { id: 'fee-growth-1', type: 'fee'     as const, vaultId: 'demo-growth', vaultName: 'Hearst Growth #1', amount: DAILY_GROWTH * 30 * 0.15, txHash: shortHash('fee-growth'), timestamp: NOW() - 30 * DAY_MS },
  // Initial deposits.
  { id: 'dep-prime-1',  type: 'deposit' as const, vaultId: 'demo-prime',  vaultName: 'Hearst Prime #1',  amount: 500_000, txHash: shortHash('dep-prime-1'),  timestamp: NOW() - 18 * 30 * DAY_MS },
  { id: 'dep-prime-2',  type: 'deposit' as const, vaultId: 'demo-prime',  vaultName: 'Hearst Prime #2',  amount: 200_000, txHash: shortHash('dep-prime-2'),  timestamp: NOW() -  8 * 30 * DAY_MS },
  { id: 'dep-growth-1', type: 'deposit' as const, vaultId: 'demo-growth', vaultName: 'Hearst Growth #1', amount: 250_000, txHash: shortHash('dep-growth-1'), timestamp: NOW() - 12 * 30 * DAY_MS },
] as UserActivityItem[]).sort((a, b) => b.timestamp - a.timestamp)

// ───────────────────────────────────────────── Stats (lifetime)

export const DEMO_STATS: UserDataStats = {
  totalDeposited: DEMO_POSITIONS.reduce((s, p) => s + p.deposited, 0),
  totalClaimable: DEMO_POSITIONS.reduce((s, p) => s + p.claimable, 0),
  totalYieldClaimed: DEMO_POSITIONS.reduce((s, p) => s + p.currentYield, 0),
  activePositionsCount: DEMO_POSITIONS.filter((p) => p.state !== 'withdrawn').length,
}

// ───────────────────────────────────────────── Wallet identity for demo

export const DEMO_WALLET_ADDRESS = '0xD3M0a1bC4eE56789f0a1B2c3D4e5f67890aBcDeF' as const

// ───────────────────────────────────────────── Market snapshots

export const DEMO_MARKET_LATEST = {
  snapshot: {
    id: 'mkt-demo-latest',
    timestamp: NOW(),
    btcPrice: 96_482,
    btc24hChange: 1.84,
    btc7dChange: -2.41,
    usdcApy: 5.6,
    usdtApy: 5.4,
    btcApy: 3.2,
    miningHashprice: 58.7,
    fearGreed: 64,
    fearLabel: 'Greed',
    notes: null,
  },
}

export const DEMO_MARKET_HISTORY = (() => {
  const HOURS = 168
  const snapshots = []
  const now = NOW()
  let price = 92_000
  for (let i = HOURS - 1; i >= 0; i--) {
    price = price * (1 + (Math.sin(i / 12) * 0.0075 + (Math.cos(i / 23) * 0.004)))
    snapshots.push({
      id: `mkt-demo-${i}`,
      timestamp: now - i * 60 * 60 * 1000,
      btcPrice: Math.round(price),
      btc24hChange: +(Math.sin(i / 18) * 2.5).toFixed(2),
      btc7dChange: +(Math.cos(i / 28) * 4).toFixed(2),
      usdcApy: 5.6 + Math.sin(i / 30) * 0.3,
      usdtApy: 5.4 + Math.sin(i / 28) * 0.3,
      btcApy: 3.2 + Math.cos(i / 36) * 0.4,
      miningHashprice: 58 + Math.sin(i / 22) * 4,
      fearGreed: Math.round(60 + Math.sin(i / 14) * 12),
      fearLabel: 'Greed',
      notes: null,
    })
  }
  return { snapshots }
})()

// ───────────────────────────────────────────── Agents status

export const DEMO_AGENTS_STATUS = {
  agents: [
    { name: 'watcher',  status: 'online', lastSeen: NOW() - 4 * 60 * 1000,  lastMessage: 'Snapshot collected — BTC $96,482 (+1.84% 24h)' },
    { name: 'strategy', status: 'online', lastSeen: NOW() - 12 * 60 * 1000, lastMessage: 'Sideways regime confirmed — no rebalance signal' },
    { name: 'audit',    status: 'online', lastSeen: NOW() - 38 * 60 * 1000, lastMessage: 'Risk envelope nominal — no breaches' },
  ],
}

// ───────────────────────────────────────────── Rebalance signals

export const DEMO_SIGNALS = {
  signals: [
    {
      id: 'sig-1',
      timestamp: NOW() - 25 * 60 * 1000,
      type: 'REBALANCE' as const,
      vaultId: 'demo-prime',
      description: 'Sideways regime confirmed — Prime weights at baseline (40/30/30).',
      paramsJson: JSON.stringify({ regime: 'sideways' }),
      status: 'executed' as const,
      riskScore: 12,
      riskNotes: 'Baseline weights · no risk flags',
      createdBy: 'strategy' as const,
      approvedAt: NOW() - 30 * 60 * 1000,
      executedAt: NOW() - 28 * 60 * 1000,
      txHash: null,
      chainId: null,
      executor: null,
    },
    {
      id: 'sig-2',
      timestamp: NOW() - 2 * 60 * 60 * 1000,
      type: 'REBALANCE' as const,
      vaultId: 'demo-growth',
      description: 'Sideways regime confirmed — Growth weights at baseline (70/30).',
      paramsJson: JSON.stringify({ regime: 'sideways' }),
      status: 'executed' as const,
      riskScore: 14,
      riskNotes: 'Baseline weights · no risk flags',
      createdBy: 'strategy' as const,
      approvedAt: NOW() - 90 * 60 * 1000,
      executedAt: NOW() - 80 * 60 * 1000,
      txHash: null,
      chainId: null,
      executor: null,
    },
    {
      id: 'sig-3',
      timestamp: NOW() - 6 * 60 * 60 * 1000,
      type: 'YIELD_ROTATE' as const,
      vaultId: 'demo-prime',
      description: 'USDC ladder maturing inside Prime — rotate into 90d tranche at 7.9% APY.',
      paramsJson: null,
      status: 'executed' as const,
      riskScore: 10,
      riskNotes: 'Routine rotation',
      createdBy: 'strategy' as const,
      approvedAt: NOW() - 5 * 60 * 60 * 1000,
      executedAt: NOW() - 4 * 60 * 60 * 1000,
      txHash: null,
      chainId: null,
      executor: null,
    },
    {
      id: 'sig-4',
      timestamp: NOW() - 5 * 60 * 1000,
      type: 'INCREASE_BTC' as const,
      vaultId: null,
      description: 'Fear & Greed at 64 — incremental BTC accumulation opportunity flagged.',
      paramsJson: JSON.stringify({ size: '0.5%' }),
      status: 'pending' as const,
      riskScore: 25,
      riskNotes: 'Within DCA mandate',
      createdBy: 'watcher' as const,
      approvedAt: null,
      executedAt: null,
      txHash: null,
      chainId: null,
      executor: null,
    },
  ],
}

// ───────────────────────────────────────────── Admin activity log (system events)

export const DEMO_ADMIN_ACTIVITY = [
  { id: 'l1', userId: 'sys', vaultId: 'demo-prime',  vaultName: 'Hearst Prime #1',  type: 'claim'   as const, amount: DAILY_PRIME,  timestamp: NOW() -  2 * 60 * 60 * 1000 },
  { id: 'l2', userId: 'sys', vaultId: 'demo-growth', vaultName: 'Hearst Growth #1', type: 'claim'   as const, amount: DAILY_GROWTH, timestamp: NOW() -  4 * 60 * 60 * 1000 },
  { id: 'l3', userId: 'sys', vaultId: 'demo-prime',  vaultName: 'Hearst Prime #2',  type: 'deposit' as const, amount: 200_000,      timestamp: NOW() -  8 * 30 * DAY_MS },
  { id: 'l4', userId: 'sys', vaultId: 'demo-prime',  vaultName: 'Hearst Prime #1',  type: 'deposit' as const, amount: 500_000,      timestamp: NOW() - 18 * 30 * DAY_MS },
  { id: 'l5', userId: 'sys', vaultId: 'demo-growth', vaultName: 'Hearst Growth #1', type: 'deposit' as const, amount: 250_000,      timestamp: NOW() - 12 * 30 * DAY_MS },
]

// ───────────────────────────────────────────── Position data (on-chain shape)

export function getDemoPositionData(vaultId: string, positionId?: string) {
  // When a cohort positionId is provided, target that exact cohort.
  // Otherwise default to the first position of the vault — preserves prior behaviour.
  const p = positionId
    ? DEMO_POSITIONS.find((x) => x.id === positionId)
    : DEMO_POSITIONS.find((x) => x.vaultId === vaultId)
  if (!p) return null

  return {
    capitalDeployed: p.deposited,
    accruedYield: p.claimable,
    cumulativeYieldPaid: p.currentYield,
    positionValue: p.deposited + p.currentYield,
    unlockTimeline: {
      daysRemaining: p.daysRemaining,
      maturityDate: new Date(p.maturityDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      progressPercent: p.progressPercent,
    },
    epoch: {
      currentEpoch: 12,
      epochProgress: 0.62,
      epochEndsAt: new Date(NOW() + 6 * DAY_MS).toISOString(),
    },
    canWithdraw: p.canWithdraw,
    isTargetReached: p.progressPercent >= 100,
    apr: p.apr,
    target: p.target,
  }
}
