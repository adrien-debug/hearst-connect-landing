/** Position data types — aligned with backend API nomenclature */

export interface UnlockTimeline {
  daysRemaining: number
  maturityDate: string
  progressPercent: number
}

export interface EpochData {
  currentEpoch: number
  epochProgress: number
  /** ISO lock / maturity anchor from on-chain `userInfo` when available */
  epochEndsAt?: string
}

export interface PositionData {
  capitalDeployed: number
  accruedYield: number
  positionValue: number
  unlockTimeline: UnlockTimeline
  epoch: EpochData
  canWithdraw: boolean
  isTargetReached: boolean
  apr: number
  target: string
}

export interface PositionError {
  code: 'WALLET_NOT_CONNECTED' | 'VAULT_NOT_FOUND' | 'FETCH_ERROR'
  message: string
}
