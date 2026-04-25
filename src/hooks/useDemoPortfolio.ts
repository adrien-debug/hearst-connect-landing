'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import type { DemoPosition, DemoPortfolioStats, HydratedDemoPosition } from '@/types/demo'
import { 
  SYSTEM_DEMO_VAULTS, 
  hydrateDemoPosition, 
  computeDemoStats,
  getSystemDemoVaultById,
  calculateDemoYield 
} from '@/lib/demo-data'
import { STORAGE_KEYS } from '@/config/storage-keys'
import { MS_PER_DAY, MIN_CLAIMABLE_THRESHOLD } from '@/lib/constants'

interface DemoStore {
  positions: DemoPosition[]
  history: Array<{ id: string; timestamp: number; type: string; vaultId: string; vaultName: string; amount: number }>
  initialized: boolean
}

function loadStore(): DemoStore {
  if (typeof window === 'undefined') {
    return { positions: [], history: [], initialized: false }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEMO_PORTFOLIO)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { positions: [], history: [], initialized: false }
}

function saveStore(store: DemoStore) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.DEMO_PORTFOLIO, JSON.stringify(store))
  }
}

// Global store — SSR-safe: do not read localStorage at module init (client bundle would
// diverge from server). Hydrate inside useDemoPortfolio mount effect.
const EMPTY_DEMO_STORE: DemoStore = {
  positions: [],
  history: [],
  initialized: false,
}

let globalStore: DemoStore = { ...EMPTY_DEMO_STORE }
const listeners = new Set<() => void>()

function commitAndEmit() {
  globalStore = {
    ...globalStore,
    positions: [...globalStore.positions],
    history: [...globalStore.history],
  }
  saveStore(globalStore)
  listeners.forEach((l) => l())
}

function emit() {
  listeners.forEach((l) => l())
}

// Actions
export function seedDemoPortfolio(preset: 'demo' | 'conservative' | 'balanced' | 'aggressive' | 'ultra' = 'demo') {
  const now = Date.now()

  const templates: Record<string, Array<{ vaultId: string; amount: number; daysAgo: number }>> = {
    demo: [{ vaultId: 'demo-vault', amount: 10_000, daysAgo: 30 }],
    conservative: [{ vaultId: 'sys-prime', amount: 500_000, daysAgo: 60 }],
    balanced: [
      { vaultId: 'sys-prime', amount: 500_000, daysAgo: 90 },
      { vaultId: 'sys-growth', amount: 300_000, daysAgo: 30 },
    ],
    aggressive: [
      { vaultId: 'sys-prime', amount: 1_000_000, daysAgo: 120 },
      { vaultId: 'sys-growth', amount: 500_000, daysAgo: 45 },
      { vaultId: 'sys-yield', amount: 200_000, daysAgo: 15 },
    ],
    ultra: [
      { vaultId: 'sys-ultra', amount: 2_000_000, daysAgo: 90 },
      { vaultId: 'sys-prime', amount: 1_000_000, daysAgo: 60 },
    ],
  }

  const template = templates[preset] || templates.conservative

  const positions: DemoPosition[] = template.map((cfg) => {
    const vault = getSystemDemoVaultById(cfg.vaultId)!
    const createdAt = now - cfg.daysAgo * MS_PER_DAY
    const maturityDate = createdAt + vault.meta.lockPeriodDays * 24 * 60 * 60 * 1000

    return {
      id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      vaultId: cfg.vaultId,
      createdAt,
      deposited: cfg.amount,
      accumulatedYield: 0,
      claimedYield: 0,
      state: now > maturityDate ? 'matured' : 'active',
      maturityDate,
    }
  })

  const history = positions.map((pos) => {
    const vault = getSystemDemoVaultById(pos.vaultId)!
    return {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: pos.createdAt,
      type: 'deposit',
      vaultId: pos.vaultId,
      vaultName: vault.meta.name,
      amount: pos.deposited,
    }
  })

  globalStore = { positions, history, initialized: true }
  saveStore(globalStore)
  emit()
}

export function resetDemoPortfolio() {
  globalStore = { positions: [], history: [], initialized: false }
  saveStore(globalStore)
  emit()
}

