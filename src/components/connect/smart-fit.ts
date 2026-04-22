'use client'

import { useEffect, useState } from 'react'

export type SmartFitMode = 'normal' | 'tight' | 'limit'

interface SmartFitOptions {
  tightHeight: number
  limitHeight: number
  tightWidth?: number
  limitWidth?: number
  reserveHeight?: number
  reserveWidth?: number
}

function resolveMode(width: number, height: number, options: SmartFitOptions): SmartFitMode {
  const availableWidth = Math.max(0, width - (options.reserveWidth ?? 0))
  const availableHeight = Math.max(0, height - (options.reserveHeight ?? 0))

  const isLimit =
    availableHeight <= options.limitHeight ||
    (options.limitWidth !== undefined && availableWidth <= options.limitWidth)
  if (isLimit) return 'limit'

  const isTight =
    availableHeight <= options.tightHeight ||
    (options.tightWidth !== undefined && availableWidth <= options.tightWidth)
  if (isTight) return 'tight'

  return 'normal'
}

export function useSmartFit(options: SmartFitOptions) {
  const [mode, setMode] = useState<SmartFitMode>(() => {
    if (typeof window === 'undefined') return 'normal'
    return resolveMode(window.innerWidth, window.innerHeight, options)
  })

  useEffect(() => {
    const update = () => {
      setMode(resolveMode(window.innerWidth, window.innerHeight, options))
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [
    options.limitHeight,
    options.limitWidth,
    options.tightHeight,
    options.tightWidth,
    options.reserveHeight,
    options.reserveWidth,
  ])

  return {
    mode,
    isTight: mode !== 'normal',
    isLimit: mode === 'limit',
  }
}

export function fitValue<T>(mode: SmartFitMode, values: Record<SmartFitMode, T>): T {
  return values[mode]
}
