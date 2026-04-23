'use client'

import { TOKENS, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'

interface CockpitGaugeProps {
  label: string
  value: string
  valueCompact: string
  subtext: string
  mode: SmartFitMode
  primary?: boolean
  accent?: boolean
  active?: boolean
  align?: 'left' | 'center' | 'right'
  onClick?: () => void
}

export function CockpitGauge({
  label,
  value,
  valueCompact,
  subtext,
  mode,
  primary = false,
  accent = false,
  active = false,
  align = 'left',
  onClick,
}: CockpitGaugeProps) {
  const displayValue = mode === 'limit' ? valueCompact : value

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align,
        gap: TOKENS.spacing[2],
        cursor: onClick ? 'pointer' : 'default',
        padding: TOKENS.spacing[2],
        borderRadius: TOKENS.radius.md,
        background: active ? TOKENS.colors.accentSubtle : 'transparent',
        border: active ? `1px solid ${TOKENS.colors.accent}` : '1px solid transparent',
        transition: 'all 120ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (onClick && !active) {
          e.currentTarget.style.background = TOKENS.colors.bgTertiary
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: active ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fitValue(mode, {
          normal: primary ? TOKENS.fontSizes.xl : TOKENS.fontSizes.lg,
          tight: TOKENS.fontSizes.lg,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        lineHeight: LINE_HEIGHT.tight,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        fontFamily: primary ? TOKENS.fonts.mono : TOKENS.fonts.sans,
      }}>
        {displayValue}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: '0.02em',
      }}>
        {subtext}
      </div>
    </div>
  )
}
