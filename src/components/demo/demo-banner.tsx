'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useDemoMode, setDemoMode } from '@/lib/demo/use-demo-mode'

const BANNER_HEIGHT = 28 // px

export function DemoBanner() {
  const isDemo = useDemoMode()
  const pathname = usePathname()
  // Only show on app/admin surfaces — keep the marketing landing clean.
  const isMarketingRoute = pathname === '/' || pathname?.startsWith('/(marketing)')
  const visible = isDemo && !isMarketingRoute

  // Reserve space at the top of the viewport so the banner never overlaps app chrome.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.style.setProperty('--demo-banner-h', visible ? `${BANNER_HEIGHT}px` : '0px')
    if (visible) {
      root.dataset.demoBanner = 'on'
    } else {
      delete root.dataset.demoBanner
    }
    return () => {
      root.style.setProperty('--demo-banner-h', '0px')
      delete root.dataset.demoBanner
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `${BANNER_HEIGHT}px`,
        zIndex: 'var(--z-banner)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        padding: '0 var(--space-4)',
        background: 'linear-gradient(90deg, rgba(var(--demo-accent-rgb), 0.18), rgba(var(--demo-accent-rgb), 0.06))',
        borderBottom: '1px solid rgba(var(--demo-accent-rgb), 0.4)',
        color: 'var(--hc-text-primary, #fff)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--dashboard-font-size-xs)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--dashboard-letter-spacing-caption)',
        textTransform: 'uppercase',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 'var(--dashboard-radius-badge)',
            background: 'var(--demo-accent)',
            boxShadow: '0 0 8px var(--demo-accent)',
            animation: 'demoPulse 2s ease-in-out infinite',
          }}
        />
        Demo Mode — sample data, no real transactions
      </span>
      <button
        type="button"
        onClick={() => {
          setDemoMode(false)
          if (typeof window !== 'undefined') window.location.href = '/'
        }}
        style={{
          marginLeft: 'var(--space-2)',
          padding: 'var(--space-0) var(--space-2)',
          background: 'transparent',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-sm)',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'var(--dashboard-text-dense-xs)',
          fontWeight: 'var(--weight-bold)',
          letterSpacing: 'var(--dashboard-letter-spacing-caption)',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Exit
      </button>
      <style>{`@keyframes demoPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
    </div>
  )
}
