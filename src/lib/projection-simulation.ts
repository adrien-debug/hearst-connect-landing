export type ScenarioKey = 'bear' | 'base' | 'bull'

const TICKET = 500_000
const BASE_PRICE = 95_000
const BASE_APR = 0.12

export const SCENARIOS: Record<ScenarioKey, { label: string; multiplier: number; futureMove: number }> = {
  bear: { label: 'Bear', multiplier: 0.72, futureMove: -0.22 },
  base: { label: 'Base', multiplier: 1, futureMove: 0.08 },
  bull: { label: 'Bull', multiplier: 1.34, futureMove: 0.34 },
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function projectScenario(price: number, months: number, scenario: ScenarioKey) {
  const config = SCENARIOS[scenario]
  const priceFactor = Math.pow(price / BASE_PRICE, 0.85)
  const annualApr = clamp(BASE_APR * config.multiplier * priceFactor, 0.05, 0.42)
  const monthlyYield = (TICKET * annualApr) / 12
  const cumulativeYield = monthlyYield * months
  const totalValue = TICKET + cumulativeYield
  const horizonFactor = 1 + months / 24
  const expectedPrice = price * (1 + config.futureMove * horizonFactor)

  return {
    annualApr,
    cumulativeYield,
    totalValue,
    expectedPrice,
  }
}

export const PROJECTION_SIM_TICKET = TICKET
export const PROJECTION_SIM_BASE_PRICE = BASE_PRICE
export const PROJECTION_SIM_BASE_APR = BASE_APR
