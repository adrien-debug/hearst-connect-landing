import { describe, expect, it } from 'vitest'
import {
  clamp,
  projectScenario,
  PROJECTION_SIM_BASE_PRICE,
  type ScenarioKey,
} from './projection-simulation'

describe('clamp', () => {
  it('pins to bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('projectScenario', () => {
  it('ranks bear below base below bull for same price and window', () => {
    const p = PROJECTION_SIM_BASE_PRICE
    const m = 12
    const bear = projectScenario(p, m, 'bear')
    const base = projectScenario(p, m, 'base')
    const bull = projectScenario(p, m, 'bull')
    expect(bear.cumulativeYield).toBeLessThan(base.cumulativeYield)
    expect(base.cumulativeYield).toBeLessThan(bull.cumulativeYield)
    expect(bear.totalValue).toBeLessThan(bull.totalValue)
  })

  it('treats invalid price as base price and clamps month', () => {
    const a = projectScenario(-100, 0, 'base')
    const b = projectScenario(PROJECTION_SIM_BASE_PRICE, 1, 'base')
    expect(a.annualApr).toBe(b.annualApr)
    expect(projectScenario(NaN, 200, 'base').cumulativeYield).toBeGreaterThan(0)
  })

  it('caps very large horizon', () => {
    const p = projectScenario(PROJECTION_SIM_BASE_PRICE, 999, 'base')
    expect(Number.isFinite(p.cumulativeYield)).toBe(true)
  })

  it('keeps APR in model band for bear and bull', () => {
    for (const key of ['bear', 'bull'] as ScenarioKey[]) {
      const out = projectScenario(40_000, 24, key)
      expect(out.annualApr).toBeGreaterThan(0.04)
      expect(out.annualApr).toBeLessThan(0.43)
      expect(out.totalValue).toBeGreaterThan(500_000)
    }
  })
})
