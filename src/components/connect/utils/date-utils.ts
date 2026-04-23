/**
 * Calculate days remaining until a target date
 */
export function getDaysToMaturity(maturityDate: string | Date): number {
  const today = Date.now()
  const target = new Date(maturityDate).getTime()
  return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
}

/**
 * Format days to human readable string
 */
export function formatDaysRemaining(days: number): string {
  if (days === 0) return 'Matured'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}y`
}
