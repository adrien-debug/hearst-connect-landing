'use client'

import { useCallback, useState } from 'react'
import { SIMULATION_VIEW_ID } from './view-ids'
import { VAULTS, type VaultLine, aggregate, type Aggregate } from './data'

export function useConnectRouting() {
  const agg = aggregate(VAULTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isSimulation = selectedId === SIMULATION_VIEW_ID
  const selected =
    selectedId && !isSimulation
      ? (VAULTS.find((v) => v.id === selectedId) ?? null)
      : null

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  return {
    vaults: VAULTS,
    agg,
    selectedId,
    setSelectedId: select,
    selected: selected as VaultLine | null,
    isSimulation,
  }
}
