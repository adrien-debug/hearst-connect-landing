import { type Address } from 'viem'
import { base } from 'wagmi/chains'

export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? '') as Address
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '') as Address

export const TARGET_CHAIN = base

export const USDC_DECIMALS = 6

export const CONTRACT_CONFIG = {
  EPOCH_DURATION: 30 * 24 * 60 * 60,
  WITHDRAWAL_LOCK_PERIOD: 4 * 365 * 24 * 60 * 60,
  BASIS_POINTS: 10_000,
} as const
