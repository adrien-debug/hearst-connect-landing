/**
 * SQLite database connection singleton
 * Uses better-sqlite3 for synchronous, high-performance SQLite operations
 */

import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'

let db: Database.Database | null = null

/** Test-only: inject an in-memory DB so tests never touch production data */
export function _setTestDb(testDb: Database.Database): void {
  db = testDb
}

export function getDb(): Database.Database {
  if (db) return db

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data')
  try {
    mkdirSync(dataDir, { recursive: true })
  } catch (e) {
    console.error('[DB] Failed to create data directory:', e)
  }

  const dbPath = join(dataDir, 'hearst.db')

  try {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    console.log('[DB] Connected to SQLite at:', dbPath)
    return db
  } catch (e) {
    console.error('[DB] Failed to connect to SQLite:', e)
    throw e
  }
}

export function closeDb(): void {
  if (db) {
    try {
      db.close()
      console.log('[DB] Connection closed')
    } catch (e) {
      console.error('[DB] Error closing connection:', e)
    } finally {
      db = null
    }
  }
}

// Initialize database tables
export function initDb(): void {
  const database = getDb()

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      wallet_address TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
  `)

  // Vaults table (replaces localStorage vault-registry)
  database.exec(`
    CREATE TABLE IF NOT EXISTS vaults (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      vault_address TEXT NOT NULL,
      usdc_address TEXT NOT NULL,
      chain_id INTEGER NOT NULL,
      chain_name TEXT NOT NULL,
      apr REAL NOT NULL,
      target TEXT NOT NULL,
      lock_period_days INTEGER NOT NULL,
      min_deposit INTEGER NOT NULL,
      strategy TEXT NOT NULL,
      fees TEXT NOT NULL,
      risk TEXT NOT NULL,
      image TEXT,
      is_test INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vaults_active ON vaults(is_active);
  `)

  // User positions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_positions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vault_id TEXT NOT NULL,
      deposited INTEGER NOT NULL DEFAULT 0,
      claimed_yield INTEGER NOT NULL DEFAULT 0,
      accumulated_yield INTEGER NOT NULL DEFAULT 0,
      state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active', 'matured', 'withdrawn')),
      created_at INTEGER NOT NULL,
      maturity_date INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_positions_user ON user_positions(user_id);
    CREATE INDEX IF NOT EXISTS idx_positions_vault ON user_positions(vault_id);
    CREATE INDEX IF NOT EXISTS idx_positions_state ON user_positions(state);
  `)

  // Activity events table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      vault_id TEXT NOT NULL,
      vault_name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'claim', 'withdraw')),
      amount INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_events(timestamp);
  `)

  // Apply performance indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_vaults_address ON vaults(vault_address);
    CREATE INDEX IF NOT EXISTS idx_positions_user_vault ON user_positions(user_id, vault_id);
    CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_events(user_id, timestamp DESC);
  `)

  console.log('[DB] Tables and indexes initialized')
}
