'use client'

import { TOKENS } from './constants'

type ActionButtonVariant = 'accent' | 'primary' | 'danger' | 'secondary'

interface ActionButtonProps {
  label: string
  variant: ActionButtonVariant
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
}

const variantStyles: Record<ActionButtonVariant, React.CSSProperties> = {
  accent: {
    background: TOKENS.colors.accent,
    color: TOKENS.colors.black,
    border: 'none',
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
    background: 'rgba(var(--color-error-rgb, 239,68,68), 0.08)',
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
    borderRadius: TOKENS.radius.sm,
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

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {label}
    </button>
  )
}
