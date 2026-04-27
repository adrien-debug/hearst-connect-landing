/**
 * Centralized mock data for demo mode.
 * Populates every panel with realistic figures for screenshots.
 */

import type { VaultConfig } from '@/types/vault'
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

// ───────────────────────────────────────────── Vaults registry

export const DEMO_VAULTS: VaultConfig[] = [
  {
    id: 'demo-vault-flagship',
    name: 'Flagship Mining Yield',
    description: 'Anchor allocation across hashprice-hedged industrial mining operations.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 12.4,
    target: '12.4%',
    lockPeriodDays: 365,
    minDeposit: 5000,
    strategy: 'Hash-rate diversified · monthly distribution',
    fees: '1.5% performance · 0.25% management',
    risk: 'Medium',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 60 * DAY_MS,
  },
  {
    id: 'demo-vault-conservative',
    name: 'Conservative USDC Core',
    description: 'Capital-preservation tier — short-term USDC ladders backed by mining receivables.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 7.8,
    target: '7.8%',
    lockPeriodDays: 90,
    minDeposit: 1000,
    strategy: 'Receivable-backed USDC ladders',
    fees: '0.5% management',
    risk: 'Low',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 90 * DAY_MS,
  },
  {
    id: 'demo-vault-growth',
    name: 'Growth Hashrate +',
    description: 'Higher-beta allocation tracking new-build hashrate expansions.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 16.2,
    target: '16.2%',
    lockPeriodDays: 540,
    minDeposit: 10000,
    strategy: 'New-build hashrate exposure',
    fees: '2.0% performance · 0.25% management',
    risk: 'High',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 30 * DAY_MS,
  },
  {
    id: 'demo-vault-treasury',
    name: 'Treasury Plus',
    description: 'Idle USDC parked into curated short-duration mining-backed notes.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 5.6,
    target: '5.6%',
    lockPeriodDays: 30,
    minDeposit: 500,
    strategy: 'Curated short-duration notes',
    fees: '0.4% management',
    risk: 'Very Low',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 14 * DAY_MS,
  },
  {
    id: 'demo-vault-frontier',
    name: 'Frontier Hashrate',
    description: 'Opportunistic exposure — emerging-market mining sites.',
    vaultAddress: ZERO_ADDR,
    usdcAddress: USDC_BASE,
    chain: base,
    apr: 19.5,
    target: '19.5%',
    lockPeriodDays: 730,
    minDeposit: 25000,
    strategy: 'Frontier-market opportunistic',
    fees: '2.5% performance · 0.5% management',
    risk: 'High',
    image: undefined,
    isTest: false,
    isActive: true,
    createdAt: NOW() - 7 * DAY_MS,
  },
]

// ───────────────────────────────────────────── User positions

