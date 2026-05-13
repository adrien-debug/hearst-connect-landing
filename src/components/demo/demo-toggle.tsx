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
  className,
}: {
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
        gap: 'var(--space-1-5, 6px)',
        padding: 'var(--space-1-5, 6px) var(--space-2-5, 10px)',
        background,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        color: textColor,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--dashboard-font-size-xs)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--dashboard-letter-spacing-micro)',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 'var(--space-1-5, 6px)',
          height: 'var(--space-1-5, 6px)',
          borderRadius: 'var(--radius-full)',
          background: isDemo ? accentColor : 'var(--hc-text-ghost, rgba(255,255,255,0.4))',
          boxShadow: isDemo ? `0 0 var(--space-1-5, 6px) ${accentColor}` : 'none',
        }}
      />
      {isDemo ? 'Demo · switch to live' : 'Switch to demo'}
    </button>
  )
}
