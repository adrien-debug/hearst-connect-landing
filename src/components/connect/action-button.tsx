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
    border: `1px solid ${TOKENS.colors.accent}`,
  },
  secondary: {
    background: TOKENS.colors.bgTertiary,
    color: TOKENS.colors.textPrimary,
    border: `1px solid ${TOKENS.colors.borderSubtle}`,
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: TOKENS.colors.danger,
    border: `1px solid ${TOKENS.colors.danger}`,
  },
}

export function ActionButton({ 
  label, 
  variant, 
  onClick,
  disabled = false
}: ActionButtonProps) {
  const baseStyles: React.CSSProperties = {
    padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
    borderRadius: TOKENS.radius.sm,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 100ms ease-out',
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