const _positions: Array<Omit<UserPositionLine, 'daysRemaining' | 'progressPercent' | 'isMatured' | 'canWithdraw' | 'state'> & { state: UserPositionLine['state'] }> = [
  {
    id: 'demo-pos-1',
    vaultId: 'demo-vault-flagship',
    vaultName: 'Flagship Mining Yield',
    deposited: 145_000,
    claimable: 1_854.32,
    currentYield: 11_240.78,
    createdAt: NOW() - 220 * DAY_MS,
    maturityDate: NOW() + 145 * DAY_MS,
    state: 'active',
    apr: 12.4,
    target: '12.4%',
    strategy: 'Hash-rate diversified · monthly distribution',
    risk: 'Medium',
    fees: '1.5% performance · 0.25% management',
  },
  {
    id: 'demo-pos-2',
    vaultId: 'demo-vault-conservative',
    vaultName: 'Conservative USDC Core',
    deposited: 80_000,
    claimable: 412.66,
    currentYield: 2_184.44,
    createdAt: NOW() - 60 * DAY_MS,
    maturityDate: NOW() + 30 * DAY_MS,
    state: 'active',
    apr: 7.8,
    target: '7.8%',
    strategy: 'Receivable-backed USDC ladders',
    risk: 'Low',
    fees: '0.5% management',
  },
  {
    id: 'demo-pos-3',
    vaultId: 'demo-vault-growth',
    vaultName: 'Growth Hashrate +',
    deposited: 60_000,
    claimable: 968.10,
    currentYield: 4_218.50,
    createdAt: NOW() - 110 * DAY_MS,
    maturityDate: NOW() + 430 * DAY_MS,
    state: 'active',
    apr: 16.2,
    target: '16.2%',
    strategy: 'New-build hashrate exposure',
    risk: 'High',
    fees: '2.0% performance · 0.25% management',
  },
  {
    id: 'demo-pos-4',
    vaultId: 'demo-vault-treasury',
    vaultName: 'Treasury Plus',
    deposited: 40_000,
    claimable: 92.18,
    currentYield: 386.92,
    createdAt: NOW() - 14 * DAY_MS,
    maturityDate: NOW() + 16 * DAY_MS,
    state: 'active',
    apr: 5.6,
    target: '5.6%',
    strategy: 'Curated short-duration notes',
    risk: 'Very Low',
    fees: '0.4% management',
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

export const DEMO_ACTIVITY: UserActivityItem[] = [
  { id: 'a1', type: 'claim',    vaultId: 'demo-vault-flagship',     vaultName: 'Flagship Mining Yield',    amount: 1_240.55, timestamp: NOW() - 2 * 60 * 60 * 1000 },
  { id: 'a2', type: 'deposit',  vaultId: 'demo-vault-treasury',     vaultName: 'Treasury Plus',            amount: 40_000,    timestamp: NOW() - 14 * DAY_MS },
  { id: 'a3', type: 'claim',    vaultId: 'demo-vault-conservative', vaultName: 'Conservative USDC Core',   amount: 318.22,   timestamp: NOW() - 1 * DAY_MS },
  { id: 'a4', type: 'deposit',  vaultId: 'demo-vault-growth',       vaultName: 'Growth Hashrate +',        amount: 60_000,    timestamp: NOW() - 110 * DAY_MS },
  { id: 'a5', type: 'claim',    vaultId: 'demo-vault-growth',       vaultName: 'Growth Hashrate +',        amount: 884.77,   timestamp: NOW() - 5 * DAY_MS },
  { id: 'a6', type: 'withdraw', vaultId: 'demo-vault-treasury',     vaultName: 'Treasury Plus',            amount: 25_000,    timestamp: NOW() - 22 * DAY_MS },
  { id: 'a7', type: 'deposit',  vaultId: 'demo-vault-flagship',     vaultName: 'Flagship Mining Yield',    amount: 145_000,   timestamp: NOW() - 220 * DAY_MS },
  { id: 'a8', type: 'claim',    vaultId: 'demo-vault-flagship',     vaultName: 'Flagship Mining Yield',    amount: 962.10,   timestamp: NOW() - 9 * DAY_MS },
]

// ───────────────────────────────────────────── Stats (lifetime)

export const DEMO_STATS: UserDataStats = {
  totalDeposited: DEMO_POSITIONS.reduce((s, p) => s + p.deposited, 0),
  totalClaimable: DEMO_POSITIONS.reduce((s, p) => s + p.claimable, 0),
  totalYieldClaimed: 8_410.22,
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
  const snapshots = []
  const now = NOW()
  let price = 92_000
  for (let i = 47; i >= 0; i--) {
    price = price * (1 + (Math.sin(i / 6) * 0.012 + (Math.cos(i / 9) * 0.006)))
    snapshots.push({
      id: `mkt-demo-${i}`,
      timestamp: now - i * 60 * 60 * 1000,
      btcPrice: Math.round(price),
      btc24hChange: +(Math.sin(i / 5) * 2.5).toFixed(2),
      btc7dChange: +(Math.cos(i / 8) * 4).toFixed(2),
      usdcApy: 5.6 + Math.sin(i / 12) * 0.3,
      usdtApy: 5.4 + Math.sin(i / 11) * 0.3,
      btcApy: 3.2 + Math.cos(i / 14) * 0.4,
      miningHashprice: 58 + Math.sin(i / 7) * 4,
      fearGreed: Math.round(60 + Math.sin(i / 4) * 12),
      fearLabel: 'Greed',
      notes: null,
    })
  }
  return { snapshots }
})()

// ───────────────────────────────────────────── Agents status

export const DEMO_AGENTS_STATUS = {
  agents: [
    { name: 'watcher',  status: 'online',  lastSeen: NOW() - 4 * 60 * 1000,  lastMessage: 'Snapshot collected — BTC $96,482 (+1.84% 24h)' },
    { name: 'strategy', status: 'online',  lastSeen: NOW() - 12 * 60 * 1000, lastMessage: '2 signals emitted — 1 pending review' },
    { name: 'audit',    status: 'online',  lastSeen: NOW() - 38 * 60 * 1000, lastMessage: 'Risk envelope nominal — no breaches' },
  ],
}

// ───────────────────────────────────────────── Rebalance signals

export const DEMO_SIGNALS = {
  signals: [
    {
      id: 'sig-1',
      timestamp: NOW() - 25 * 60 * 1000,
      type: 'TAKE_PROFIT' as const,
      vaultId: 'demo-vault-flagship',
      description: 'BTC crossed +6% trigger over 7d window — recommend taking profit on Flagship.',
      paramsJson: JSON.stringify({ pct: 8 }),
      status: 'pending' as const,
      riskScore: 38,
      riskNotes: 'Liquidity adequate · slippage estimate < 0.4%',
      createdBy: 'strategy' as const,
      approvedAt: null,
      executedAt: null,
    },
    {
      id: 'sig-2',
      timestamp: NOW() - 2 * 60 * 60 * 1000,
      type: 'REBALANCE' as const,
      vaultId: 'demo-vault-growth',
      description: 'Allocation drift > 4% on Growth Hashrate — rebalance to target weights.',
      paramsJson: JSON.stringify({ drift: 4.2 }),
      status: 'approved' as const,
      riskScore: 22,
      riskNotes: 'Standard rebalance · within risk budget',
      createdBy: 'strategy' as const,
      approvedAt: NOW() - 90 * 60 * 1000,
      executedAt: null,
    },
    {
      id: 'sig-3',
      timestamp: NOW() - 6 * 60 * 60 * 1000,
      type: 'YIELD_ROTATE' as const,
      vaultId: 'demo-vault-conservative',
      description: 'USDC ladder maturing — rotate into 90d tranche at 7.9% APY.',
      paramsJson: null,
      status: 'executed' as const,
      riskScore: 10,
      riskNotes: 'Routine rotation',
      createdBy: 'strategy' as const,
      approvedAt: NOW() - 5 * 60 * 60 * 1000,
      executedAt: NOW() - 4 * 60 * 60 * 1000,
    },
    {
      id: 'sig-4',
      timestamp: NOW() - 28 * 60 * 60 * 1000,
      type: 'REDUCE_RISK' as const,
      vaultId: 'demo-vault-frontier',
      description: 'Frontier hashrate volatility spiked — recommend trimming exposure 15%.',
      paramsJson: JSON.stringify({ trim: 15 }),
      status: 'rejected' as const,
      riskScore: 71,
      riskNotes: 'Strategy overrides — long thesis intact',
      createdBy: 'audit' as const,
      approvedAt: null,
      executedAt: null,
    },
    {
      id: 'sig-5',
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
    },
  ],
}

// ───────────────────────────────────────────── Admin activity log (system events)

export const DEMO_ADMIN_ACTIVITY = [
  { id: 'l1', userId: 'sys', vaultId: 'demo-vault-flagship',     vaultName: 'Flagship Mining Yield',  type: 'claim'    as const, amount: 1240,  timestamp: NOW() - 2 * 60 * 60 * 1000 },
  { id: 'l2', userId: 'sys', vaultId: 'demo-vault-growth',       vaultName: 'Growth Hashrate +',      type: 'deposit'  as const, amount: 60000, timestamp: NOW() - 4 * 60 * 60 * 1000 },
  { id: 'l3', userId: 'sys', vaultId: 'demo-vault-conservative', vaultName: 'Conservative USDC Core', type: 'claim'    as const, amount: 318,   timestamp: NOW() - 24 * 60 * 60 * 1000 },
  { id: 'l4', userId: 'sys', vaultId: 'demo-vault-treasury',     vaultName: 'Treasury Plus',          type: 'withdraw' as const, amount: 25000, timestamp: NOW() - 22 * 24 * 60 * 60 * 1000 },
  { id: 'l5', userId: 'sys', vaultId: 'demo-vault-flagship',     vaultName: 'Flagship Mining Yield',  type: 'deposit'  as const, amount: 145000,timestamp: NOW() - 220 * 24 * 60 * 60 * 1000 },
  { id: 'l6', userId: 'sys', vaultId: 'demo-vault-growth',       vaultName: 'Growth Hashrate +',      type: 'claim'    as const, amount: 884,   timestamp: NOW() - 5 * 24 * 60 * 60 * 1000 },
]

// ───────────────────────────────────────────── Position data (on-chain shape)

export function getDemoPositionData(vaultId: string) {
  const p = DEMO_POSITIONS.find((x) => x.vaultId === vaultId)
  if (!p) return null

  return {
    capitalDeployed: p.deposited,
    accruedYield: p.claimable,
    positionValue: p.deposited + p.claimable,
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
