'use client'

import { TOKENS } from './constants'
import { prefersReducedMotion } from '@/lib/reduced-motion'

type ActionButtonVariant = 'accent' | 'primary' | 'danger' | 'secondary'

interface ActionButtonProps {
  label: string
  variant: ActionButtonVariant
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
}

const variantStyles: Record<ActionButtonVariant, React.CSSProperties> = {
  accent: {
    background: TOKENS.colors.accentSubtle,
    color: TOKENS.colors.accent,
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
  },
  primary: {
    background: TOKENS.colors.accentSubtle,
    color: TOKENS.colors.accent,
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
  },
  secondary: {
    background: TOKENS.colors.bgTertiary,
    color: TOKENS.colors.textPrimary,
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
  },
  danger: {
    background: TOKENS.colors.dangerDim,
    color: TOKENS.colors.danger,
    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.danger}`,
  },
}

export function ActionButton({ 
  label, 
  variant, 
  onClick,
  disabled = false
}: ActionButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    // md (≈12px) aligns this button with the admin button radius — connect
    // primary actions and admin actions look like the same product now.
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.wide,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: TOKENS.transitions.fast,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
    filter: disabled ? 'grayscale(0.5)' : undefined,
    ...variantStyles[variant],
  }

  const applyHover = (el: HTMLButtonElement) => {
    if (!disabled && !prefersReducedMotion()) {
      el.style.transform = 'scale(1.05)'
    }
  }
  const resetHover = (el: HTMLButtonElement) => {
    el.style.transform = ''
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      style={baseStyles}
      onMouseEnter={(e) => applyHover(e.currentTarget)}
      onMouseLeave={(e) => resetHover(e.currentTarget)}
      onFocus={(e) => applyHover(e.currentTarget)}
      onBlur={(e) => resetHover(e.currentTarget)}
    >
      {label}
    </button>
  )
}
