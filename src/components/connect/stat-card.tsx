'use client'

import { TOKENS, MONO, VALUE_LETTER_SPACING } from './constants'
import { fitValue, type SmartFitMode } from './smart-fit'

interface StatCardProps {
  label: string
  value: string
  subtext: string
  mode: SmartFitMode
  accent?: boolean
  size?: 'default' | 'compact'
}

export function StatCard({ 
  label, 
  value, 
  subtext, 
  mode, 
  accent = false,
  size = 'default'
}: StatCardProps) {
  const padding = size === 'compact' 
    ? fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] })
    : fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] })

  return (
    <div style={{
      background: TOKENS.colors.bgSecondary,
      borderRadius: TOKENS.radius.lg,
      padding,
    }}>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        fontFamily: MONO,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fitValue(mode, {
          normal: TOKENS.fontSizes.lg,
          tight: TOKENS.fontSizes.md,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textGhost,
        marginTop: TOKENS.spacing[2],
      }}>
        {subtext}
      </div>
    </div>
  )
}
