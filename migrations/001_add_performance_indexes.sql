-- Migration: Add performance indexes
-- Date: 2026-04-25
-- Description: Add missing indexes for query performance optimization

-- Index on vaults.vault_address for faster address lookups
CREATE INDEX IF NOT EXISTS idx_vaults_address ON vaults(vault_address);

-- Index on user_positions(user_id, vault_id) for faster position queries
CREATE INDEX IF NOT EXISTS idx_positions_user_vault ON user_positions(user_id, vault_id);

-- Index on activity_events(user_id, timestamp DESC) for faster activity queries
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_events(user_id, timestamp DESC);

-- Index on user_positions.state for filtering active positions
CREATE INDEX IF NOT EXISTS idx_positions_state ON user_positions(state);
