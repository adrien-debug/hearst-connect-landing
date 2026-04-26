'use client'

import { TOKENS } from './constants'

interface DockRadialProps {
  onSelect: (id: string | null) => void
}

/** Bottom dock: fixed chrome. Center control always shows Hearst mark + home to portfolio (`onSelect(null)`). */
export function DockRadial({ onSelect }: DockRadialProps) {
  return (
    <>
      {/* Left Footer Info */}
      <div style={{
        position: 'fixed',
        bottom: TOKENS.spacing[8],
        left: TOKENS.spacing[8],
        zIndex: 40,
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
      }}>
        v1.0.42
      </div>

      {/* Right Footer Info */}
      <div style={{
        position: 'fixed',
        bottom: TOKENS.spacing[8],
        right: TOKENS.spacing[8],
        zIndex: 40,
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
      }}>
        System Operational
      </div>

      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-label="Retour au tableau de bord"
        style={{
          position: 'fixed',
          bottom: TOKENS.spacing[6],
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: TOKENS.dock.buttonSize,
          height: TOKENS.dock.buttonSize,
          borderRadius: TOKENS.radius.full,
          background: TOKENS.colors.accentSubtle,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          boxShadow: `0 0 22px ${TOKENS.colors.accentGlow}, 0 4px 20px ${TOKENS.colors.black}`,
        }}
        title="Tableau de bord"
      >
        {/* Official Hearst wordmark monogram (green HB from /logos/hearst-connect.svg); larger hit area reads clearer than 22px */}
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
    </>
  )
}
