'use client'

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SIMULATION_VIEW_ID } from './view-ids'
import { type VaultLine, type Aggregate } from './data'
import { useVaultLines } from '@/hooks/useVaultLines'

interface ConnectRoutingContextValue {
  vaults: VaultLine[]
  agg: Aggregate
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  selected: VaultLine | null
  isSimulation: boolean
  hasVaults: boolean
  isLoading: boolean
}

const ConnectRoutingContext = createContext<ConnectRoutingContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { vaults, agg, hasVaults, isLoading } = useVaultLines()

  const isSimulation = selectedId === SIMULATION_VIEW_ID
  const selected = useMemo(
    () =>
      selectedId && !isSimulation
        ? (vaults.find((v) => v.id === selectedId) ?? null)
        : null,
    [isSimulation, selectedId, vaults],
  )

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const value = useMemo<ConnectRoutingContextValue>(
    () => ({
      vaults,
      agg,
      selectedId,
      setSelectedId: select,
      selected: selected as VaultLine | null,
      isSimulation,
      hasVaults,
      isLoading,
    }),
    [agg, hasVaults, isLoading, isSimulation, select, selected, selectedId, vaults],
  )

  return createElement(ConnectRoutingContext.Provider, { value }, children)
}

export function useConnectRouting() {
  const value = useContext(ConnectRoutingContext)

  if (!value) {
    throw new Error('useConnectRouting must be used within NavigationProvider')
  }

  return value
}
