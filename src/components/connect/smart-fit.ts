/**
 * Smart fitting utilities for responsive text and values
 */

import { useMemo } from 'react'

export type SmartFitMode = 'normal' | 'tight' | 'limit'

interface UseSmartFitOptions {
  tightHeight?: number
  limitHeight?: number
  tightWidth?: number
  limitWidth?: number
  reserveHeight?: number
  reserveWidth?: number
}

export function useSmartFit(options?: UseSmartFitOptions) {
  const { tightHeight = 740, limitHeight = 660, tightWidth = 940, limitWidth = 820 } = options || {}

  // Determine mode based on viewport dimensions (client-side only)
  const mode: SmartFitMode = useMemo(() => {
    if (typeof window === 'undefined') return 'normal'
    const h = window.innerHeight
    const w = window.innerWidth
    if (h < limitHeight || w < limitWidth) return 'limit'
    if (h < tightHeight || w < tightWidth) return 'tight'
    return 'normal'
  }, [tightHeight, limitHeight, tightWidth, limitWidth])

  const isLimit = mode === 'limit'
  const isTight = mode === 'tight'

  return {
    mode,
    isLimit,
    isTight,
    isNormal: !isLimit && !isTight,
  }
}

export function useShellPadding(mode?: SmartFitMode) {
  const effectiveMode = mode || 'normal'

  const values = {
    normal: { padding: 24, gap: 24 },
    tight: { padding: 16, gap: 16 },
    limit: { padding: 12, gap: 12 },
  }

  return values[effectiveMode]
}

type FitValueMapping<T = string> = {
  normal: T
  tight: T
  limit: T
}

/**
 * fitValue - Returns a value from the mapping based on the current mode
 */
export function fitValue<T extends string | number>(
  mode: SmartFitMode,
  mapping: FitValueMapping<T>
): T
/**
 * fitValue - Truncates a string/number based on mode (legacy API)
 */
export function fitValue(value: number | string, mode?: SmartFitMode): string
export function fitValue<T extends string | number>(
  modeOrValue: SmartFitMode | number | string,
  mappingOrMode?: FitValueMapping<T> | SmartFitMode
): T | string {
  // If first arg is a mode string and second is an object with normal/tight/limit, return mapping value
  if (
    typeof modeOrValue === 'string' &&
    ['normal', 'tight', 'limit'].includes(modeOrValue) &&
    mappingOrMode &&
    typeof mappingOrMode === 'object' &&
    'normal' in mappingOrMode
  ) {
    const mode = modeOrValue as SmartFitMode
    const mapping = mappingOrMode as FitValueMapping<T>
    return mapping[mode]
  }

  // Otherwise, first arg is value, second is mode (or undefined) - truncate string
  const str = String(modeOrValue)
  const mode = (typeof mappingOrMode === 'string' ? mappingOrMode : 'normal') as SmartFitMode
  
  if (mode === 'limit') return str.slice(0, 4)
  if (mode === 'tight') return str.slice(0, 6)
  return str
}
