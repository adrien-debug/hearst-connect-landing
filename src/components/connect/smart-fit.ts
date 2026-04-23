'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { SIDEBAR_WIDTH_PX, SIDEBAR_WIDTH_NARROW_PX, SHELL_PADDING, SHELL_GAP } from './constants'

export type SmartFitMode = 'normal' | 'tight' | 'limit'

/** Matches sidebar column in `sidebar.tsx` for header/main alignment. */
export function getSidebarWidthPx(mode: SmartFitMode): number {
  return mode === 'limit' ? SIDEBAR_WIDTH_NARROW_PX : SIDEBAR_WIDTH_PX
}

interface SmartFitOptions {
  tightHeight: number
  limitHeight: number
  tightWidth?: number
  limitWidth?: number
  /** Viewport &lt; this → `tight` (unless height forces `limit`). Aligned with CSS @media (width < 930px) */
  midBreakpoint?: number
  /** Viewport &lt; this (with mid) → stricter `tight` / `limit` heuristics. Aligned with CSS @media (width < 768px) */
  narrowBreakpoint?: number
  reserveHeight?: number
  reserveWidth?: number
}

function resolveMode(width: number, height: number, options: SmartFitOptions): SmartFitMode {
  const availableWidth = Math.max(0, width - (options.reserveWidth ?? 0))
  const availableHeight = Math.max(0, height - (options.reserveHeight ?? 0))
  // Aligned with CSS breakpoints: 768px (mobile), 930px (tablet)
  const mid = options.midBreakpoint ?? 930
  const narrow = options.narrowBreakpoint ?? 768
  const heightCrisis = availableHeight <= options.limitHeight
  const heightTight = availableHeight <= options.tightHeight

  /** &lt;768px: smallest shell — limit if vertical space is also constrained, else tight */
  if (width < narrow) {
    if (heightCrisis) return 'limit'
    return 'tight'
  }

  /** 768–930: compact but not always limit */
  if (width < mid) {
    if (heightCrisis) return 'limit'
    return 'tight'
  }

  const isLimit = heightCrisis || (options.limitWidth !== undefined && availableWidth <= options.limitWidth)
  if (isLimit) return 'limit'

  const isTight = heightTight || (options.tightWidth !== undefined && availableWidth <= options.tightWidth)
  if (isTight) return 'tight'

  return 'normal'
}

export function useSmartFit(options: SmartFitOptions) {
  // Start with 'normal' for SSR, then calculate real mode after hydration
  const [mode, setMode] = useState<SmartFitMode>('normal')
  const [isHydrated, setIsHydrated] = useState(false)

  // Throttle resize updates to 60fps (16ms)
  const rafRef = useRef<number | null>(null)
  const lastModeRef = useRef<SmartFitMode>('normal')

  useEffect(() => {
    // Mark as hydrated and calculate initial mode
    setIsHydrated(true)

    const update = () => {
      const newMode = resolveMode(window.innerWidth, window.innerHeight, options)
      if (newMode !== lastModeRef.current) {
        lastModeRef.current = newMode
        setMode(newMode)
      }
    }

    const throttledUpdate = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        update()
        rafRef.current = null
      })
    }

    // Calculate initial mode
    update()
    window.addEventListener('resize', throttledUpdate)
    return () => {
      window.removeEventListener('resize', throttledUpdate)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [
    options.limitHeight,
    options.limitWidth,
    options.tightHeight,
    options.tightWidth,
    options.reserveHeight,
    options.reserveWidth,
    options.midBreakpoint,
    options.narrowBreakpoint,
  ])

  return {
    mode,
    isTight: mode !== 'normal',
    isLimit: mode === 'limit',
    /** Sidebar lists & metadata: same idea as pre-refactor `isCompactBottom` */
    isCompactBottom: mode !== 'normal',
    /** Whether hydration has completed - useful for avoiding SSR mismatches */
    isHydrated,
  }
}

export function fitValue<T>(mode: SmartFitMode, values: Record<SmartFitMode, T>): T {
  return values[mode]
}

/** Unified shell padding hook for consistent panel layouts */
export function useShellPadding(mode: SmartFitMode) {
  return useMemo(
    () => ({
      padding: SHELL_PADDING[mode],
      gap: SHELL_GAP[mode],
    }),
    [mode]
  )
}

/** Unified shell style object for panels */
export function getShellStyle(mode: SmartFitMode) {
  return {
    padding: `${SHELL_PADDING[mode]} ${SHELL_PADDING[mode]}`,
    gap: SHELL_GAP[mode],
  } as const
}
