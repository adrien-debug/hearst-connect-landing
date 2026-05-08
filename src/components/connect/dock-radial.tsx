'use client'

import { TOKENS } from './constants'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'

interface DockRadialProps {
  onSelect: (id: string | null) => void
  /** Currently active selection — used to highlight the matching dock target.
   * `null` means we're on the portfolio (home). */
  activeId?: string | null
}

/** Bottom dock — fixed chrome with three navigation targets:
 *   [Invest]  [Home]  [Simulate]
 * The center button (Hearst mark) always returns to the portfolio. The two
 * satellites jump straight into the Available Vaults list and the Simulation
 * panel — historically reachable only via in-panel CTAs which made them
 * dead ends once you'd left them. The active satellite gets an accent ring. */
export function DockRadial({ onSelect, activeId = null }: DockRadialProps) {
  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: TOKENS.spacing[8],
        left: TOKENS.spacing[8],
        zIndex: TOKENS.zIndex.dock,
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
      }}>
        v1.0.42
      </div>

      <div style={{
        position: 'fixed',
        bottom: TOKENS.spacing[8],
        right: TOKENS.spacing[8],
        zIndex: TOKENS.zIndex.dock,
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
      }}>
        System Operational
      </div>

      <div
        role="navigation"
        aria-label="Primary navigation"
        style={{
          position: 'fixed',
          bottom: TOKENS.spacing[6],
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: TOKENS.zIndex.dockActive,
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[3],
        }}
      >
        <DockSatellite
          label="Invest"
          ariaLabel="Browse available vaults"
          onClick={() => onSelect(AVAILABLE_VAULTS_VIEW_ID)}
          isActive={activeId === AVAILABLE_VAULTS_VIEW_ID}
          icon={
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
              <path d="M12 5v14" strokeLinecap="round" />
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
          }
        />

        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Portfolio"
          aria-current={activeId === null ? 'page' : undefined}
          style={{
            width: TOKENS.dock.buttonSize,
            height: TOKENS.dock.buttonSize,
            borderRadius: TOKENS.radius.full,
            background: TOKENS.colors.black,
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `opacity ${TOKENS.transitions.durBase}, transform ${TOKENS.transitions.durBase}`,
          }}
          title="Portfolio"
        >
          <svg
            viewBox="572.6 466.87 129.26 142.86"
            width={26}
            height={26}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            style={{
              width: TOKENS.dock.logoSize,
              height: TOKENS.dock.logoSize,
              color: TOKENS.colors.accent,
              display: 'block',
              flexShrink: 0,
            }}
          >
            <polygon fill="currentColor" points="601.74 466.87 572.6 466.87 572.6 609.73 601.74 609.73 601.74 549.07 633.11 579.43 665.76 579.43 601.74 517.46 601.74 466.87" />
            <polygon fill="currentColor" points="672.72 466.87 672.72 528.12 644.63 500.93 611.98 500.93 672.72 559.72 672.72 609.73 701.86 609.73 701.86 466.87 672.72 466.87" />
          </svg>
        </button>

        <DockSatellite
          label="Simulate"
          ariaLabel="Open simulation"
          onClick={() => onSelect(SIMULATION_VIEW_ID)}
          isActive={activeId === SIMULATION_VIEW_ID}
          icon={
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
              <path d="M3 17l5-5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>
    </>
  )
}

function DockSatellite({
  label,
  ariaLabel,
  icon,
  isActive,
  onClick,
}: {
  label: string
  ariaLabel: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={isActive ? 'page' : undefined}
      title={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: TOKENS.radius.full,
        background: isActive ? TOKENS.colors.accentSubtle : TOKENS.colors.black,
        border: `${TOKENS.borders.thin} solid ${isActive ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
        color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `color ${TOKENS.transitions.durFast}, border-color ${TOKENS.transitions.durFast}, background ${TOKENS.transitions.durFast}`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = TOKENS.colors.accent
          e.currentTarget.style.borderColor = TOKENS.colors.accent
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = TOKENS.colors.textSecondary
          e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
        }
      }}
    >
      {icon}
    </button>
  )
}
