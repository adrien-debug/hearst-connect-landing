'use client'

import { useState } from 'react'
import { TOKENS } from './constants'

interface DockRadialProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  isSimulation: boolean
}

export function DockRadial({ selectedId, onSelect, isSimulation }: DockRadialProps) {
  const [hovered, setHovered] = useState(false)
  const isDashboardActive = !isSimulation && selectedId === null

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
        onClick={() => onSelect(null)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          bottom: TOKENS.spacing[6],
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          width: '48px',
          height: '48px',
          borderRadius: TOKENS.radius.full,
          background: isDashboardActive
            ? TOKENS.colors.accentSubtle
            : hovered
              ? TOKENS.colors.surfaceHover
              : TOKENS.colors.bgApp,
          border: `${TOKENS.borders.thin} solid ${isDashboardActive ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 4px 20px ${TOKENS.colors.black}`,
        }}
        title="Dashboard"
      >
        {isDashboardActive && (
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: TOKENS.colors.accent,
            }}
          />
        )}

        <svg
          viewBox="572.6 466.87 129.26 142.86"
          style={{
            width: '22px',
            height: '22px',
            color: isDashboardActive ? TOKENS.colors.accent : hovered ? TOKENS.colors.white : TOKENS.colors.textSecondary,
            transition: 'all 0.2s ease',
            display: 'block',
          }}
        >
          <polygon fill="currentColor" points="601.74 466.87 572.6 466.87 572.6 609.73 601.74 609.73 601.74 549.07 633.11 579.43 665.76 579.43 601.74 517.46 601.74 466.87" />
          <polygon fill="currentColor" points="672.72 466.87 672.72 528.12 644.63 500.93 611.98 500.93 672.72 559.72 672.72 609.73 701.86 609.73 701.86 466.87 672.72 466.87" />
        </svg>
      </button>
    </>
  )
}
