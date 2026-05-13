'use client'

import { TOKENS } from './constants'
import { prefersReducedMotion } from '@/lib/reduced-motion'

type ActionButtonVariant = 'accent' | 'primary' | 'danger' | 'secondary'

interface ActionButtonProps {
  label: string
  variant: ActionButtonVariant
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
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
  disabled = false,
  loading = false,
  loadingLabel,
}: ActionButtonProps) {
  // Loading implies disabled — prevents double-submit during async work.
  const isInactive = disabled || loading
  const baseStyles: React.CSSProperties = {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    // md (≈12px) aligns this button with the admin button radius — connect
    // primary actions and admin actions look like the same product now.
    borderRadius: TOKENS.radius.md,
    fontSize: TOKENS.fontSizes.micro,
    fontWeight: TOKENS.fontWeights.black,
    textTransform: 'uppercase',
    letterSpacing: TOKENS.letterSpacing.wide,
    cursor: isInactive ? (loading ? 'wait' : 'not-allowed') : 'pointer',
    transition: TOKENS.transitions.fast,
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : loading ? 0.85 : 1,
    filter: disabled ? 'grayscale(0.5)' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing[2],
    ...variantStyles[variant],
  }

  const applyHover = (el: HTMLButtonElement) => {
    if (!isInactive && !prefersReducedMotion()) {
      el.style.transform = 'scale(1.05)'
    }
  }
  const resetHover = (el: HTMLButtonElement) => {
    el.style.transform = ''
  }

  const displayLabel = loading ? (loadingLabel ?? `${label}…`) : label

  return (
    <button
      onClick={isInactive ? undefined : onClick}
      disabled={isInactive}
      aria-disabled={isInactive}
      aria-busy={loading}
      style={baseStyles}
      onMouseEnter={(e) => applyHover(e.currentTarget)}
      onMouseLeave={(e) => resetHover(e.currentTarget)}
      onFocus={(e) => applyHover(e.currentTarget)}
      onBlur={(e) => resetHover(e.currentTarget)}
    >
      {loading && (
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: TOKENS.radius.full,
            border: `1.5px solid currentColor`,
            borderTopColor: 'transparent',
            animation: prefersReducedMotion() ? 'none' : 'ab-spin 0.8s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {displayLabel}
      <style jsx>{`
        @keyframes ab-spin { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}
