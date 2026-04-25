/**
 * Centralized storage keys for localStorage
 * All keys must be defined here to avoid collisions and enable easy auditing
 */

export const STORAGE_KEYS = {
  // Admin
  ADMIN_SESSION: 'hearst:admin-session',

  // Vault
  VAULT_REGISTRY: 'hearst:vault-registry',
} as const

// Type for validation
export type StorageKey = keyof typeof STORAGE_KEYS
