'use client'

/**
 * UI Primitives — Systematic, dimensionally rigorous components
 * All sizes, spacing, and positioning use design tokens exclusively
 */

import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react'

// ─────────────────────────────────────────────────────────────────
// TOKENS IMPORT (CSS custom properties)
// ─────────────────────────────────────────────────────────────────

import '@/styles/ui/tokens.css'

// ─────────────────────────────────────────────────────────────────
// TYPE UTILITIES
// ─────────────────────────────────────────────────────────────────

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'default' | 'accent' | 'ghost' | 'subtle'

// ─────────────────────────────────────────────────────────────────
// BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  variant?: Variant
  children: ReactNode
}

export function Button({
  size = 'md',
  variant = 'default',
  children,
  style,
  ...props
}: ButtonProps) {
  const sizeStyles: Record<Size, React.CSSProperties> = {
    xs: {
      height: 'var(--control-height-sm)',
      padding: '0 var(--space-2)',
      fontSize: 'var(--text-xs)',
    },
    sm: {
      height: 'var(--control-height-sm)',
      padding: '0 var(--space-3)',
      fontSize: 'var(--text-sm)',
    },
    md: {
      height: 'var(--control-height-md)',
      padding: '0 var(--space-4)',
      fontSize: 'var(--text-md)',
    },
    lg: {
      height: 'var(--control-height-lg)',
      padding: '0 var(--space-5)',
      fontSize: 'var(--text-base)',
    },
    xl: {
      height: 'var(--control-height-xl)',
      padding: '0 var(--space-6)',
      fontSize: 'var(--text-lg)',
    },
  }

  const variantStyles: Record<Variant, React.CSSProperties> = {
    default: {
      background: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-default)',
    },
    accent: {
      background: 'var(--color-accent-dim)',
      color: 'var(--color-accent)',
      border: '1px solid var(--color-accent)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
    subtle: {
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border-subtle)',
    },
  }

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        whiteSpace: 'nowrap',
        minWidth: 'var(--control-min-width)',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// INPUT COMPONENT
// ─────────────────────────────────────────────────────────────────

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  controlSize?: Exclude<Size, 'xs' | 'xl'>
}

