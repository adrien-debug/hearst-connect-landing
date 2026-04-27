/** Cinematic Financial OS — source of truth for connect scope. Keep `dashboard-vars.css` in sync. */

export const TOKENS = {
  colors: {
    white: 'var(--hc-text-primary)',
    /** Deep black — used for box / card surfaces and CTA-on-accent text. */
    black: 'var(--hc-bg-surface)',
    /** Body / canvas background (dark grey). */
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
    danger: 'var(--dashboard-error, #EF4444)',
    success: 'var(--dashboard-success, #2DC558)',
    warning: 'var(--dashboard-warning, #F59E0B)',
    info: 'var(--dashboard-info, #3B82F6)',
    /** Asset / product colors */
    btc: 'var(--dashboard-color-btc)',
    mining: 'var(--dashboard-color-mining)',
    stablecoin: 'var(--dashboard-color-stablecoin)',
    reserve: 'var(--dashboard-color-reserve)',
    productGrowth: 'var(--dashboard-color-product-growth)',
    productPrime: 'var(--dashboard-color-product-prime)',
    productRecovery: 'var(--dashboard-color-product-recovery)',
    /** Scenario colors */
    scenarioBear: 'var(--dashboard-color-scenario-bear)',
    scenarioBase: 'var(--dashboard-color-scenario-base)',
    scenarioBull: 'var(--dashboard-color-scenario-bull)',
  },
  fonts: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  fontSizes: {
    /** 10px — sub-micro figure, only for ultra-dense badges/glyphs */
    nano: 'var(--dashboard-text-dense-xs)',
    /** Caption / register */
    micro: 'var(--dashboard-font-size-xs)',
    xs: 'var(--dashboard-font-size-sm)',
    /** Body */
    sm: 'var(--dashboard-font-size-md)',
    md: 'var(--dashboard-font-size-base)',
    /** Title / section */
    lg: 'var(--dashboard-font-size-lg)',
    xl: 'var(--dashboard-font-size-xl)',
    xxl: 'var(--dashboard-font-size-2xl)',
    xxxl: 'var(--dashboard-font-size-3xl)',
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
    /** Subtle uppercase opener. */
    loose: 'var(--tracking-loose)',
    /** Caption tracker (0.08em). */
    caption: 'var(--dashboard-letter-spacing-caption)',
    /** UI micro labels (0.1em). */
    micro: 'var(--dashboard-letter-spacing-micro)',
    wide: 'var(--dashboard-letter-spacing-title)',
    display: 'var(--dashboard-letter-spacing-label)',
  },
  spacing: {
    0: '0px',
    /** 2px — micro spacing, ultra-dense layouts only. */
    half: '2px',
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
    xs: 'var(--dashboard-radius-xs)',
    sm: 'var(--dashboard-radius-sm)',
    md: 'var(--dashboard-radius-card)',
    lg: 'var(--dashboard-radius-box)',
    xl: '20px',
    full: 'var(--dashboard-radius-badge)',
    dot: 'var(--dashboard-radius-dot)',
  },
  chart: {
    heightSm: 'var(--dashboard-chart-height-sm)',
    heightMd: 'var(--dashboard-chart-height-md)',
    heightLg: 'var(--dashboard-chart-height-lg)',
    donutSizeSm: 'var(--dashboard-chart-donut-size-sm)',
    donutSizeMd: 'var(--dashboard-chart-donut-size-md)',
    donutSizeLg: 'var(--dashboard-chart-donut-size-lg)',
    lineStroke: 3,
    dotRadius: 6,
    dotStroke: 3,
    strokeHoverBoost: 3,
  },
  table: {
    rowHeight: 'var(--dashboard-table-row-height)',
    cellPaddingX: 'var(--dashboard-table-cell-padding-x)',
    cellPaddingY: 'var(--dashboard-table-cell-padding-y)',
    headerBorderWidth: 'var(--dashboard-table-header-border-width)',
    headerColor: 'var(--dashboard-table-header-color)',
    rowBorder: 'var(--dashboard-table-row-border)',
  },
  control: {
    heightSm: 'var(--dashboard-control-height-sm)',
    heightMd: 'var(--dashboard-control-height-md)',
    heightLg: 'var(--dashboard-control-height-lg)',
    heightXl: 'var(--dashboard-control-height-xl)',
  },
  icon: {
    xs: 'var(--dashboard-icon-size-xs)',
    sm: 'var(--dashboard-icon-size-sm)',
    md: 'var(--dashboard-icon-size-md)',
    lg: 'var(--dashboard-icon-size-lg)',
    xl: 'var(--dashboard-icon-size-xl)',
  },
  dot: {
    xs: 'var(--dashboard-dot-size-xs)',
    sm: 'var(--dashboard-dot-size-sm)',
    md: 'var(--dashboard-dot-size-md)',
    lg: 'var(--dashboard-dot-size-lg)',
  },
  bar: {
    thin: 'var(--dashboard-bar-thin)',
    thick: 'var(--dashboard-bar-thick)',
  },
  animation: {
    durationFast: 'var(--dashboard-duration-fast)',
    durationNormal: 'var(--dashboard-duration)',
    durationSlow: 'var(--dashboard-duration-slow)',
    easeSpring: 'var(--dashboard-ease-spring)',
    easeSharp: 'var(--dashboard-ease-sharp)',
    easeDefault: 'var(--dashboard-ease)',
  },
  /** High-level transition shorthands — prefer these to raw 'all 120ms ease' strings. */
  transitions: {
    /** all + fast (≈150ms) — hover state changes on cards / buttons. */
    fast: 'all var(--transition-fast)',
    /** all + base (≈200ms) — sidebar items, tabs, larger surfaces. */
    base: 'all var(--transition-base)',
    /** all + slow (≈300ms) — modal / panel entrances. */
    slow: 'all var(--transition-slow)',
    /** Property-specific durations (compose: `opacity ${T.transitions.durFast}`). */
    durFast: 'var(--transition-fast)',
    durBase: 'var(--transition-base)',
    durSlow: 'var(--transition-slow)',
  },
  zIndex: {
    base: 'var(--z-base)',
    raised: 'var(--z-raised)',
    tooltip: 'var(--z-tooltip)',
    dock: 'var(--z-dock)',
    dockActive: 'var(--z-dock-active)',
    dropdown: 'var(--z-dropdown)',
    sticky: 'var(--z-sticky)',
    fixed: 'var(--z-fixed)',
    overlay: 'var(--z-overlay)',
    modal: 'var(--z-modal)',
    toast: 'var(--z-toast)',
    banner: 'var(--z-banner)',
  },
  vault: {
    headerHeight: 'var(--dashboard-vault-header-height)',
    glowSize: 'var(--dashboard-vault-glow-size)',
    glowOffset: 'var(--dashboard-vault-glow-offset)',
    glowBlur: 'var(--dashboard-vault-glow-blur)',
    glowOpacity: 0.15,
    gridSize: 'var(--dashboard-vault-grid-size)',
    gridOpacity: 0.05,
    iconSize: 'var(--dashboard-vault-icon-size)',
    gemSize: 'var(--dashboard-vault-icon-gem-size)',
    gemBorderRadius: 'var(--dashboard-vault-icon-gem-border-radius)',
  },
  shadow: {
    card: 'var(--dashboard-shadow-card)',
    cardHover: 'var(--dashboard-shadow-card-hover)',
    panel: 'var(--dashboard-shadow-panel)',
    glowAccent: 'var(--dashboard-shadow-glow-accent)',
    glowDanger: 'var(--dashboard-shadow-glow-danger)',
  },
  tooltip: {
    minWidth: 'var(--dashboard-tooltip-min-width)',
    offset: 'var(--dashboard-tooltip-offset)',
  },
  activity: {
    iconCol: 'var(--dashboard-activity-icon-col)',
    microFont: 'var(--dashboard-activity-row-font-micro)',
  },
  dock: {
    buttonSize: 'var(--dashboard-dock-button-size, 52px)',
    logoSize: 'var(--dashboard-dock-logo-size, 26px)',
    dotSize: 'var(--dashboard-dock-dot-size, 4px)',
    dotOffset: 'var(--dashboard-dock-dot-offset, 5px)',
  },
}

export const MONO = TOKENS.fonts.mono

export const LINE_HEIGHT = {
  tight: 'var(--dashboard-line-height-tight)',
  display: 1.1,
  title: 1.2,
  body: 'var(--dashboard-line-height-normal)',
} as const

export const VALUE_LETTER_SPACING = 'var(--dashboard-letter-spacing-value)'

/** Donut / timeline / position charts — green + grey spectrum on dark background.
 * Keep accent first (brand consistency) then four grey-spectrum secondary hues. */
export const CHART_PALETTE = [
  TOKENS.colors.accent,  // #a7fb90 brand green
  '#52c97a',             // mid green
  '#d4d4d8',             // zinc-300 light grey
  '#71717a',             // zinc-500 medium grey
  '#3f3f46',             // zinc-700 dark grey
] as const

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtUsdCompact(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
