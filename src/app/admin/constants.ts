/**
 * Admin Design Tokens — Using global marketing design system
 * These use --color-* variables instead of --hc-* (Connect scope)
 */

export const ADMIN_TOKENS = {
  colors: {
    // Backgrounds
    bgApp: 'var(--color-bg-primary)',
    bgSidebar: 'var(--color-bg-secondary)',
    bgSurface: 'var(--color-bg-elevated)',
    bgTertiary: 'var(--color-bg-tertiary)',
    
    // Text
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textGhost: 'var(--color-text-ghost)',
    white: 'var(--color-text-primary)',
    black: 'var(--color-bg-primary)',
    
    // Accents
    accent: 'var(--color-accent)',
    accentHover: 'var(--color-accent-glow)',
    accentSubtle: 'var(--color-accent-subtle)',
    
    // Status
    danger: 'var(--color-error)',
    warning: 'var(--color-warning)',
    success: 'var(--color-success)',
    
    // Borders
    borderSubtle: 'var(--color-border-subtle)',
    borderDefault: 'var(--color-border-default)',
    borderStrong: 'var(--color-border-strong)',
  },
  fonts: {
    sans: "'Satoshi Variable', Inter, -apple-system, sans-serif",
    mono: "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace",
  },
  fontSizes: {
    micro: '11px',
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '40px',
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.12em',
    display: '0.2em',
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
}

export const MONO = ADMIN_TOKENS.fonts.mono

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtUsdCompact(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
