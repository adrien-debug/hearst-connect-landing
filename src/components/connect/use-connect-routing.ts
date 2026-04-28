'use client'

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'
import { type VaultLine, type Aggregate } from './data'
import { useVaultLines } from '@/hooks/useVaultLines'

const VIEW_IDS: ReadonlySet<string> = new Set([SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID])

function readSelectionFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('vault') || params.get('view') || null
  } catch {
    return null
  }
}

/** selectionToSearch — Maps a selected id to the right query param. Special
 * view ids (simulation, available-vaults) live under `?view=`; everything
 * else (concrete vault / cohort ids) lives under `?vault=`. Empty selection
 * yields an empty search so the home URL stays clean. Exported for tests. */
export function selectionToSearch(id: string | null): string {
  if (!id) return ''
  const param = VIEW_IDS.has(id) ? 'view' : 'vault'
  return `?${param}=${encodeURIComponent(id)}`
}

/** currentSearch — Reads the live `?…` from window for diff comparison. */
function currentSearch(): string {
  if (typeof window === 'undefined') return ''
  return window.location.search
}

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
  const [selectedId, setSelectedIdState] = useState<string | null>(null)
  const { vaults, agg, hasVaults, isLoading } = useVaultLines()

  // Hydrate from URL on mount and react to browser back/forward. Both paths
  // funnel through the same sync function so deep-links AND popstate produce
  // identical state.
  useEffect(() => {
    const sync = () => setSelectedIdState(readSelectionFromUrl())
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const isSimulation = selectedId === SIMULATION_VIEW_ID
  const selected = useMemo(
    () =>
      selectedId && !isSimulation
        ? (vaults.find((v) => v.id === selectedId) ?? null)
        : null,
    [isSimulation, selectedId, vaults],
  )

  // setSelectedId — updates state and pushes a history entry so browser
  // back/forward can navigate. Skips pushState when the URL already matches
  // (e.g. initial hydration from popstate) to avoid duplicate stack entries.
  const select = useCallback((id: string | null) => {
    setSelectedIdState(id)
    if (typeof window === 'undefined') return
    const nextSearch = selectionToSearch(id)
    if (nextSearch === currentSearch()) return
    const url = `${window.location.pathname}${nextSearch}${window.location.hash}`
    window.history.pushState({}, '', url)
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
