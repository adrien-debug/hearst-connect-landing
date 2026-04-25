export type ScenarioKey = 'bear' | 'base' | 'bull'

const TICKET = 500_000
const BASE_PRICE = 95_000
const BASE_APR = 0.12
const MAX_MONTHS = 120
const MAX_PRICE = 1_000_000

const SCENARIOS: Record<ScenarioKey, { label: string; multiplier: number; futureMove: number }> = {
  bear: { label: 'Bear', multiplier: 0.72, futureMove: -0.22 },
  base: { label: 'Base', multiplier: 1, futureMove: 0.08 },
  bull: { label: 'Bull', multiplier: 1.34, futureMove: 0.34 },
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function safeMonths(months: number) {
  if (!Number.isFinite(months) || months <= 0) return 1
  return Math.max(1, Math.min(MAX_MONTHS, Math.floor(months)))
}

function safePrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return BASE_PRICE
  return Math.min(Math.max(1, price), MAX_PRICE)
}

export function projectScenario(price: number, months: number, scenario: ScenarioKey) {
  const m = safeMonths(months)
  const p = safePrice(price)
  const config = SCENARIOS[scenario]
  const priceFactor = Math.pow(p / BASE_PRICE, 0.85)
  const annualApr = clamp(BASE_APR * config.multiplier * priceFactor, 0.05, 0.42)
  const monthlyYield = (TICKET * annualApr) / 12
  const cumulativeYield = monthlyYield * m
  const totalValue = TICKET + cumulativeYield
  const horizonFactor = 1 + m / 24
  const expectedPrice = p * (1 + config.futureMove * horizonFactor)

  return {
    annualApr,
    cumulativeYield,
    totalValue,
    expectedPrice,
  }
}

export const PROJECTION_SIM_BASE_PRICE = BASE_PRICE
