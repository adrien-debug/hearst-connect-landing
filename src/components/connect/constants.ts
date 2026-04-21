export const FONT = "'Satoshi Variable', Inter, -apple-system, sans-serif"
export const MONO = "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)"

export const VAULT_LINE_SPACING = 20
export const MIN_VAULT_LINE_OPACITY = 0.3
export const DASH_PATTERN =
  'repeating-linear-gradient(to right, var(--dashboard-text-muted) 0, var(--dashboard-text-muted) 6px, transparent 6px, transparent 14px)'

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
