'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { base } from 'wagmi/chains'
import type { VaultConfig, VaultConfigInput, VaultRegistryState } from '@/types/vault'

const STORAGE_KEY = 'hearst:vault-registry'

const SEED_VAULT: VaultConfig = {
  id: 'seed-hashvault-test',
  name: 'HashVault Test',
  description: 'Vault de test pour souscription',
  vaultAddress: '0x0000000000000000000000000000000000000001' as Address,
  usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  chain: base,
  apr: 8.5,
  target: '25%',
  lockPeriodDays: 180,
  minDeposit: 1000,
  strategy: 'Stablecoin Yield · Low Risk',
  fees: '1.0% Mgmt · 10% Perf',
  risk: 'Low',
  image: '/logos/hearst.svg',
  isActive: true,
  createdAt: Date.now(),
}

function generateVaultId(): string {
  return `vault-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getInitialState(): VaultRegistryState {
  return {
    vaults: [],
    activeVaultId: null,
  }
}

function loadFromStorage(): VaultRegistryState {
  if (typeof window === 'undefined') return getInitialState()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      const seeded: VaultRegistryState = {
        vaults: [SEED_VAULT],
        activeVaultId: SEED_VAULT.id,
      }
      saveToStorage(seeded)
      return seeded
    }

    const parsed = JSON.parse(stored) as VaultRegistryState

    return {
      ...getInitialState(),
      ...parsed,
      vaults: parsed.vaults?.map((v) => ({
        ...v,
        chain: v.chain,
      })) || [],
    }
  } catch (e) {
    console.error('[VaultRegistry] Corrupted storage, resetting:', e)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return getInitialState()
  }
}

function saveToStorage(state: VaultRegistryState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silent fail in SSR or if storage is full
  }
}

export function useVaultRegistry() {
  const queryClient = useQueryClient()

  const { data: state, isLoading } = useQuery<VaultRegistryState>({
    queryKey: ['vault-registry'],
    queryFn: loadFromStorage,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const currentState = state || getInitialState()

  const addVaultMutation = useMutation({
    mutationFn: async (input: VaultConfigInput): Promise<VaultConfig> => {
      // Re-read fresh state from storage to avoid race conditions
      const freshState = loadFromStorage()

      const newVault: VaultConfig = {
        ...input,
        id: input.id || generateVaultId(),
        createdAt: Date.now(),
        isActive: true,
      }

      const newState: VaultRegistryState = {
        vaults: [...freshState.vaults, newVault],
        activeVaultId: freshState.activeVaultId || newVault.id,
      }

      saveToStorage(newState)
      return newVault
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-registry'] })
    },
  })

  const removeVaultMutation = useMutation({
    mutationFn: async (vaultId: string): Promise<void> => {
      // Re-read fresh state from storage to avoid race conditions
      const freshState = loadFromStorage()

      const newVaults = freshState.vaults.filter((v) => v.id !== vaultId)
      const newActiveId =
        freshState.activeVaultId === vaultId
          ? newVaults[0]?.id || null
          : freshState.activeVaultId

      const newState: VaultRegistryState = {
        vaults: newVaults,
        activeVaultId: newActiveId,
      }

      saveToStorage(newState)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-registry'] })
    },
  })

  const setActiveVaultMutation = useMutation({
    mutationFn: async (vaultId: string | null): Promise<void> => {
      // Re-read fresh state from storage to avoid race conditions
      const freshState = loadFromStorage()

      const newState: VaultRegistryState = {
        ...freshState,
        activeVaultId: vaultId,
      }

      saveToStorage(newState)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-registry'] })
    },
  })

  const updateVaultMutation = useMutation({
    mutationFn: async ({
      vaultId,
      updates,
    }: {
      vaultId: string
      updates: Partial<VaultConfigInput>
    }): Promise<VaultConfig> => {
      // Re-read fresh state from storage to avoid race conditions
      const freshState = loadFromStorage()

      const vaultIndex = freshState.vaults.findIndex((v) => v.id === vaultId)
      if (vaultIndex === -1) {
        throw new Error(`Vault ${vaultId} not found`)
      }

      const updatedVault: VaultConfig = {
        ...freshState.vaults[vaultIndex],
        ...updates,
      }

      const newVaults = [...freshState.vaults]
      newVaults[vaultIndex] = updatedVault

      const newState: VaultRegistryState = {
        ...freshState,
        vaults: newVaults,
      }

      saveToStorage(newState)
      return updatedVault
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-registry'] })
    },
  })

  const activeVault = currentState.activeVaultId
    ? currentState.vaults.find((v) => v.id === currentState.activeVaultId)
    : null

  const activeVaults = currentState.vaults.filter((v) => v.isActive)

  return {
    vaults: currentState.vaults,
    activeVaults,
    activeVaultId: currentState.activeVaultId,
    activeVault,
    isLoading,
    hasVaults: currentState.vaults.length > 0,
    addVault: addVaultMutation.mutateAsync,
    removeVault: removeVaultMutation.mutateAsync,
    setActiveVault: setActiveVaultMutation.mutateAsync,
    updateVault: updateVaultMutation.mutateAsync,
    isAdding: addVaultMutation.isPending,
    isRemoving: removeVaultMutation.isPending,
    isUpdating: updateVaultMutation.isPending,
  }
}

export function useVaultByAddress(vaultAddress?: Address) {
  const { vaults } = useVaultRegistry()

  return vaultAddress
    ? vaults.find((v) => v.vaultAddress.toLowerCase() === vaultAddress.toLowerCase()) || null
    : null
}

export function useVaultById(vaultId?: string) {
  const { vaults } = useVaultRegistry()

  return vaultId ? vaults.find((v) => v.id === vaultId) || null : null
}
