/**
 * API Client for Hearst Connect backend
 * HTTP client utilities for the SQLite-backed API
 * Includes wallet-based authentication headers
 */

import type { Address, Chain } from 'viem'
import type {
  DbUser,
  DbVault,
  DbVaultInput,
  DbUserPosition,
  DbUserPositionWithVault,
  DbActivityEvent,
  DbActivityEventInput,
} from './db/schema'

const API_BASE = '/api'
const WALLET_HEADER = 'x-wallet-address'

// Current wallet address for authenticated requests
let currentWalletAddress: Address | null = null

export function setApiWalletAddress(address: Address | null) {
  currentWalletAddress = address
}

// Error handling helper
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit, requireAuth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add wallet authentication header if available
  if (currentWalletAddress) {
    headers[WALLET_HEADER] = currentWalletAddress
  } else if (requireAuth) {
    throw new ApiError(401, 'Wallet not connected. Authentication required.')
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Users API
export const UsersApi = {
  async findByWallet(walletAddress: Address): Promise<{ user: DbUser } | null> {
    try {
      return await fetchApi<{ user: DbUser }>(`/users?wallet=${encodeURIComponent(walletAddress)}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  async findOrCreate(walletAddress: Address): Promise<{ user: DbUser; isNew: boolean }> {
    return fetchApi<{ user: DbUser; isNew: boolean }>('/users', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    })
  },
}

// Vaults API
export const VaultsApi = {
  async list(activeOnly = false): Promise<{ vaults: DbVault[] }> {
    return fetchApi<{ vaults: DbVault[] }>(`/vaults${activeOnly ? '?active=true' : ''}`)
  },

  async getById(id: string): Promise<{ vault: DbVault } | null> {
    try {
      return await fetchApi<{ vault: DbVault }>(`/vaults/${id}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  async create(input: DbVaultInput): Promise<{ vault: DbVault }> {
    return fetchApi<{ vault: DbVault }>('/vaults', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async update(id: string, updates: Partial<DbVaultInput>): Promise<{ vault: DbVault }> {
    return fetchApi<{ vault: DbVault }>(`/vaults/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async delete(id: string): Promise<void> {
    await fetchApi<void>(`/vaults/${id}`, { method: 'DELETE' })
  },
}

// Positions API - All require authentication
export const PositionsApi = {
  // GET /positions - lists positions for authenticated wallet (no userId param needed)
  async listByUser(): Promise<{ positions: DbUserPositionWithVault[] }> {
    return fetchApi<{ positions: DbUserPositionWithVault[] }>('/positions', undefined, true)
  },

  // POST /positions - creates position for authenticated wallet
  async create(
    vaultId: string,
    deposited: number,
    maturityDate: number,
    vaultName: string,
    txHash?: string
  ): Promise<{ position: DbUserPosition; isNew: boolean }> {
    return fetchApi<{ position: DbUserPosition; isNew: boolean }>(
      '/positions',
      {
        method: 'POST',
        body: JSON.stringify({ vaultId, deposited, maturityDate, vaultName, txHash }),
      },
      true
    )
  },

  // PATCH /positions - updates position for authenticated wallet
  async update(
    positionId: string,
    updates: {
      deposited?: number
      claimedYield?: number
      accumulatedYield?: number
      state?: 'active' | 'matured' | 'withdrawn'
      maturityDate?: number
      vaultName?: string
      txHash?: string
    }
  ): Promise<{ position: DbUserPosition }> {
    return fetchApi<{ position: DbUserPosition }>(
      '/positions',
      {
        method: 'PATCH',
        body: JSON.stringify({ positionId, ...updates }),
      },
      true
    )
  },

  // POST /positions (same endpoint, adds to existing) - for additional deposits
  async addDeposit(
    vaultId: string,
    amount: number,
    maturityDate: number,
    vaultName: string,
    txHash?: string
  ): Promise<{ position: DbUserPosition; isNew: boolean }> {
    return fetchApi<{ position: DbUserPosition; isNew: boolean }>(
      '/positions',
      {
        method: 'POST',
        body: JSON.stringify({ vaultId, deposited: amount, maturityDate, vaultName, txHash }),
      },
      true
    )
  },
}

// Activity API - All require authentication
export const ActivityApi = {
  // GET /activity - lists activity for authenticated wallet
  async listByUser(limit = 50): Promise<{ events: DbActivityEvent[] }> {
    return fetchApi<{ events: DbActivityEvent[] }>(
      `/activity?limit=${limit}`,
      undefined,
      true
    )
  },

  // POST /activity - creates activity event for authenticated wallet
  async create(input: Omit<DbActivityEventInput, 'userId'> & { txHash?: string }): Promise<{ event: DbActivityEvent }> {
    return fetchApi<{ event: DbActivityEvent }>(
      '/activity',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      true
    )
  },

  async logClaim(vaultId: string, vaultName: string, amount: number, txHash?: string): Promise<void> {
    await this.create({ vaultId, vaultName, type: 'claim', amount, txHash })
  },

  async logWithdraw(vaultId: string, vaultName: string, amount: number, txHash?: string): Promise<void> {
    await this.create({ vaultId, vaultName, type: 'withdraw', amount, txHash })
  },
}

// Utility to convert DbVault to VaultConfig format for existing components
export function dbVaultToConfig(dbVault: DbVault): {
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
  isActive: boolean
  createdAt: number
} {
  return {
    id: dbVault.id,
    name: dbVault.name,
    description: dbVault.description ?? undefined,
    vaultAddress: dbVault.vaultAddress,
    usdcAddress: dbVault.usdcAddress,
    chain: { id: dbVault.chainId, name: dbVault.chainName } as Chain,
    apr: dbVault.apr,
    target: dbVault.target,
    lockPeriodDays: dbVault.lockPeriodDays,
    minDeposit: dbVault.minDeposit,
    strategy: dbVault.strategy,
    fees: dbVault.fees,
    risk: dbVault.risk,
    image: dbVault.image ?? undefined,
    isActive: dbVault.isActive === 1,
    createdAt: dbVault.createdAt,
  }
}
