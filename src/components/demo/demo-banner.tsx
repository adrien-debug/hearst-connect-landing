'use client'

import { useDemoMode, setDemoMode } from '@/lib/demo/use-demo-mode'

export function DemoBanner() {
  const isDemo = useDemoMode()
  if (!isDemo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3, 12px)',
        padding: '6px var(--space-4, 16px)',
        background: 'linear-gradient(90deg, rgba(0,255,170,0.18), rgba(0,255,170,0.06))',
        borderBottom: '1px solid rgba(0,255,170,0.4)',
        color: 'var(--hc-text-primary, #fff)',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        backdropFilter: 'blur(6px)',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#00FFAA',
            boxShadow: '0 0 8px #00FFAA',
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
          marginLeft: 8,
          padding: '2px 8px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 4,
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
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
