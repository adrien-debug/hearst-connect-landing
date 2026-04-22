/** Cinematic Financial OS — source of truth for connect scope. Keep `dashboard-vars.css` in sync. */
export const SIDEBAR_WIDTH_PX = 280
/** Below ~1280px when mode is `limit` (tighter column). */
export const SIDEBAR_WIDTH_NARROW_PX = 272

export const TOKENS = {
  colors: {
    white: '#FFFFFF',
    black: '#000000',
    /** App shell / deep void */
    bgApp: '#050505',
    /** Main scene — medium charcoal distinct from sidebar */
    bgPage: '#141414',
    /** Sidebar column */
    bgSidebar: '#050505',
    /** Subtle lift (modals, hover) */
    bgSurface: '#0A0A0A',
    /** Legacy aliases — map to scene */
    gray50: '#F8F9FA',
    gray100: '#0A0A0A',
    gray200: 'rgba(255,255,255,0.08)',
    gray500: 'rgba(255,255,255,0.45)',
    gray700: 'rgba(255,255,255,0.72)',
    accent: '#A7FB90',
    accentDim: 'rgba(167, 251, 144, 0.05)',
    accentGlow: 'rgba(167, 251, 144, 0.12)',
    textPrimary: 'rgba(255,255,255,0.92)',
    textSecondary: 'rgba(255,255,255,0.55)',
    textGhost: 'rgba(255,255,255,0.35)',
    textOnDark: 'rgba(255,255,255,0.92)',
    borderMain: 'rgba(255,255,255,0.06)',
    borderSubtle: 'rgba(255,255,255,0.08)',
    sidebarTextPrimary: 'rgba(255,255,255,0.92)',
    sidebarTextGhost: 'rgba(255,255,255,0.35)',
    surfaceHover: 'rgba(255,255,255,0.04)',
    surfaceActive: 'rgba(255,255,255,0.08)',
    danger: '#EF4444',
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
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
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
}

export const FONT = TOKENS.fonts.sans
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

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtUsdCompact(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
