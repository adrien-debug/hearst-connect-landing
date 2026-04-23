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
    { id: 'dashboard' as const, label: 'Dashboard' },
    { id: 'available' as const, label: 'Available' },
    { id: 'simulation' as const, label: 'Simulation' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(10, 10, 10, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          background: hoveredId === 'logo' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        title="Home"
      >
        <svg
          viewBox="572.6 466.9 129.3 142.8"
          style={{
            width: '18px',
            height: '18px',
            fill: TOKENS.colors.accent,
            filter: `drop-shadow(0 0 4px ${TOKENS.colors.accent}80)`,
          }}
        >
          <polygon points="601.7 466.9 572.6 466.9 572.6 609.7 601.7 609.7 601.7 549.1 633.1 579.4 665.8 579.4 601.7 517.5 601.7 466.9" />
          <polygon points="672.7 466.9 672.7 528.1 644.6 500.9 612 500.9 672.7 559.7 672.7 609.7 701.9 609.7 701.9 466.9 672.7 466.9" />
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
  )
}
