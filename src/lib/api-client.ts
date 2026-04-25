/**
 * API Client for Hearst Connect backend
 * HTTP client utilities for the SQLite-backed API
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

// Error handling helper
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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

// Positions API
export const PositionsApi = {
  async listByUser(userId: string): Promise<{ positions: DbUserPositionWithVault[] }> {
    return fetchApi<{ positions: DbUserPositionWithVault[] }>(`/positions?userId=${encodeURIComponent(userId)}`)
  },

  async create(
    userId: string,
    vaultId: string,
    deposited: number,
    maturityDate: number,
    vaultName: string
  ): Promise<{ position: DbUserPosition; isNew: boolean }> {
    return fetchApi<{ position: DbUserPosition; isNew: boolean }>('/positions', {
      method: 'POST',
      body: JSON.stringify({ userId, vaultId, deposited, maturityDate, vaultName }),
    })
  },

  async update(
    id: string,
    updates: {
      deposited?: number
      claimedYield?: number
      accumulatedYield?: number
      state?: 'active' | 'matured' | 'withdrawn'
      maturityDate?: number
      vaultName?: string
    }
  ): Promise<{ position: DbUserPosition }> {
    return fetchApi<{ position: DbUserPosition }>('/positions', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    })
  },

  async addDeposit(
    userId: string,
    vaultId: string,
    amount: number,
    maturityDate: number,
    vaultName: string
  ): Promise<{ position: DbUserPosition; isNew: boolean }> {
    return fetchApi<{ position: DbUserPosition; isNew: boolean }>('/positions', {
      method: 'POST',
      body: JSON.stringify({ userId, vaultId, deposited: amount, maturityDate, vaultName }),
    })
  },
}

// Activity API
export const ActivityApi = {
  async listByUser(userId: string, limit = 50): Promise<{ events: DbActivityEvent[] }> {
    return fetchApi<{ events: DbActivityEvent[] }>(
      `/activity?userId=${encodeURIComponent(userId)}&limit=${limit}`
    )
  },

  async create(input: DbActivityEventInput): Promise<{ event: DbActivityEvent }> {
    return fetchApi<{ event: DbActivityEvent }>('/activity', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async logClaim(userId: string, vaultId: string, vaultName: string, amount: number): Promise<void> {
    await this.create({ userId, vaultId, vaultName, type: 'claim', amount })
  },

  async logWithdraw(userId: string, vaultId: string, vaultName: string, amount: number): Promise<void> {
    await this.create({ userId, vaultId, vaultName, type: 'withdraw', amount })
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
