'use client'

import { useState, useCallback } from 'react'
import { TOKENS, VALUE_LETTER_SPACING } from './constants'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'

interface DockRadialProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
  isSimulation: boolean
}

type NavState = 'dashboard' | 'available' | 'simulation'

export function DockRadial({ selectedId, onSelect, isSimulation }: DockRadialProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Determine current state from routing
  const currentState: NavState = (() => {
    if (isSimulation) return 'simulation'
    if (selectedId === AVAILABLE_VAULTS_VIEW_ID) return 'available'
    if (selectedId?.startsWith('available-vault-')) return 'available'
    return 'dashboard'
  })()

  const handleNavClick = useCallback((state: NavState) => {
    switch (state) {
      case 'dashboard':
        onSelect(null)
        break
      case 'available':
        onSelect(AVAILABLE_VAULTS_VIEW_ID)
        break
      case 'simulation':
        onSelect(SIMULATION_VIEW_ID)
        break
    }
  }, [onSelect])

  const navItems = [
    { id: 'available' as const, label: 'Available' },
    { id: 'simulation' as const, label: 'Simulation' },
  ]

  const isDashboardActive = currentState === 'dashboard'

  return (
    <>
      {/* Left Footer Info */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        left: '32px',
        zIndex: 40,
        fontFamily: TOKENS.fonts.mono,
        fontSize: '10px',
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        v1.0.42
      </div>

      {/* Right Footer Info */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 40,
        fontFamily: TOKENS.fonts.mono,
        fontSize: '10px',
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        System Operational
      </div>

      {/* Main Dock Radial */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          background: TOKENS.colors.black,
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: '32px',
          padding: '6px',
          gap: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
      {/* Hearst Logo / Home Button */}
      <button
        onClick={() => handleNavClick('dashboard')}
        onMouseEnter={() => setHoveredId('logo')}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isDashboardActive ? 'rgba(255, 255, 255, 0.1)' : hoveredId === 'logo' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
          padding: 0, // Ensure no padding interferes with centering
        }}
        title="Dashboard"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="572.6 466.87 129.26 142.86"
          style={{
            width: '20px',
            height: '20px',
            color: isDashboardActive ? TOKENS.colors.accent : TOKENS.colors.white,
            transition: 'all 0.2s ease',
            display: 'block', // Force block display to prevent flexbox squishing
            margin: 'auto', // Ensure it centers perfectly
          }}
        >
          <polygon fill="currentColor" points="601.74 466.87 572.6 466.87 572.6 609.73 601.74 609.73 601.74 549.07 633.11 579.43 665.76 579.43 601.74 517.46 601.74 466.87" />
          <polygon fill="currentColor" points="672.72 466.87 672.72 528.12 644.63 500.93 611.98 500.93 672.72 559.72 672.72 609.73 701.86 609.73 701.86 466.87 672.72 466.87" />
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = currentState === item.id
          const isItemHovered = hoveredId === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                padding: '8px 16px',
                background: isActive ? 'rgba(255, 255, 255, 0.1)' : isItemHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isActive && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: TOKENS.colors.accent,
                    boxShadow: `0 0 8px ${TOKENS.colors.accent}`,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: VALUE_LETTER_SPACING,
                  color: isActive ? TOKENS.colors.white : TOKENS.colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
    </>
  )
}
