import { base } from 'wagmi/chains'
import type { AvailableVault } from '@/components/connect/data'

export const DEMO_VAULT_ID = 'demo-hashvault-prime'

/**
 * Seed vault displayed when no vaults are configured via /admin.
 * Uses real Base chain USDC address so the pre-flight check renders correctly.
 */
export const DEMO_VAULT: AvailableVault = {
  id: DEMO_VAULT_ID,
  name: 'HashVault Prime',
  type: 'available',
  apr: 12,
  target: '36%',
  strategy: 'RWA Mining · USDC Yield · BTC Hedged',
  image: '/logos/hearst.svg',
  minDeposit: 500_000,
  lockPeriod: '3 Years',
  risk: 'Moderate',
  fees: '1.5% Mgmt · 15% Perf',
}

export function isDemoVault(id: string): boolean {
  return id === DEMO_VAULT_ID
}
