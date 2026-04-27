'use client'

import { TOKENS } from './constants'

/** CardAction — Ghost button for panel header "View All" style actions. */
interface CardActionProps {
  label: string
  onClick?: () => void
}

export function CardAction({ label, onClick }: CardActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
        background: 'transparent',
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        borderRadius: TOKENS.radius.md,
        color: TOKENS.colors.textGhost,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
        height: 'var(--dashboard-control-height-sm)',
        display: 'flex',
        alignItems: 'center',
        transition: `all ${TOKENS.animation.durationFast} ${TOKENS.animation.easeSharp}`,
      }}
    >
      {label}
    </button>
  )
}
