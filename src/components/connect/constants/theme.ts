import { TOKENS } from '../constants'

/**
 * Chart color palette for vault visualizations
 * Consistent colors across donut, timeline, and position charts
 */
export const CHART_PALETTE = [
  TOKENS.colors.accent,
  TOKENS.colors.white,
  'rgba(255,255,255,0.45)',
  'rgba(255,255,255,0.35)',
  'rgba(255,255,255,0.25)',
] as const

/**
 * Extended palette for larger datasets
 */
export const CHART_PALETTE_EXTENDED = [
  ...CHART_PALETTE,
  'rgba(167,251,144,0.6)',
  'rgba(167,251,144,0.4)',
  'rgba(167,251,144,0.2)',
] as const
