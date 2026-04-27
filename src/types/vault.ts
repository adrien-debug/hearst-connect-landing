import type { Address, Chain } from 'viem'

/** Sub-allocation slice for the vault Composition view. Sums should ≈ 100. */
export interface VaultCompositionSlice {
  label: string
  /** 0–100, percent of the vault notional allocated to this slice. */
  pct: number
  /** Optional hue override; falls back to CHART_PALETTE rotation. */
  color?: string
}

/** Geographic distribution slice (Frontier vault, etc). Sums should ≈ 100. */
export interface VaultGeoSlice {
  region: string
  pct: number
}

/** Monthly historical net yield (% APR equivalent for that month). */
export interface VaultMonthlyReturn {
  /** ISO yyyy-mm — month-end snapshot. */
  month: string
  /** Annualized yield observed for that month, in percent. */
  yieldPct: number
}

/** Optional enrichment fields surfaced in the vault detail page. All optional
 * so live DB-driven vaults remain compatible. */
export interface VaultMeta {
  /** Vault inception (epoch ms). */
  inception?: number
  /** Total value locked across all subscribers (USD). */
  tvl?: number
  /** Number of distinct investor wallets. */
  investorCount?: number
  /** 12–24 monthly snapshots, oldest first. */
  historicalReturns?: VaultMonthlyReturn[]
  /** Sub-strategy breakdown for the Composition card. */
  composition?: VaultCompositionSlice[]
  /** Region distribution for vaults with geo exposure. */
  geo?: VaultGeoSlice[]
  /** Maximum drawdown observed since inception (%). */
  maxDrawdown?: number
  /** Realized annualized volatility (%). */
  volatility?: number
  /** Realized Sharpe (annualized). */
  sharpe?: number
  /** Cumulative net yield since inception (USD distributed across all positions). */
  cumulativeYield?: number
  /** Penalty (basis points or % wording) for early withdrawal. */
  earlyWithdrawalPenalty?: string
  /** Custodian / counterparty disclosure. */
  custodian?: string
  /** Audit reports (label + URL). */
  auditReports?: Array<{ label: string; url: string }>
}

export interface VaultConfig extends VaultMeta {
  id: string
  name: string
  description?: string
  vaultAddress: Address
  usdcAddress: Address
  chain: Chain
  apr: number
  target: string
  lockPeriodDays: number
  minDeposit: number
  strategy: string
  fees: string
  risk: string
  image?: string
  isTest: boolean
  isActive: boolean
  createdAt: number
}

export type VaultConfigInput = Omit<VaultConfig, 'id' | 'createdAt' | 'isActive'> & {
  id?: string
}
