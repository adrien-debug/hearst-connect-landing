'use client'

/**
 * Demo mode detection — gated by the SIWE session.
 *
 * Activation paths:
 *   - ?demo=true in URL (also persisted to localStorage)
 *   - localStorage["hc.demo"] === "1"
 *   - ?demo=off clears it.
 *
 * Authorization: a wallet must be in `process.env.DEMO_ADDRESSES` (or implicitly
 * in `ADMIN_ADDRESSES`) for `useDemoMode()` to actually return true. The flag
 * itself can be set by anyone, but it's silently revoked on the next mount if
 * the session lacks authorization. This keeps the demo surface internal to the
 * team without breaking the existing toggle UX for whitelisted users.
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'hc.demo'

/** Read the raw "demo flag intended" state — localStorage or URL param.
 * Does NOT check authorization. Use `useDemoMode()` for the gated boolean. */
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

function clearFlag() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

async function fetchDemoAuthorized(signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include', signal })
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data.isDemoAuthorized)
  } catch {
    return false
  }
}

export function useDemoMode(): boolean {
  // SSR returns false (no window). On the client we sync after mount to avoid
  // hydration mismatches; consumers must pair this with a loader gate.
  const [isDemo, setIsDemo] = useState<boolean>(false)

  useEffect(() => {
    const controller = new AbortController()

    const evaluate = async () => {
      persistFromUrl()
      const flagSet = isDemoModeSync()
      if (!flagSet) {
        setIsDemo(false)
        return
      }
      // Flag intended → check session authorization. An unauthorized wallet
      // (or no wallet at all) silently clears the flag so the next reload
      // doesn't show demo again.
      const authorized = await fetchDemoAuthorized(controller.signal)
      if (controller.signal.aborted) return
      if (authorized) {
        setIsDemo(true)
      } else {
        clearFlag()
        setIsDemo(false)
      }
    }

    void evaluate()

    // React to back/forward + manual storage tweaks. Re-evaluating runs the
    // auth check again so a wallet that just got whitelisted picks it up.
    const onPop = () => { void evaluate() }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) void evaluate()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('storage', onStorage)
    return () => {
      controller.abort()
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
    // Force consumers to re-read (and re-check auth for `on === true`).
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  } catch {
    // ignore
  }
}
