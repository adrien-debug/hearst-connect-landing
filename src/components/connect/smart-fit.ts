/**
 * Smart fitting utilities for responsive text and values
 */

import { useState, useEffect } from 'react'

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
  // Calibrated for: 1920x1080 → normal, 1440x900 → normal,
  // 1280x800 (MacBook 13") → tight, < 1024x720 → limit.
  const { tightHeight = 880, limitHeight = 720, tightWidth = 1300, limitWidth = 1024 } = options || {}

  // SSR/first paint: assume normal so admin/portfolio render with full layout
  // and recompute on mount.
  const [mode, setMode] = useState<SmartFitMode>('normal')

  useEffect(() => {
    function calculate() {
      const h = window.innerHeight
      const w = window.innerWidth
      if (h < limitHeight || w < limitWidth) return setMode('limit')
      if (h < tightHeight || w < tightWidth) return setMode('tight')
      setMode('normal')
    }
    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
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

export function fitValue<T extends string | number>(
  mode: SmartFitMode,
  mapping: FitValueMapping<T>
): T
export function fitValue(value: number | string, mode?: SmartFitMode): string
export function fitValue<T extends string | number>(
  modeOrValue: SmartFitMode | number | string,
  mappingOrMode?: FitValueMapping<T> | SmartFitMode
): T | string {
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

  const str = String(modeOrValue)
  const mode = (typeof mappingOrMode === 'string' ? mappingOrMode : 'normal') as SmartFitMode
  
  if (mode === 'limit') return str.slice(0, 4)
  if (mode === 'tight') return str.slice(0, 6)
  return str
}
