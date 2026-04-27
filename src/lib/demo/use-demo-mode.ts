'use client'

/**
 * Demo mode detection.
 * Activated by:
 *   - ?demo=true in URL (also persisted to localStorage)
 *   - localStorage["hc.demo"] === "1"
 *   - ?demo=off clears it.
 *
 * Lives outside React Query so any hook can read a fresh, sync value.
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'hc.demo'

export function isDemoModeSync(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return true
    const params = new URLSearchParams(window.location.search)
    const v = params.get('demo')
    if (v === 'true' || v === '1') return true
  } catch {
    // ignore (private mode, etc.)
  }
  return false
}

function persistFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('demo')
    if (v === 'true' || v === '1') {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } else if (v === 'off' || v === 'false' || v === '0') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function useDemoMode(): boolean {
  // SSR returns false (no window). On the client we sync after mount to avoid
  // hydration mismatches; consumers must pair this with a loader gate.
  const [isDemo, setIsDemo] = useState<boolean>(false)

  useEffect(() => {
    persistFromUrl()
    setIsDemo(isDemoModeSync())

    // React to back/forward + manual storage tweaks.
    const onPop = () => {
      persistFromUrl()
      setIsDemo(isDemoModeSync())
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setIsDemo(isDemoModeSync())
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return isDemo
}

export function setDemoMode(on: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, '1')
    else window.localStorage.removeItem(STORAGE_KEY)
    // Force consumers to re-read.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  } catch {
    // ignore
  }
}
