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
  DbMarketSnapshot,
  DbMarketSnapshotInput,
  DbRebalanceSignal,
  DbRebalanceSignalInput,
  DbAgentLog,
  DbAgentLogInput,
  DbAgentConfig,
  SignalStatus,
  AgentName,
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
      isTest: (input as DbVaultInput & { isTest?: boolean }).isTest ? 1 : 0,
      isActive: input.isActive ?? true ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    }

    const stmt = db.prepare(`
      INSERT INTO vaults (
        id, name, description, vault_address, usdc_address, chain_id, chain_name,
        apr, target, lock_period_days, min_deposit, strategy, fees, risk, image,
        is_test, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      vault.isTest,
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
    isTest: Number(row.is_test ?? 0),
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

// Market Snapshots Repository
export const MarketRepository = {
  latest(): DbMarketSnapshot | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM market_snapshots ORDER BY timestamp DESC LIMIT 1').get() as Record<string, unknown> | undefined
    return row ? mapSnapshotRow(row) : null
  },

  history(limit = 100, from?: number): DbMarketSnapshot[] {
    const db = getDb()
    if (from) {
      const rows = db.prepare('SELECT * FROM market_snapshots WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ?').all(from, limit) as Record<string, unknown>[]
      return rows.map(mapSnapshotRow)
    }
    const rows = db.prepare('SELECT * FROM market_snapshots ORDER BY timestamp DESC LIMIT ?').all(limit) as Record<string, unknown>[]
    return rows.map(mapSnapshotRow)
  },

  create(input: DbMarketSnapshotInput): DbMarketSnapshot {
    const db = getDb()
    const snapshot: DbMarketSnapshot = {
      id: generateId('snap'),
      timestamp: Date.now(),
      btcPrice: input.btcPrice,
      btc24hChange: input.btc24hChange,
      btc7dChange: input.btc7dChange,
      usdcApy: input.usdcApy,
      usdtApy: input.usdtApy,
      btcApy: input.btcApy,
      miningHashprice: input.miningHashprice ?? null,
      fearGreed: input.fearGreed,
      fearLabel: input.fearLabel,
      notes: input.notes ?? null,
    }
    db.prepare(`
      INSERT INTO market_snapshots (id, timestamp, btc_price, btc_24h_change, btc_7d_change, usdc_apy, usdt_apy, btc_apy, mining_hashprice, fear_greed, fear_label, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(snapshot.id, snapshot.timestamp, snapshot.btcPrice, snapshot.btc24hChange, snapshot.btc7dChange, snapshot.usdcApy, snapshot.usdtApy, snapshot.btcApy, snapshot.miningHashprice, snapshot.fearGreed, snapshot.fearLabel, snapshot.notes)
    return snapshot
  },
}

// Rebalance Signals Repository
export const SignalRepository = {
  findAll(status?: SignalStatus, limit = 50): DbRebalanceSignal[] {
    const db = getDb()
    if (status) {
      return (db.prepare('SELECT * FROM rebalance_signals WHERE status = ? ORDER BY timestamp DESC LIMIT ?').all(status, limit) as Record<string, unknown>[]).map(mapSignalRow)
    }
    return (db.prepare('SELECT * FROM rebalance_signals ORDER BY timestamp DESC LIMIT ?').all(limit) as Record<string, unknown>[]).map(mapSignalRow)
  },

  findById(id: string): DbRebalanceSignal | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM rebalance_signals WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? mapSignalRow(row) : null
  },

  create(input: DbRebalanceSignalInput): DbRebalanceSignal {
    const db = getDb()
    const signal: DbRebalanceSignal = {
      id: generateId('sig'),
      timestamp: Date.now(),
      type: input.type,
      vaultId: input.vaultId ?? null,
      description: input.description,
      paramsJson: input.paramsJson ?? null,
      status: 'pending',
      riskScore: input.riskScore ?? null,
      riskNotes: input.riskNotes ?? null,
      createdBy: input.createdBy,
      approvedAt: null,
      executedAt: null,
    }
    db.prepare(`
      INSERT INTO rebalance_signals (id, timestamp, type, vault_id, description, params_json, status, risk_score, risk_notes, created_by, approved_at, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(signal.id, signal.timestamp, signal.type, signal.vaultId, signal.description, signal.paramsJson, signal.status, signal.riskScore, signal.riskNotes, signal.createdBy, signal.approvedAt, signal.executedAt)
    return signal
  },

  updateStatus(id: string, status: SignalStatus, riskScore?: number, riskNotes?: string): DbRebalanceSignal | null {
    const db = getDb()
    const existing = this.findById(id)
    if (!existing) return null

    const sets: string[] = ['status = ?']
    const vals: (string | number | null)[] = [status]

    if (status === 'approved') { sets.push('approved_at = ?'); vals.push(Date.now()) }
    if (status === 'executed') { sets.push('executed_at = ?'); vals.push(Date.now()) }
    if (riskScore !== undefined) { sets.push('risk_score = ?'); vals.push(riskScore) }
    if (riskNotes !== undefined) { sets.push('risk_notes = ?'); vals.push(riskNotes) }

    vals.push(id)
    db.prepare(`UPDATE rebalance_signals SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
    return this.findById(id)
  },
}

