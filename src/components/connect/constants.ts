export const FONT = "'Satoshi Variable', Inter, -apple-system, sans-serif"
export const MONO = "var(--font-mono, 'IBM Plex Mono', ui-monospace, monospace)"

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
