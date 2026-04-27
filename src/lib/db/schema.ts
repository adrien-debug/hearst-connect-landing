/**
 * Database schema definitions for Hearst Connect backend
 * Lightweight SQLite layer for user data, vaults, positions, and activity
 */

import type { Address } from 'viem'

// User model - identified by wallet address
export interface DbUser {
  id: string
  walletAddress: Address
  createdAt: number
  updatedAt: number
}

export interface DbUserInput {
  walletAddress: Address
}

// Vault model - admin configured vaults (replaces localStorage vault-registry)
export interface DbVault {
  id: string
  name: string
  description: string | null
  vaultAddress: Address
  usdcAddress: Address
  chainId: number
  chainName: string
  apr: number
  target: string
  lockPeriodDays: number
  minDeposit: number
  strategy: string
  fees: string
  risk: string
  image: string | null
  isTest: number // SQLite boolean as 0/1
  isActive: number // SQLite boolean as 0/1
  createdAt: number
  updatedAt: number
}

export interface DbVaultInput {
  name: string
  description?: string
  vaultAddress: Address
  usdcAddress: Address
  chainId: number
  chainName: string
  apr: number
  target: string
  lockPeriodDays: number
  minDeposit: number
  strategy: string
  fees: string
  risk: string
  image?: string
  isActive?: boolean
}

// User Position model - user's investments in vaults
export interface DbUserPosition {
  id: string
  userId: string
  vaultId: string
  deposited: number // USDC with 6 decimals stored as number
  claimedYield: number
  accumulatedYield: number
  state: 'active' | 'matured' | 'withdrawn'
  createdAt: number
  maturityDate: number
  updatedAt: number
}

export interface DbUserPositionInput {
  userId: string
  vaultId: string
  deposited: number
  maturityDate: number
}

export interface DbUserPositionUpdate {
  deposited?: number
  claimedYield?: number
  accumulatedYield?: number
  state?: 'active' | 'matured' | 'withdrawn'
  maturityDate?: number
}

// Activity Event model - user activity history
export interface DbActivityEvent {
  id: string
  userId: string
  vaultId: string
  vaultName: string
  type: 'deposit' | 'claim' | 'withdraw'
  amount: number
  timestamp: number
}

export interface DbActivityEventInput {
  userId: string
  vaultId: string
  vaultName: string
  type: 'deposit' | 'claim' | 'withdraw'
  amount: number
}

// Join result types for queries
export interface DbUserPositionWithVault extends DbUserPosition {
  vaultName: string
  vaultApr: number
  vaultTarget: string
  vaultStrategy: string
  vaultLockPeriodDays: number
  vaultRisk: string
  vaultFees: string
}

// Market Snapshot - periodic market data captured by agents
export type SignalType = 'TAKE_PROFIT' | 'REBALANCE' | 'YIELD_ROTATE' | 'INCREASE_BTC' | 'REDUCE_RISK'
export type SignalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'blocked'
export type AgentName = 'watcher' | 'strategy' | 'audit'
export type LogLevel = 'info' | 'warn' | 'error'

export interface DbMarketSnapshot {
  id: string
  timestamp: number
  btcPrice: number
  btc24hChange: number
  btc7dChange: number
  usdcApy: number
  usdtApy: number
  btcApy: number
  miningHashprice: number | null
  fearGreed: number
  fearLabel: string
  notes: string | null
}

export interface DbMarketSnapshotInput {
  btcPrice: number
  btc24hChange: number
  btc7dChange: number
  usdcApy: number
  usdtApy: number
  btcApy: number
  miningHashprice?: number
  fearGreed: number
  fearLabel: string
  notes?: string
}

export interface DbRebalanceSignal {
  id: string
  timestamp: number
  type: SignalType
  vaultId: string | null
  description: string
  paramsJson: string | null
  status: SignalStatus
  riskScore: number | null
  riskNotes: string | null
  createdBy: AgentName
  approvedAt: number | null
  executedAt: number | null
}

export interface DbRebalanceSignalInput {
  type: SignalType
  vaultId?: string
  description: string
  paramsJson?: string
  riskScore?: number
  riskNotes?: string
  createdBy: AgentName
}

export interface DbAgentLog {
  id: string
  agent: AgentName
  timestamp: number
  level: LogLevel
  message: string
  dataJson: string | null
}

export interface DbAgentLogInput {
  agent: AgentName
  level: LogLevel
  message: string
  dataJson?: string
}

// ── Agent Config ────────────────────────────────────────────────────────

export interface DbAgentConfig {
  key: string
  value: string
  updatedAt: number
}

export interface AgentConfigMap {
  btc_entry_price: string
  profit_levels: string // JSON array [{mult, pct}]
  fear_greed_low: string
  fear_greed_high: string
  yield_drift_threshold: string
  allocation_drift_threshold: string
  max_btc_sell_pct: string
  watcher_interval_ms: string
  strategy_interval_ms: string
  audit_interval_ms: string
  signal_cooldown_hours: string // JSON {TAKE_PROFIT:24, ...}
  strategy_prompt_extra: string
  audit_prompt_extra: string
  watcher_prompt_extra: string
}