// Agent Logs Repository
export const AgentLogRepository = {
  findByAgent(agent: AgentName, limit = 50): DbAgentLog[] {
    const db = getDb()
    return (db.prepare('SELECT * FROM agent_logs WHERE agent = ? ORDER BY timestamp DESC LIMIT ?').all(agent, limit) as Record<string, unknown>[]).map(mapAgentLogRow)
  },

  findAll(limit = 100): DbAgentLog[] {
    const db = getDb()
    return (db.prepare('SELECT * FROM agent_logs ORDER BY timestamp DESC LIMIT ?').all(limit) as Record<string, unknown>[]).map(mapAgentLogRow)
  },

  latestByAgent(): Record<AgentName, DbAgentLog | null> {
    const agents: AgentName[] = ['watcher', 'strategy', 'audit']
    const result = {} as Record<AgentName, DbAgentLog | null>
    for (const agent of agents) {
      const logs = this.findByAgent(agent, 1)
      result[agent] = logs[0] ?? null
    }
    return result
  },

  create(input: DbAgentLogInput): DbAgentLog {
    const db = getDb()
    const log: DbAgentLog = {
      id: generateId('log'),
      agent: input.agent,
      timestamp: Date.now(),
      level: input.level,
      message: input.message,
      dataJson: input.dataJson ?? null,
    }
    db.prepare(`
      INSERT INTO agent_logs (id, agent, timestamp, level, message, data_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(log.id, log.agent, log.timestamp, log.level, log.message, log.dataJson)
    return log
  },
}

function mapSnapshotRow(row: Record<string, unknown>): DbMarketSnapshot {
  return {
    id: String(row.id),
    timestamp: Number(row.timestamp),
    btcPrice: Number(row.btc_price),
    btc24hChange: Number(row.btc_24h_change),
    btc7dChange: Number(row.btc_7d_change),
    usdcApy: Number(row.usdc_apy),
    usdtApy: Number(row.usdt_apy),
    btcApy: Number(row.btc_apy),
    miningHashprice: row.mining_hashprice != null ? Number(row.mining_hashprice) : null,
    fearGreed: Number(row.fear_greed),
    fearLabel: String(row.fear_label),
    notes: row.notes ? String(row.notes) : null,
  }
}

function mapSignalRow(row: Record<string, unknown>): DbRebalanceSignal {
  return {
    id: String(row.id),
    timestamp: Number(row.timestamp),
    type: String(row.type) as DbRebalanceSignal['type'],
    vaultId: row.vault_id ? String(row.vault_id) : null,
    description: String(row.description),
    paramsJson: row.params_json ? String(row.params_json) : null,
    status: String(row.status) as DbRebalanceSignal['status'],
    riskScore: row.risk_score != null ? Number(row.risk_score) : null,
    riskNotes: row.risk_notes ? String(row.risk_notes) : null,
    createdBy: String(row.created_by) as DbRebalanceSignal['createdBy'],
    approvedAt: row.approved_at != null ? Number(row.approved_at) : null,
    executedAt: row.executed_at != null ? Number(row.executed_at) : null,
  }
}

function mapAgentLogRow(row: Record<string, unknown>): DbAgentLog {
  return {
    id: String(row.id),
    agent: String(row.agent) as DbAgentLog['agent'],
    timestamp: Number(row.timestamp),
    level: String(row.level) as DbAgentLog['level'],
    message: String(row.message),
    dataJson: row.data_json ? String(row.data_json) : null,
  }
}

// ── Agent Config ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Record<string, string> = {
  btc_entry_price: '95000',
  profit_levels: JSON.stringify([
    { mult: 1.15, pct: 15 },
    { mult: 1.35, pct: 20 },
    { mult: 1.55, pct: 20 },
    { mult: 1.80, pct: 20 },
  ]),
  fear_greed_low: '20',
  fear_greed_high: '80',
  yield_drift_threshold: '2',
  allocation_drift_threshold: '5',
  max_btc_sell_pct: '20',
  watcher_interval_ms: '60000',
  strategy_interval_ms: '300000',
  audit_interval_ms: '600000',
  signal_cooldown_hours: JSON.stringify({
    TAKE_PROFIT: 24,
    YIELD_ROTATE: 12,
    REBALANCE: 48,
    INCREASE_BTC: 24,
    REDUCE_RISK: 6,
  }),
  strategy_prompt_extra: '',
  audit_prompt_extra: '',
  watcher_prompt_extra: '',
}

export class AgentConfigRepository {
  static getAll(): Record<string, string> {
    const db = getDb()
    const rows = db.prepare('SELECT key, value FROM agent_config').all() as Array<{ key: string; value: string }>
    const result: Record<string, string> = { ...DEFAULT_CONFIG }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }

  static get(key: string): string {
    const db = getDb()
    const row = db.prepare('SELECT value FROM agent_config WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? DEFAULT_CONFIG[key] ?? ''
  }

  static set(key: string, value: string): DbAgentConfig {
    const db = getDb()
    const now = Date.now()
    db.prepare(
      'INSERT INTO agent_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).run(key, value, now)
    return { key, value, updatedAt: now }
  }

  static setMany(entries: Record<string, string>): void {
    const db = getDb()
    const now = Date.now()
    const stmt = db.prepare(
      'INSERT INTO agent_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    )
    const tx = db.transaction(() => {
      for (const [key, value] of Object.entries(entries)) {
        stmt.run(key, value, now)
      }
    })
    tx()
  }

  static getDefaults(): Record<string, string> {
    return { ...DEFAULT_CONFIG }
  }
}
