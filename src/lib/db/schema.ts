/**
 * Database schema definitions for Hearst Connect backend
 * Lightweight SQLite layer for user data, vaults, positions, and activity
 */

import type { Address, Chain } from 'viem'

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
