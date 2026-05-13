/**
 * API Client for Hearst Connect backend
 * HTTP client utilities for the SQLite-backed API
 * Uses session cookies for authentication (set by SIWE /api/auth/verify)
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
  DbRebalanceSignal,
  DbMarketSnapshot,
} from './db/schema'

const API_BASE = '/api'

// Track auth state for conditional logic
let isAuthenticated = false

export function setApiAuthenticated(value: boolean) {
  isAuthenticated = value
}

// Error handling helper
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const ADMIN_KEY = 'hearst-admin-dev-key'

async function fetchApi<T>(endpoint: string, options?: RequestInit, requireAuth = false): Promise<T> {
  if (requireAuth && !isAuthenticated) {
    throw new ApiError(401, 'Authentication required. Please sign in.')
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  async findOrCreate(): Promise<{ user: DbUser; isNew: boolean }> {
    return fetchApi<{ user: DbUser; isNew: boolean }>('/users', {
      method: 'POST',
      body: JSON.stringify({}), // Address comes from session cookie
    }, true)
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
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async update(id: string, updates: Partial<DbVaultInput>): Promise<{ vault: DbVault }> {
    return fetchApi<{ vault: DbVault }>(`/vaults/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async delete(id: string): Promise<void> {
    await fetchApi<void>(`/vaults/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },
}

// Positions API - All require authentication via session cookie
export const PositionsApi = {
  // GET /positions - lists positions for authenticated user (from session)
  async listByUser(): Promise<{ positions: DbUserPositionWithVault[] }> {
    return fetchApi<{ positions: DbUserPositionWithVault[] }>('/positions', undefined, true)
  },

  // POST /positions - creates position for authenticated user
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

  // PATCH /positions - updates position for authenticated user
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

// Activity API - All require authentication via session cookie
export const ActivityApi = {
  // GET /activity - lists activity for authenticated user
  async listByUser(limit = 50): Promise<{ events: DbActivityEvent[] }> {
    return fetchApi<{ events: DbActivityEvent[] }>(
      `/activity?limit=${limit}`,
      undefined,
      true
    )
  },

  // POST /activity - creates activity event for authenticated user
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

// Signals API - Admin only
export const SignalsApi = {
  async list(status?: string, limit = 50): Promise<{ signals: DbRebalanceSignal[] }> {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    qs.set('limit', String(limit))
    return fetchApi<{ signals: DbRebalanceSignal[] }>(`/signals?${qs}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async getById(id: string): Promise<{ signal: DbRebalanceSignal } | null> {
    try {
      return await fetchApi<{ signal: DbRebalanceSignal }>(`/signals/${id}`, {
        headers: { 'x-admin-key': ADMIN_KEY },
      })
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },

  async approve(id: string): Promise<{ signal: DbRebalanceSignal }> {
    return fetchApi<{ signal: DbRebalanceSignal }>(`/signals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async reject(id: string): Promise<{ signal: DbRebalanceSignal }> {
    return fetchApi<{ signal: DbRebalanceSignal }>(`/signals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async execute(id: string): Promise<{ signal: DbRebalanceSignal }> {
    return fetchApi<{ signal: DbRebalanceSignal }>(`/signals/${id}/execute`, {
      method: 'POST',
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },
}

// Market API - Admin only
export const MarketApi = {
  async latest(): Promise<{ snapshot: DbMarketSnapshot | null }> {
    return fetchApi<{ snapshot: DbMarketSnapshot | null }>('/market', {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },

  async history(limit = 100, from?: number): Promise<{ snapshots: DbMarketSnapshot[] }> {
    const qs = new URLSearchParams({ limit: String(limit) })
    if (from) qs.set('from', String(from))
    return fetchApi<{ snapshots: DbMarketSnapshot[] }>(`/market/history?${qs}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },
}

// Agents Status API - Admin only
export const AgentsApi = {
  async status(): Promise<{ agents: Array<{ name: string; status: string; lastSeen: number | null; lastMessage: string | null }> }> {
    return fetchApi(`/agents/status`, {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },
  async getConfig(): Promise<{ config: Record<string, string>; defaults: Record<string, string> }> {
    return fetchApi('/agents/config', {
      headers: { 'x-admin-key': ADMIN_KEY },
    })
  },
  async updateConfig(config: Record<string, string>): Promise<{ config: Record<string, string> }> {
    return fetchApi('/agents/config', {
      method: 'PUT',
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
  },

  async run(agent: 'watcher' | 'strategy' | 'audit'): Promise<{
    success: boolean
    agent: string
    report: string
    signalsCreated: string[]
    signalsUpdated: string[]
    durationMs: number
    eventCount: number
  }> {
    return fetchApi('/agents/run', {
      method: 'POST',
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent }),
    })
  },

  // Returns a ReadableStream by fetching the SSE endpoint with admin headers.
  // This avoids exposing the admin key in the URL (EventSource limitation workaround).
  streamRun(
    agent: 'watcher' | 'strategy' | 'audit',
    onEvent: (raw: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): AbortController {
    const controller = new AbortController()
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    fetch(`${base}/api/agents/run/stream?agent=${agent}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (line.startsWith('data: ')) onEvent(line.slice(6))
          }
        }
        onDone()
      })
      .catch((e) => {
        if (e.name !== 'AbortError') onError(e instanceof Error ? e : new Error(String(e)))
      })
    return controller
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
  isTest: boolean
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
    isTest: (dbVault as DbVault & { isTest?: number }).isTest === 1,
    isActive: dbVault.isActive === 1,
    createdAt: dbVault.createdAt,
  }
}
