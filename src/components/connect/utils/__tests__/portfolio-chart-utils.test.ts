import { describe, expect, it } from 'vitest'
import { buildPortfolioSparklineFromActivity } from '../portfolio-chart-utils'

describe('buildPortfolioSparklineFromActivity', () => {
  it('anchors the last point to current portfolio value', () => {
    const t0 = 1_700_000_000_000
    const series = buildPortfolioSparklineFromActivity(
      [
        { type: 'deposit', amount: 1_000_000, timestamp: t0 },
        { type: 'deposit', amount: 500_000, timestamp: t0 + 10_000 },
      ],
      2.5,
      10,
    )
    expect(series[series.length - 1]).toBe(2.5)
    expect(series[0]).toBeGreaterThan(0)
  })

  it('returns a flat line at current value when there is no activity', () => {
    const series = buildPortfolioSparklineFromActivity([], 100, 5)
    expect(series.every((v) => v === 100)).toBe(true)
  })
})
