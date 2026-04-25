import type { Address, Chain } from 'viem'

export interface VaultConfig {
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
