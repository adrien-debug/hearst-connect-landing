/**
 * Helpers for portfolio summary charts (maturity + monthly value curve).
 */

import { MS_PER_DAY } from '@/lib/constants'

/** Days remaining until a target date (floored at 0). Accepts a timestamp (ms), Date, or date-like string. */
export function getDaysToMaturity(maturity: number | string | Date): number {
  const target = typeof maturity === 'number' ? maturity : new Date(maturity).getTime()
  if (!Number.isFinite(target)) return 0
  return Math.max(0, Math.ceil((target - Date.now()) / MS_PER_DAY))
}

/**
 * Builds a smooth 12-month monthly portfolio curve, ending at the current value.
 * Uses the supplied APY (or 7% fallback) to back-project the start value 12 months ago,
 * then compounds monthly. Returns 12 data points + 12 month labels (oldest → newest).
 */
export function buildMonthlyPortfolioCurve(
  currentPortfolioValue: number,
  avgApr: number,
  now: Date = new Date(),
): { data: number[]; labels: string[] } {
  const months = 12
  const labels: string[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    labels.push(d.toLocaleString('en-US', { month: 'short' }))
  }

  if (currentPortfolioValue <= 0) {
    return { data: Array.from({ length: months }, () => 0), labels }
  }

  const apy = avgApr > 0 ? avgApr : 7
  const startValue = currentPortfolioValue / (1 + apy / 100)
  const data: number[] = []
  for (let i = 0; i < months; i++) {
    const fraction = i / (months - 1)
    data.push(startValue * Math.pow(1 + apy / 100, fraction))
  }
  data[data.length - 1] = currentPortfolioValue
  return { data, labels }
}

/** Next daily distribution timestamp (00:00 UTC tomorrow), with relative + absolute labels. */
export function computeNextDailyDistribution(now: Date = new Date()): { relative: string; absolute: string } {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ))
  const day = next.getUTCDate()
  const month = next.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const absolute = `${day} ${month} · 00:00 UTC`
  return { relative: 'Tomorrow', absolute }
}

/** Round-number axis ticks across [min, max] aiming for ~target divisions. */
export function generateNiceTicks(min: number, max: number, target = 6): number[] {
  if (max <= min) return [min]
  const range = max - min
  const roughStep = range / Math.max(1, target - 1)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const ratio = roughStep / magnitude
  const niceStep =
    ratio < 1.5 ? magnitude
    : ratio < 3 ? 2 * magnitude
    : ratio < 7 ? 5 * magnitude
    : 10 * magnitude
  const niceMin = Math.floor(min / niceStep) * niceStep
  const niceMax = Math.ceil(max / niceStep) * niceStep
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + niceStep / 2; v += niceStep) ticks.push(v)
  return ticks
}