function depositDemoPosition(vaultId: string, amount: number) {
  const vault = getSystemDemoVaultById(vaultId)
  if (!vault || amount <= 0) return

  const now = Date.now()
    const maturityDate = now + vault.meta.lockPeriodDays * MS_PER_DAY

  const existingIdx = globalStore.positions.findIndex((p) => p.vaultId === vaultId && p.state !== 'withdrawn')
  if (existingIdx >= 0) {
    globalStore.positions[existingIdx] = {
      ...globalStore.positions[existingIdx],
      deposited: globalStore.positions[existingIdx].deposited + amount,
    }
  } else {
    globalStore.positions = [
      ...globalStore.positions,
      {
        id: `pos-${now}-${Math.random().toString(36).slice(2, 7)}`,
        vaultId,
        createdAt: now,
        deposited: amount,
        accumulatedYield: 0,
        claimedYield: 0,
        state: 'active',
        maturityDate,
      },
    ]
  }

  globalStore.history = [
    {
      id: `act-${now}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now,
      type: 'deposit',
      vaultId,
      vaultName: vault.meta.name,
      amount,
    },
    ...globalStore.history,
  ]

  globalStore.initialized = true
  commitAndEmit()
}

function claimDemoYield(positionId: string): boolean {
  const idx = globalStore.positions.findIndex((p) => p.id === positionId)
  if (idx < 0) return false

  const position = globalStore.positions[idx]
  const vault = getSystemDemoVaultById(position.vaultId)
  if (!vault) return false

  const totalYield = calculateDemoYield(position)
  const claimable = totalYield - position.claimedYield
  if (claimable < MIN_CLAIMABLE_THRESHOLD) return false

  globalStore.positions = globalStore.positions.map((p, i) =>
    i === idx ? { ...p, claimedYield: totalYield, accumulatedYield: totalYield } : p
  )

  globalStore.history = [
    {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type: 'claim',
      vaultId: position.vaultId,
      vaultName: vault.meta.name,
      amount: claimable,
    },
    ...globalStore.history,
  ]

  commitAndEmit()
  return true
}

function withdrawDemoPosition(positionId: string): boolean {
  const idx = globalStore.positions.findIndex((p) => p.id === positionId)
  if (idx < 0) return false

  const position = globalStore.positions[idx]
  const vault = getSystemDemoVaultById(position.vaultId)
  if (!vault) return false
  if (Date.now() < position.maturityDate) return false

  const totalYield = calculateDemoYield(position)

  globalStore.positions = globalStore.positions.map((p, i) =>
    i === idx ? { ...p, claimedYield: totalYield, accumulatedYield: totalYield, state: 'withdrawn' as const } : p
  )

  globalStore.history = [
    {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type: 'withdraw',
      vaultId: position.vaultId,
      vaultName: vault.meta.name,
      amount: position.deposited + totalYield,
    },
    ...globalStore.history,
  ]

  commitAndEmit()
  return true
}

// Hook
export function useDemoPortfolio() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.add(listener)

    // Load existing store but DO NOT auto-seed
    // Demo data seeding must be explicit (via admin "Launch Demo Mode")
    globalStore = loadStore()
    emit()

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const hydratedPositions = useMemo(() => {
    return globalStore.positions.map(hydrateDemoPosition)
  }, [globalStore.positions])

  const stats = useMemo(() => {
    return computeDemoStats(globalStore.positions)
  }, [globalStore.positions])

  return {
    positions: globalStore.positions,
    hydratedPositions,
    history: globalStore.history,
    stats,
    isEmpty: globalStore.positions.length === 0,
    actions: {
      seed: useCallback(() => seedDemoPortfolio('demo'), []),
      reset: useCallback(() => resetDemoPortfolio(), []),
      deposit: useCallback((vaultId: string, amount: number) => depositDemoPosition(vaultId, amount), []),
      claim: useCallback((id: string): boolean => claimDemoYield(id), []),
      withdraw: useCallback((id: string): boolean => withdrawDemoPosition(id), []),
    },
  }
}

// System vaults
export function useSystemVaults() {
  return SYSTEM_DEMO_VAULTS
}
