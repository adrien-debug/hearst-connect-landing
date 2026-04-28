'use client'

import { useDemoMode, setDemoMode } from '@/lib/demo/use-demo-mode'
import { useSiweAuth } from '@/hooks/useSiweAuth'

/** DemoToggle — Small chip that flips the app between live and demo data.
 * Bidirectional (the existing DemoBanner only handles "exit"); meant to live
 * in a chrome surface (canvas header, admin header) so a real user can drop
 * into demo for a screenshare without restarting the session.
 *
 * Visibility: only renders for wallets in the DEMO/ADMIN whitelist. Unauthorized
 * users don't see it at all — no "you can't" feedback, just a missing chip.
 * Authorization comes from the SIWE session (`isDemoAuthorized` claim).
 *
 * Visual states:
 *   - LIVE  (default): outline chip, accent dot, label "Switch to demo"
 *   - DEMO  (active):  filled accent chip, label "Demo · switch to live"
 */
export function DemoToggle({
  variant = 'compact',
  className,
}: {
  variant?: 'compact' | 'admin'
  className?: string
}) {
  const isDemo = useDemoMode()
  const { isDemoAuthorized, sessionChecked } = useSiweAuth()

  // Hide entirely for unauthorized wallets (and during the brief pre-session
  // check window so the chip doesn't flash before we know).
  if (!sessionChecked || !isDemoAuthorized) return null

  const handleClick = () => {
    setDemoMode(!isDemo)
  }

  const fontSize = variant === 'admin' ? 11 : 11
  const padY = variant === 'admin' ? 6 : 6
  const padX = variant === 'admin' ? 10 : 10

  const accentColor = 'var(--demo-accent, var(--hc-accent))'
  const borderColor = isDemo ? accentColor : 'var(--color-border-subtle, rgba(255,255,255,0.12))'
  const background = isDemo ? 'var(--hc-accent-glow, rgba(154,233,71,0.12))' : 'transparent'
  const textColor = isDemo ? accentColor : 'var(--hc-text-secondary, rgba(255,255,255,0.7))'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      aria-pressed={isDemo}
      title={isDemo ? 'Currently in demo mode — click to switch to live data' : 'Click to switch to demo mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: `${padY}px ${padX}px`,
        background,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        color: textColor,
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isDemo ? accentColor : 'var(--hc-text-ghost, rgba(255,255,255,0.4))',
          boxShadow: isDemo ? `0 0 6px ${accentColor}` : 'none',
        }}
      />
      {isDemo ? 'Demo · switch to live' : 'Switch to demo'}
    </button>
  )
}
