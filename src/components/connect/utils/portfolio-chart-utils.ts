/**
 * Helpers for portfolio summary charts (maturity + sparkline history).
 */

/** Days remaining until a target date (floored at 0). */
export function getDaysToMaturity(maturityDate: string | Date): number {
  const today = Date.now()
  const target = new Date(maturityDate).getTime()
  return Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)))
}

export type SparklineActivityEvent = {
  type: 'deposit' | 'claim' | 'withdraw'
  amount: number // already in display units (USD)
  timestamp: number
}

/**
 * Builds a stepped portfolio curve from persisted activity (deposits / withdraws).
 * The curve starts at the first event — no artificial 30d lookback.
 * Amounts are already in display units (converted by useUserData).
 */
export function buildPortfolioSparklineFromActivity(
  events: SparklineActivityEvent[],
  currentPortfolioValue: number,
  points = 30,
): number[] {
  const n = Math.max(2, points)
  if (currentPortfolioValue <= 0) {
    return Array.from({ length: n }, () => 0)
  }

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) {
    return Array.from({ length: n }, () => currentPortfolioValue)
  }

  const firstT = sorted[0].timestamp
  const lastT = Date.now()
  const span = lastT - firstT

  // If all events happened very recently (< 1h), show flat line at current value
  if (span < 3600_000) {
    return Array.from({ length: n }, () => currentPortfolioValue)
  }

  const valueAt = (t: number): number => {
    let running = 0
    for (const e of sorted) {
      if (e.timestamp > t) break
      if (e.type === 'deposit') running += e.amount
      else if (e.type === 'withdraw') running = Math.max(0, running - e.amount)
    }
    return running
  }

  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = firstT + (span * i) / (n - 1)
    out.push(valueAt(t))
  }
  out[out.length - 1] = currentPortfolioValue
  return out
}
