/**
 * Database repository layer
 * CRUD operations for users, vaults, positions, and activity
 */

import { getDb } from './connection'
import type {
  DbUser,
  DbUserInput,
  DbVault,
  DbVaultInput,
  DbUserPosition,
  DbUserPositionInput,
  DbUserPositionUpdate,
  DbUserPositionWithVault,
  DbActivityEvent,
  DbActivityEventInput,
} from './schema'
import type { Address } from 'viem'

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Users Repository
export const UserRepository = {
  findByWalletAddress(walletAddress: Address): DbUser | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM users WHERE wallet_address = ?')
    const row = stmt.get(walletAddress) as Record<string, unknown> | undefined
    return row ? mapUserRow(row) : null
  },

  findById(id: string): DbUser | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const row = stmt.get(id) as Record<string, unknown> | undefined
    return row ? mapUserRow(row) : null
  },

  create(input: DbUserInput): DbUser {
    const db = getDb()
    const now = Date.now()
    const user: DbUser = {
      id: generateId('user'),
      walletAddress: input.walletAddress,
      createdAt: now,
      updatedAt: now,
    }

    const stmt = db.prepare(`
      INSERT INTO users (id, wallet_address, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(user.id, user.walletAddress, user.createdAt, user.updatedAt)
    return user
  },

  findOrCreateByWallet(walletAddress: Address): DbUser {
    const existing = this.findByWalletAddress(walletAddress)
    if (existing) return existing
    return this.create({ walletAddress })
  },
}

// Vaults Repository
export const VaultRepository = {
  findAll(): DbVault[] {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM vaults ORDER BY created_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(mapVaultRow)
  },

  findActive(): DbVault[] {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM vaults WHERE is_active = 1 ORDER BY created_at DESC')
    const rows = stmt.all() as Record<string, unknown>[]
    return rows.map(mapVaultRow)
  },

  findById(id: string): DbVault | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM vaults WHERE id = ?')
    const row = stmt.get(id) as Record<string, unknown> | undefined
    return row ? mapVaultRow(row) : null
  },

  create(input: DbVaultInput): DbVault {
    const db = getDb()
    const now = Date.now()
    const vault: DbVault = {
      id: generateId('vault'),
      name: input.name,
      description: input.description ?? null,
      vaultAddress: input.vaultAddress,
      usdcAddress: input.usdcAddress,
      chainId: input.chainId,
      chainName: input.chainName,
      apr: input.apr,
      target: input.target,
      lockPeriodDays: input.lockPeriodDays,
      minDeposit: input.minDeposit,
      strategy: input.strategy,
      fees: input.fees,
      risk: input.risk,
      image: input.image ?? null,
      isActive: input.isActive ?? true ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    }

    const stmt = db.prepare(`
      INSERT INTO vaults (
        id, name, description, vault_address, usdc_address, chain_id, chain_name,
        apr, target, lock_period_days, min_deposit, strategy, fees, risk, image,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      vault.id,
      vault.name,
      vault.description,
      vault.vaultAddress,
      vault.usdcAddress,
      vault.chainId,
      vault.chainName,
      vault.apr,
      vault.target,
      vault.lockPeriodDays,
      vault.minDeposit,
      vault.strategy,
      vault.fees,
      vault.risk,
      vault.image,
      vault.isActive,
      vault.createdAt,
      vault.updatedAt
    )
    return vault
  },

  update(id: string, updates: Partial<DbVaultInput>): DbVault | null {
    const db = getDb()
    const existing = this.findById(id)
    if (!existing) return null

    const now = Date.now()
    const setClauses: string[] = ['updated_at = ?']
    const values: (string | number | null)[] = [now]

    if (updates.name !== undefined) {
      setClauses.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?')
      values.push(updates.description ?? null)
    }
    if (updates.apr !== undefined) {
      setClauses.push('apr = ?')
      values.push(updates.apr)
    }
    if (updates.target !== undefined) {
      setClauses.push('target = ?')
      values.push(updates.target)
    }
    if (updates.lockPeriodDays !== undefined) {
      setClauses.push('lock_period_days = ?')
      values.push(updates.lockPeriodDays)
    }
    if (updates.minDeposit !== undefined) {
      setClauses.push('min_deposit = ?')
      values.push(updates.minDeposit)
    }
    if (updates.strategy !== undefined) {
      setClauses.push('strategy = ?')
      values.push(updates.strategy)
    }
    if (updates.fees !== undefined) {
      setClauses.push('fees = ?')
      values.push(updates.fees)
    }
    if (updates.risk !== undefined) {
      setClauses.push('risk = ?')
      values.push(updates.risk)
    }
    if (updates.image !== undefined) {
      setClauses.push('image = ?')
      values.push(updates.image ?? null)
    }
    if (updates.isActive !== undefined) {
      setClauses.push('is_active = ?')
      values.push(updates.isActive ? 1 : 0)
    }

    values.push(id)

    const stmt = db.prepare(`UPDATE vaults SET ${setClauses.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    return this.findById(id)
  },

  softDelete(id: string): DbVault | null {
    const db = getDb()
    const now = Date.now()
    const stmt = db.prepare('UPDATE vaults SET is_active = 0, updated_at = ? WHERE id = ?')
    const result = stmt.run(now, id)
    if (result.changes === 0) return null
    return this.findById(id)
  },

  delete(id: string): boolean {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM vaults WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },
}

// User Positions Repository
export const PositionRepository = {
  findByUserId(userId: string): DbUserPositionWithVault[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT p.*, v.name as vault_name, v.apr as vault_apr, v.target as vault_target,
             v.strategy as vault_strategy, v.lock_period_days as vault_lock_period_days,
             v.risk as vault_risk, v.fees as vault_fees
      FROM user_positions p
      JOIN vaults v ON p.vault_id = v.id
      WHERE p.user_id = ? AND p.state != 'withdrawn'
      ORDER BY p.created_at DESC
    `)
    const rows = stmt.all(userId) as Record<string, unknown>[]
    return rows.map(mapPositionWithVaultRow)
  },

  findByUserAndVault(userId: string, vaultId: string): DbUserPosition | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM user_positions WHERE user_id = ? AND vault_id = ? AND state != ?')
    const row = stmt.get(userId, vaultId, 'withdrawn') as Record<string, unknown> | undefined
    return row ? mapPositionRow(row) : null
  },

  findById(id: string): DbUserPosition | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM user_positions WHERE id = ?')
    const row = stmt.get(id) as Record<string, unknown> | undefined
    return row ? mapPositionRow(row) : null
  },

  create(input: DbUserPositionInput): DbUserPosition {
    const db = getDb()
    const now = Date.now()
    const position: DbUserPosition = {
      id: generateId('pos'),
      userId: input.userId,
      vaultId: input.vaultId,
      deposited: input.deposited,
      claimedYield: 0,
      accumulatedYield: 0,
      state: 'active',
      createdAt: now,
      maturityDate: input.maturityDate,
      updatedAt: now,
    }

    const stmt = db.prepare(`
      INSERT INTO user_positions (
        id, user_id, vault_id, deposited, claimed_yield, accumulated_yield,
        state, created_at, maturity_date, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      position.id,
      position.userId,
      position.vaultId,
      position.deposited,
      position.claimedYield,
      position.accumulatedYield,
      position.state,
      position.createdAt,
      position.maturityDate,
      position.updatedAt
    )
    return position
  },

  update(id: string, updates: DbUserPositionUpdate): DbUserPosition | null {
    const db = getDb()
    const existing = this.findById(id)
    if (!existing) return null

    const now = Date.now()
    const setClauses: string[] = ['updated_at = ?']
    const values: (string | number)[] = [now]

    if (updates.deposited !== undefined) {
      setClauses.push('deposited = ?')
      values.push(updates.deposited)
    }
    if (updates.claimedYield !== undefined) {
      setClauses.push('claimed_yield = ?')
      values.push(updates.claimedYield)
    }
    if (updates.accumulatedYield !== undefined) {
      setClauses.push('accumulated_yield = ?')
      values.push(updates.accumulatedYield)
    }
    if (updates.state !== undefined) {
      setClauses.push('state = ?')
      values.push(updates.state)
    }
    if (updates.maturityDate !== undefined) {
      setClauses.push('maturity_date = ?')
      values.push(updates.maturityDate)
    }

    values.push(id)

    const stmt = db.prepare(`UPDATE user_positions SET ${setClauses.join(', ')} WHERE id = ?`)
    stmt.run(...values)

    return this.findById(id)
  },

  addDeposit(id: string, amount: number): DbUserPosition | null {
    const db = getDb()
    const position = this.findById(id)
    if (!position) return null

    const now = Date.now()
    const stmt = db.prepare(`
      UPDATE user_positions SET deposited = deposited + ?, updated_at = ? WHERE id = ?
    `)
    stmt.run(amount, now, id)
    return this.findById(id)
  },
}

// Activity Events Repository
export const ActivityRepository = {
  findByUserId(userId: string, limit = 50): DbActivityEvent[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM activity_events
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    const rows = stmt.all(userId, limit) as Record<string, unknown>[]
    return rows.map(mapActivityRow)
  },

  findAll(limit = 100): DbActivityEvent[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT * FROM activity_events
      ORDER BY timestamp DESC
      LIMIT ?
    `)
    const rows = stmt.all(limit) as Record<string, unknown>[]
    return rows.map(mapActivityRow)
  },

  create(input: DbActivityEventInput): DbActivityEvent {
    const db = getDb()
    const event: DbActivityEvent = {
      id: generateId('act'),
      userId: input.userId,
      vaultId: input.vaultId,
      vaultName: input.vaultName,
      type: input.type,
      amount: input.amount,
      timestamp: Date.now(),
    }

    const stmt = db.prepare(`
      INSERT INTO activity_events (id, user_id, vault_id, vault_name, type, amount, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(event.id, event.userId, event.vaultId, event.vaultName, event.type, event.amount, event.timestamp)
    return event
  },
}

// Row mapping functions
function mapUserRow(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    walletAddress: String(row.wallet_address) as Address,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

function mapVaultRow(row: Record<string, unknown>): DbVault {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    vaultAddress: String(row.vault_address) as Address,
    usdcAddress: String(row.usdc_address) as Address,
    chainId: Number(row.chain_id),
    chainName: String(row.chain_name),
    apr: Number(row.apr),
    target: String(row.target),
    lockPeriodDays: Number(row.lock_period_days),
    minDeposit: Number(row.min_deposit),
    strategy: String(row.strategy),
    fees: String(row.fees),
    risk: String(row.risk),
    image: row.image ? String(row.image) : null,
    isActive: Number(row.is_active),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

function mapPositionRow(row: Record<string, unknown>): DbUserPosition {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    vaultId: String(row.vault_id),
    deposited: Number(row.deposited),
    claimedYield: Number(row.claimed_yield),
    accumulatedYield: Number(row.accumulated_yield),
    state: String(row.state) as 'active' | 'matured' | 'withdrawn',
    createdAt: Number(row.created_at),
    maturityDate: Number(row.maturity_date),
    updatedAt: Number(row.updated_at),
  }
}

function mapPositionWithVaultRow(row: Record<string, unknown>): DbUserPositionWithVault {
  const base = mapPositionRow(row)
  return {
    ...base,
    vaultName: String(row.vault_name),
    vaultApr: Number(row.vault_apr),
    vaultTarget: String(row.vault_target),
    vaultStrategy: String(row.vault_strategy),
    vaultLockPeriodDays: Number(row.vault_lock_period_days),
    vaultRisk: String(row.vault_risk),
    vaultFees: String(row.vault_fees),
  }
}

function mapActivityRow(row: Record<string, unknown>): DbActivityEvent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    vaultId: String(row.vault_id),
    vaultName: String(row.vault_name),
    type: String(row.type) as 'deposit' | 'claim' | 'withdraw',
    amount: Number(row.amount),
    timestamp: Number(row.timestamp),
  }
}
