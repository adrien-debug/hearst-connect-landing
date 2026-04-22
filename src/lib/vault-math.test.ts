import { describe, expect, it } from 'vitest'
import { aggregateVaults, computeMonthlyYield } from './vault-math'
import { projectScenario, PROJECTION_SIM_BASE_PRICE } from './projection-simulation'

describe('aggregateVaults', () => {
  it('returns zeros for no active positions', () => {
    expect(aggregateVaults([])).toEqual({ totalDeposited: 0, totalClaimable: 0, avgApr: 0 })
  })

  it('sums active deposits and claimables and weights APR by principal', () => {
    const out = aggregateVaults([
      { deposited: 100, claimable: 10, apr: 10 },
      { deposited: 100, claimable: 5, apr: 20 },
    ])
    expect(out.totalDeposited).toBe(200)
    expect(out.totalClaimable).toBe(15)
    expect(out.avgApr).toBe(15) // (10*100 + 20*100) / 200
  })
})

describe('computeMonthlyYield', () => {
  it('splits produced vs remaining within the month', () => {
    const { monthlyYield, produced, remaining } = computeMonthlyYield(12_000, 12, 10, 30)
    expect(monthlyYield).toBe(120) // 12% APR on 12k / 12 months
    expect(produced + remaining).toBeCloseTo(monthlyYield, 8)
  })

  it('is zero remaining at end of month', () => {
    const { produced, remaining } = computeMonthlyYield(12_000, 12, 30, 30)
    expect(remaining).toBe(0)
    expect(produced).toBeGreaterThan(0)
  })

  it('handles first day of month', () => {
    const a = computeMonthlyYield(10_000, 12, 1, 31)
    const b = computeMonthlyYield(10_000, 12, 2, 31)
    expect(b.produced).toBeGreaterThan(a.produced)
  })
})

describe('projectScenario', () => {
  it('increases total value with longer horizon in base case', () => {
    const short = projectScenario(PROJECTION_SIM_BASE_PRICE, 6, 'base')
    const long = projectScenario(PROJECTION_SIM_BASE_PRICE, 12, 'base')
    expect(long.cumulativeYield).toBeGreaterThan(short.cumulativeYield)
    expect(long.totalValue).toBeGreaterThan(short.totalValue)
  })
})
