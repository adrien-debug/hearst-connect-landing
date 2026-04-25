'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VaultConfig, VaultConfigInput } from '@/types/vault'
import { VaultsApi, dbVaultToConfig } from '@/lib/api-client'
import type { DbVaultInput } from '@/lib/db/schema'

const VAULT_REGISTRY_QUERY_KEY = 'vault-registry'

// Convert VaultConfigInput to DbVaultInput for API
function toDbVaultInput(input: VaultConfigInput): DbVaultInput {
  return {
    name: input.name,
    description: input.description,
    vaultAddress: input.vaultAddress,
    usdcAddress: input.usdcAddress,
    chainId: input.chain.id,
    chainName: input.chain.name,
    apr: input.apr,
    target: input.target,
    lockPeriodDays: input.lockPeriodDays,
    minDeposit: input.minDeposit,
    strategy: input.strategy,
    fees: input.fees,
    risk: input.risk,
    image: input.image,
    isActive: true,
  }
}

export function useVaultRegistry() {
  const queryClient = useQueryClient()

  // Fetch vaults from backend API
  const { data: dbVaults = [], isLoading } = useQuery({
    queryKey: [VAULT_REGISTRY_QUERY_KEY],
    queryFn: async () => {
      const result = await VaultsApi.list(true) // active only
      return result.vaults
    },
    staleTime: 1000 * 30, // 30 seconds
  })

  // Convert DbVault[] to VaultConfig[]
  const vaults: VaultConfig[] = dbVaults.map(dbVaultToConfig)
  const activeVaults = vaults.filter((v) => v.isActive)

  // Local state for activeVaultId (remains client-side preference)
  const { data: activeVaultId = null } = useQuery<string | null>({
    queryKey: [VAULT_REGISTRY_QUERY_KEY, 'active'],
    queryFn: () => null,
    staleTime: Infinity,
  })

  const activeVault = activeVaultId ? vaults.find((v) => v.id === activeVaultId) || activeVaults[0] || null : activeVaults[0] || null

  const addVaultMutation = useMutation({
    mutationFn: async (input: VaultConfigInput): Promise<VaultConfig> => {
      const dbInput = toDbVaultInput(input)
      const result = await VaultsApi.create(dbInput)
      return dbVaultToConfig(result.vault)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VAULT_REGISTRY_QUERY_KEY] })
    },
  })

  const removeVaultMutation = useMutation({
    mutationFn: async (vaultId: string): Promise<void> => {
      await VaultsApi.delete(vaultId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VAULT_REGISTRY_QUERY_KEY] })
    },
  })

  const setActiveVaultMutation = useMutation({
    mutationFn: async (vaultId: string | null): Promise<void> => {
      // This is just client-side preference now, no API call needed
      queryClient.setQueryData([VAULT_REGISTRY_QUERY_KEY, 'active'], vaultId)
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
      // Convert partial updates to DbVaultInput format
      const dbUpdates: Partial<DbVaultInput> = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.apr !== undefined) dbUpdates.apr = updates.apr
      if (updates.target !== undefined) dbUpdates.target = updates.target
      if (updates.lockPeriodDays !== undefined) dbUpdates.lockPeriodDays = updates.lockPeriodDays
      if (updates.minDeposit !== undefined) dbUpdates.minDeposit = updates.minDeposit
      if (updates.strategy !== undefined) dbUpdates.strategy = updates.strategy
      if (updates.fees !== undefined) dbUpdates.fees = updates.fees
      if (updates.risk !== undefined) dbUpdates.risk = updates.risk
      if (updates.image !== undefined) dbUpdates.image = updates.image

      const result = await VaultsApi.update(vaultId, dbUpdates)
      return dbVaultToConfig(result.vault)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VAULT_REGISTRY_QUERY_KEY] })
    },
  })

  return {
    vaults,
    activeVaults,
    activeVaultId,
    activeVault,
    isLoading,
    hasVaults: vaults.length > 0,
    addVault: addVaultMutation.mutateAsync,
    removeVault: removeVaultMutation.mutateAsync,
    setActiveVault: setActiveVaultMutation.mutateAsync,
    updateVault: updateVaultMutation.mutateAsync,
    isAdding: addVaultMutation.isPending,
    isRemoving: removeVaultMutation.isPending,
    isUpdating: updateVaultMutation.isPending,
  }
}

export function useVaultById(vaultId?: string) {
  const { vaults } = useVaultRegistry()

  return vaultId ? vaults.find((v) => v.id === vaultId) || null : null
}
