/**
 * Format vault name by removing prefix
 * "HashVault Ultra Yield" → "Ultra Yield"
 */
export function formatVaultName(name: string): string {
  return name.replace('HashVault ', '')
}

/**
 * Format number as compact currency
 * 1234567 → "$1.2M"
 */
export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format percentage with 1 decimal
 * 0.1234 → "12.3%"
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
