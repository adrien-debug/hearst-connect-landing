/** Cinematic Financial OS — source of truth for connect scope. Keep `dashboard-vars.css` in sync. */

export const TOKENS = {
  colors: {
    white: 'var(--hc-text-primary)',
    black: 'var(--hc-bg-app)',
    bgApp: 'var(--hc-bg-app)',
    bgPage: 'var(--hc-bg-page)',
    bgSidebar: 'var(--hc-bg-sidebar)',
    bgSurface: 'var(--hc-bg-surface)',
    bgSecondary: 'var(--hc-bg-secondary)',
    bgTertiary: 'var(--hc-bg-tertiary)',
    gray50: 'var(--hc-bg-tertiary)',
    gray100: 'var(--hc-bg-surface)',
    gray200: 'var(--hc-border-subtle)',
    gray500: 'var(--hc-text-ghost)',
    gray700: 'var(--hc-text-secondary)',
    accent: 'var(--hc-accent)',
    accentDim: 'var(--hc-accent-dim)',
    accentGlow: 'var(--hc-accent-glow)',
    accentSubtle: 'var(--hc-accent-glow)',
    textPrimary: 'var(--hc-text-primary)',
    textSecondary: 'var(--hc-text-secondary)',
    textGhost: 'var(--hc-text-ghost)',
    textOnDark: 'var(--hc-text-primary)',
    borderMain: 'var(--hc-border-subtle)',
    borderSubtle: 'var(--hc-border-subtle)',
    borderStrong: 'var(--hc-border-strong)',
    sidebarTextPrimary: 'var(--hc-text-primary)',
    sidebarTextGhost: 'var(--hc-text-ghost)',
    surfaceHover: 'var(--hc-accent-dim)',
    surfaceActive: 'var(--hc-border-subtle)',
    danger: 'var(--color-error, #EF4444)',
  },
  fonts: {
    sans: "'Satoshi Variable', Inter, -apple-system, sans-serif",
    mono: "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace",
  },
  fontSizes: {
    /** Caption / register */
    micro: '11px',
    xs: '12px',
    /** Body */
    sm: '14px',
    md: '16px',
    /** Title / section */
    lg: '20px',
    xl: '24px',
    xxl: '40px',
    xxxl: '48px',
    display: 'clamp(32px, 4vw, 48px)',
    figure: 'clamp(28px, 4vh, 44px)',
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
  letterSpacing: {
    tight: '-0.06em',
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
    18: '144px',
    20: '80px',
    24: '120px',
    32: '160px',
  },
  borders: {
    none: 'none',
    thin: '1px',
    thick: '2px',
    heavy: '6px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
}

export const MONO = TOKENS.fonts.mono

/** Shell padding values by responsive mode (px) */
export const SHELL_PADDING: Record<'normal' | 'tight' | 'limit', number> = {
  normal: 24,
  tight: 16,
  limit: 12,
}

/** Shell gap values by responsive mode (px) */
export const SHELL_GAP: Record<'normal' | 'tight' | 'limit', number> = {
  normal: 24,
  tight: 16,
  limit: 12,
}

export const LINE_HEIGHT = {
  tight: 1.05,
  display: 1.1,
  title: 1.2,
  body: 1.45,
} as const

export const VALUE_LETTER_SPACING = '-0.02em'

/** Donut / timeline / position charts — keep in sync with connect visuals */
export const CHART_PALETTE = [
  TOKENS.colors.accent,
  TOKENS.colors.white,
  TOKENS.colors.gray500,
  TOKENS.colors.textGhost,
  'var(--hc-border-default)',
] as const

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtUsdCompact(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
