export interface Aggregate {
  totalDeposited: number
  totalClaimable: number
  avgApr: number
}

export function aggregateVaults(
  active: { deposited: number; claimable: number; apr: number }[],
): Aggregate {
  const totalDeposited = active.reduce((s, v) => s + v.deposited, 0)
  return {
    totalDeposited,
    totalClaimable: active.reduce((s, v) => s + v.claimable, 0),
    avgApr:
      totalDeposited > 0
        ? active.reduce((s, v) => s + v.apr * v.deposited, 0) / totalDeposited
        : 0,
  }
}

/**
 * Monthly yield model:
 * produced = (deposited × APR / 12) × (dayOfMonth / daysInMonth)
 * remaining = monthlyYield - produced
 */
export function computeMonthlyYield(
  deposited: number,
  apr: number,
  dayOfMonth: number,
  daysInMonth: number,
) {
  const monthlyYield = (deposited * apr) / 100 / 12
  const dailyYield = monthlyYield / daysInMonth
  const produced = dailyYield * dayOfMonth
  const remaining = Math.max(0, monthlyYield - produced)
  return { monthlyYield, produced, remaining }
}
