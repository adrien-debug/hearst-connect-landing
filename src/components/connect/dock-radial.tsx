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
          background: isDashboardActive ? 'rgba(255, 255, 255, 0.1)' : hoveredId === 'logo' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
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
              boxShadow: `0 0 8px ${TOKENS.colors.accent}`,
            }}
          />
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 130 143"
          style={{
            width: '18px',
            height: '18px',
            color: isDashboardActive ? TOKENS.colors.accent : TOKENS.colors.white,
            filter: isDashboardActive ? `drop-shadow(0 0 4px ${TOKENS.colors.accent}80)` : 'none',
            transition: 'all 0.2s ease',
            transform: isDashboardActive ? 'translateY(-2px)' : 'translateY(0)',
          }}
        >
          <polygon fill="currentColor" points="29.1,0 0,0 0,142.8 29.1,142.8 29.1,82.2 60.5,112.5 93.2,112.5 29.1,50.6 29.1,0" />
          <polygon fill="currentColor" points="100.1,0 100.1,61.2 72.0,34.0 39.4,34.0 100.1,92.8 100.1,142.8 129.3,142.8 129.3,0 100.1,0" />
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
