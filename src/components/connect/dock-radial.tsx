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

  const isDashboardActive = currentState === 'dashboard'

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

      {/* Main Dock Radial */}
      <div
        style={{
          position: 'fixed',
          bottom: TOKENS.spacing[6],
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          background: TOKENS.colors.bgApp,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.xl,
          padding: TOKENS.spacing[1],
          gap: TOKENS.spacing[1],
          boxShadow: 'var(--hc-shadow-lg), 0 0 0 1px var(--hc-border-subtle)',
        }}
      >
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: TOKENS.spacing[1], alignItems: 'center' }}>
        {/* Available */}
        <NavButton
          id="available"
          label="Available"
          isActive={currentState === 'available'}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onClick={() => handleNavClick('available')}
        />

        {/* Divider */}
        <div style={{ width: TOKENS.borders.thin, height: '20px', background: TOKENS.colors.borderMain, margin: `0 ${TOKENS.spacing[1]}` }} />

        {/* Hearst Logo / Home Button */}
        <button
          onClick={() => handleNavClick('dashboard')}
          onMouseEnter={() => setHoveredId('logo')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: TOKENS.radius.full,
            background: isDashboardActive
              ? TOKENS.colors.accentSubtle
              : hoveredId === 'logo'
                ? TOKENS.colors.surfaceHover
                : 'transparent',
            border: isDashboardActive ? `1px solid ${TOKENS.colors.accent}` : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            padding: 0,
          }}
          title="Dashboard"
        >
          {/* Simple accent dot indicator */}
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
            xmlns="http://www.w3.org/2000/svg"
            viewBox="572.6 466.87 129.26 142.86"
            style={{
              width: '20px',
              height: '20px',
              color: isDashboardActive ? TOKENS.colors.accent : hoveredId === 'logo' ? TOKENS.colors.white : TOKENS.colors.textSecondary,
              transition: 'all 0.2s ease',
              display: 'block',
              margin: 'auto',
            }}
          >
            <polygon fill="currentColor" points="601.74 466.87 572.6 466.87 572.6 609.73 601.74 609.73 601.74 549.07 633.11 579.43 665.76 579.43 601.74 517.46 601.74 466.87" />
            <polygon fill="currentColor" points="672.72 466.87 672.72 528.12 644.63 500.93 611.98 500.93 672.72 559.72 672.72 609.73 701.86 609.73 701.86 466.87 672.72 466.87" />
          </svg>
        </button>

        {/* Divider */}
        <div style={{ width: TOKENS.borders.thin, height: '20px', background: TOKENS.colors.borderMain, margin: `0 ${TOKENS.spacing[1]}` }} />

        {/* Simulation */}
        <NavButton
          id="simulation"
          label="Simulation"
          isActive={currentState === 'simulation'}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onClick={() => handleNavClick('simulation')}
        />
      </div>

    </div>
    </>
  )
}

interface NavButtonProps {
  id: NavState
  label: string
  isActive: boolean
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
  onClick: () => void
}

function NavButton({ id, label, isActive, hoveredId, setHoveredId, onClick }: NavButtonProps) {
  const isHovered = hoveredId === id

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      style={{
        position: 'relative',
        padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
        background: isActive
          ? TOKENS.colors.surfaceActive
          : isHovered
            ? TOKENS.colors.surfaceHover
            : 'transparent',
        border: 'none',
        borderRadius: TOKENS.radius.xl,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '90px',
        overflow: 'hidden',
      }}
    >
      {/* Simple accent dot indicator */}
      {isActive && (
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

      {/* Label */}
      <span
        style={{
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: isActive ? TOKENS.fontWeights.black : TOKENS.fontWeights.medium,
          letterSpacing: VALUE_LETTER_SPACING,
          color: isActive ? TOKENS.colors.accent : isHovered ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
        }}
      >
        {label}
      </span>
    </button>
  )
}