export function Input({ controlSize = 'md', style, ...props }: InputProps) {
  const sizeStyles: Record<Exclude<Size, 'xs' | 'xl'>, React.CSSProperties> = {
    sm: {
      height: 'var(--control-height-sm)',
      padding: '0 var(--space-3)',
      fontSize: 'var(--text-sm)',
    },
    md: {
      height: 'var(--control-height-md)',
      padding: '0 var(--space-4)',
      fontSize: 'var(--text-md)',
    },
    lg: {
      height: 'var(--control-height-lg)',
      padding: '0 var(--space-4)',
      fontSize: 'var(--text-base)',
    },
  }

  return (
    <input
      style={{
        display: 'block',
        width: '100%',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--color-text-primary)',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-md)',
        outline: 'none',
        transition: 'all var(--transition-base)',
        ...sizeStyles[controlSize],
        ...style,
      }}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// CARD COMPONENT
// ─────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  padding?: Size
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, padding = 'md', style }: CardProps) {
  const paddingMap: Record<Size, string> = {
    xs: 'var(--space-2)',
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
    xl: 'var(--space-8)',
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: paddingMap[padding],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL COMPONENT (for sidebars, modals, overlays)
// ─────────────────────────────────────────────────────────────────

interface PanelProps {
  children: ReactNode
  width?: string
  position?: 'left' | 'right'
  style?: React.CSSProperties
}

export function Panel({ children, width = '320px', position = 'left', style }: PanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        [position]: 0,
        width,
        height: '100vh',
        background: 'var(--color-bg-primary)',
        borderRight: position === 'left' ? '1px solid var(--color-border-subtle)' : 'none',
        borderLeft: position === 'right' ? '1px solid var(--color-border-subtle)' : 'none',
        zIndex: 'var(--z-fixed)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// HEADER COMPONENT
// ─────────────────────────────────────────────────────────────────

interface HeaderProps {
  children: ReactNode
  height?: string
  sticky?: boolean
  style?: React.CSSProperties
}

export function Header({ children, height = '64px', sticky = false, style }: HeaderProps) {
  return (
    <header
      style={{
        height,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        background: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border-subtle)',
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 'var(--z-sticky)',
        ...style,
      }}
    >
      {children}
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────
// STAT BLOCK (for numbers, metrics)
// ─────────────────────────────────────────────────────────────────

interface StatBlockProps {
  label: string
  value: string
  delta?: string
  size?: Size
}

export function StatBlock({ label, value, delta, size = 'md' }: StatBlockProps) {
  const sizeMap: Record<Size, { value: string; label: string }> = {
    xs: { value: 'var(--text-lg)', label: 'var(--text-xs)' },
    sm: { value: 'var(--text-xl)', label: 'var(--text-xs)' },
    md: { value: 'var(--text-2xl)', label: 'var(--text-sm)' },
    lg: { value: 'var(--text-3xl)', label: 'var(--text-md)' },
    xl: { value: 'var(--text-4xl)', label: 'var(--text-lg)' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: sizeMap[size].value,
          fontWeight: 'var(--weight-black)',
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span
          style={{
            fontSize: sizeMap[size].label,
            fontWeight: 'var(--weight-bold)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </span>
        {delta && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-accent)',
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// LIST ITEM (for menus, sidebars)
// ─────────────────────────────────────────────────────────────────

interface ListItemProps {
  children: ReactNode
  selected?: boolean
  active?: boolean
  onClick?: () => void
}

export function ListItem({ children, selected, active, onClick }: ListItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        background: selected
          ? 'var(--color-state-selected)'
          : active
            ? 'var(--color-state-hover)'
            : 'transparent',
        border: 'none',
        borderLeft: selected ? '3px solid var(--color-accent)' : '3px solid transparent',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)',
        fontWeight: selected ? 'var(--weight-bold)' : 'var(--weight-medium)',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
      }}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// BADGE COMPONENT
// ─────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'accent' | 'subtle'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantStyles: Record<typeof variant, React.CSSProperties> = {
    default: {
      background: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-secondary)',
    },
    accent: {
      background: 'var(--color-accent-subtle)',
      color: 'var(--color-accent)',
    },
    subtle: {
      background: 'transparent',
      color: 'var(--color-text-tertiary)',
      border: '1px solid var(--color-border-subtle)',
    },
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--space-1) var(--space-2)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-bold)',
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        borderRadius: 'var(--radius-sm)',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: '1px',
        background: 'var(--color-border-subtle)',
        margin: 'var(--space-4) 0',
        ...style,
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// CONTAINER (responsive widths)
// ─────────────────────────────────────────────────────────────────

interface ContainerProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  style?: React.CSSProperties
}

export function Container({ children, size = 'lg', style }: ContainerProps) {
  const widthMap = {
    sm: 'var(--container-sm)',
    md: 'var(--container-md)',
    lg: 'var(--container-lg)',
    xl: 'var(--container-xl)',
    full: '100%',
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: widthMap[size],
        margin: '0 auto',
        padding: '0 var(--space-4)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// GRID (gap control)
// ─────────────────────────────────────────────────────────────────

interface GridProps {
  children: ReactNode
  columns?: number
  gap?: Size
  style?: React.CSSProperties
}

export function Grid({ children, columns = 2, gap = 'md', style }: GridProps) {
  const gapMap: Record<Size, string> = {
    xs: 'var(--space-2)',
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
    xl: 'var(--space-8)',
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: gapMap[gap],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// FLEX ROW (for toolbars, navigation)
// ─────────────────────────────────────────────────────────────────

interface FlexRowProps {
  children: ReactNode
  gap?: Size
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  style?: React.CSSProperties
}

export function FlexRow({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  style,
}: FlexRowProps) {
  const gapMap: Record<Size, string> = {
    xs: 'var(--space-1)',
    sm: 'var(--space-2)',
    md: 'var(--space-3)',
    lg: 'var(--space-4)',
    xl: 'var(--space-6)',
  }

  const justifyMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: align,
        justifyContent: justifyMap[justify],
        gap: gapMap[gap],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
