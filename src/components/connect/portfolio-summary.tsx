'use client'

import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { EmptyState } from './empty-states'
import { VaultCardCompact } from './vault-card-compact'
import { TOKENS, fmtUsdCompact, fmtUsd, VALUE_LETTER_SPACING, CHART_PALETTE } from './constants'
import { formatVaultName } from './formatting'
import { buildMonthlyPortfolioCurve, generateNiceTicks, getDaysToMaturity } from './utils/portfolio-chart-utils'
import { fitValue, type SmartFitMode, useSmartFit, useShellPadding } from './smart-fit'
import { type VaultLine, type Aggregate, type ActiveVault, type AvailableVault } from './data'
import { useUserData } from '@/hooks/useUserData'

import { CockpitGauge } from './cockpit-gauge'
import { CardAction } from './card'

export function PortfolioSummary({
  vaults,
  agg,
  onVaultSelect,
  onAvailableVaultsClick,
}: {
  vaults: VaultLine[]
  agg: Aggregate
  onVaultSelect?: (vaultId: string) => void
  onAvailableVaultsClick?: () => void
}) {
  const { mode } = useSmartFit({
    tightHeight: 860,
    limitHeight: 720,
    tightWidth: 1280,
    limitWidth: 1024,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)
  const [mounted, setMounted] = useState(false)
  const [isClaimingAll, setIsClaimingAll] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { actions: userActions, activity: userActivity, stats: userStats } = useUserData()

  const activeVaults = vaults.filter((v): v is ActiveVault => v.type === 'active')
  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')
  // Use client-only values to prevent hydration mismatch
  const safeAgg = mounted ? agg : { totalDeposited: 0, totalClaimable: 0, avgApr: 0, activeVaults: 0 }
  const safeYieldClaimed = mounted ? userStats.totalYieldClaimed : 0
  const portfolioValue = safeAgg.totalDeposited + safeAgg.totalClaimable
  const totalYieldEarned = safeAgg.totalClaimable + safeYieldClaimed
  const yieldPct = safeAgg.totalDeposited > 0
    ? (totalYieldEarned / safeAgg.totalDeposited) * 100
    : 0
  const nextDistribution = mounted ? computeNextDailyDistribution() : null

  const handleClaimAll = async () => {
    if (safeAgg.totalClaimable === 0 || isClaimingAll) return

    setIsClaimingAll(true)
    try {
      const claimableVaults = activeVaults.filter(v => v.claimable > 0)
      
      for (const vault of claimableVaults) {
        console.log(`[ClaimAll] Claiming ${vault.claimable} from vault ${vault.id}`)
      }
      
      userActions.refresh()
    } catch (error) {
      console.error('[ClaimAll] Error:', error)
    } finally {
      setIsClaimingAll(false)
    }
  }

  // Memoized derived data — prevents recalculation on every render
  const { data: valueHistory, labels: valueHistoryLabels } = useMemo(
    () => buildMonthlyPortfolioCurve(portfolioValue, safeAgg.avgApr),
    [portfolioValue, safeAgg.avgApr],
  )
  const recentActivity = mounted ? userActivity.slice(0, 5) : []
  const donutData = useMemo(() => {
    return activeVaults.map((vault, index) => ({
      id: vault.id,
      name: vault.name,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
      pct: portfolioValue > 0 ? ((vault.deposited + vault.claimable) / portfolioValue) * 100 : 0,
      value: vault.deposited + vault.claimable,
      claimable: vault.claimable,
      apr: vault.apr,
    }))
  }, [activeVaults, portfolioValue])

  /** ID of the highest-APR active vault — used by the donut legend to surface
   * a "Top" badge so the screenshot answers "which vault is pulling weight?" at a glance. */
  const topPerformerId = useMemo(() => {
    if (activeVaults.length === 0) return null
    return activeVaults.reduce((best, v) => (v.apr > best.apr ? v : best), activeVaults[0]).id
  }, [activeVaults])

  return (
    <div
      className="flex-1"
      suppressHydrationWarning
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        overflow: 'hidden',
        fontFamily: TOKENS.fonts.sans,
        height: '100%',
        color: TOKENS.colors.textPrimary,
      }}
    >
      {/* COCKPIT HEADER — Command center feel */}
      <div
        style={{
          padding: fitValue(mode, {
            normal: `${shellPadding * 0.75}px ${shellPadding}px`,
            tight: `${shellPadding * 0.5}px ${shellPadding * 0.75}px`,
            limit: `${shellPadding * 0.4}px ${shellPadding * 0.5}px`,
          }),
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* Main cockpit gauges — Large figures */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(3, 1fr)',
            tight: 'repeat(3, 1fr)',
            limit: '1fr',
          }),
          gap: fitValue(mode, {
            normal: TOKENS.spacing[6],
            tight: TOKENS.spacing[4],
            limit: TOKENS.spacing[3],
          }),
        }}>
          {/* Portfolio Value — Primary, with lifetime yield delta */}
          <CockpitGauge
            label="Portfolio Value"
            value={fmtUsd(portfolioValue)}
            valueCompact={fmtUsdCompact(portfolioValue)}
            subtext={
              totalYieldEarned > 0 ? (
                <span style={{ color: TOKENS.colors.accent }}>
                  +{fmtUsd(totalYieldEarned)} ({yieldPct >= 0 ? '+' : ''}{yieldPct.toFixed(2)}%)
                </span>
              ) : (
                `${mounted ? activeVaults.length : 0} position${(mounted ? activeVaults.length : 0) !== 1 ? 's' : ''}`
              )
            }
            mode={mode}
            primary
            align="center"
          />

          {/* Yield Earned to Date — Accent */}
          <CockpitGauge
            label="Yield Earned to Date"
            value={fmtUsd(totalYieldEarned)}
            valueCompact={fmtUsdCompact(totalYieldEarned)}
            subtext="USDC · distributed daily"
            mode={mode}
            accent
            align="center"
          />

          {/* Next Distribution — daily 00:00 UTC */}
          <CockpitGauge
            label="Next Distribution"
            value={nextDistribution?.relative ?? '—'}
            valueCompact={nextDistribution?.relative ?? '—'}
            subtext={nextDistribution?.absolute ?? ''}
            mode={mode}
            align="center"
          />
        </div>
      </div>

      {/* Main content — charts left, dashboard navigation right, positions bottom */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: fitValue(mode, {
          normal: 'minmax(0, 1fr) 380px',
          tight: 'minmax(0, 1fr) 320px',
          limit: 'minmax(0, 1fr)',
        }),
        padding: `${shellPadding}px`,
        gap: `${shellGap}px`,
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${shellGap}px`,
          minHeight: 0,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: fitValue(mode, {
              normal: '240px 1fr',
              tight: '200px 1fr',
              limit: '1fr',
            }),
            gap: fitValue(mode, {
              normal: TOKENS.spacing[6],
              tight: TOKENS.spacing[4],
              limit: TOKENS.spacing[3],
            }),
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[6],
              tight: TOKENS.spacing[4],
              limit: TOKENS.spacing[3],
            }),
            minHeight: fitValue(mode, {
              normal: '240px',
              tight: '200px',
              limit: 'auto',
            }),
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: mode !== 'limit' ? `1px solid ${TOKENS.colors.borderSubtle}` : 'none',
              borderBottom: mode === 'limit' ? `1px solid ${TOKENS.colors.borderSubtle}` : 'none',
              paddingRight: mode !== 'limit' ? TOKENS.spacing[6] : 0,
              paddingBottom: mode === 'limit' ? TOKENS.spacing[6] : 0,
            }}>
              <AllocationDonut
                data={donutData}
                total={portfolioValue}
                mode={mode}
                topPerformerId={topPerformerId}
                onSegmentClick={(vaultId) => onVaultSelect?.(vaultId)}
              />
              <div style={{
                display: 'flex',
                gap: TOKENS.spacing[4],
                marginTop: TOKENS.spacing[3],
              }}>
                <MiniStat
                  label="Avg Maturity"
                  value={`${mounted ? Math.round(activeVaults.reduce((sum, v) => sum + v.progress, 0) / (activeVaults.length || 1)) : 0}%`}
                />
                <MiniStat label="Claimable" value={`+${fmtUsdCompact(safeAgg.totalClaimable)}`} accent />
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              paddingLeft: mode !== 'limit' ? TOKENS.spacing[4] : 0,
              paddingTop: TOKENS.spacing[2],
            }}>
              <LineChartArea
                data={valueHistory}
                labels={valueHistoryLabels}
                portfolioValue={portfolioValue}
                totalDeposited={safeAgg.totalDeposited}
                mode={mode}
              />
            </div>
          </div>

          <div style={{
            flex: 1,
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: `${TOKENS.spacing[6]}`,
              tight: `${TOKENS.spacing[5]}`,
              limit: `${TOKENS.spacing[4]}`,
            }),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: fitValue(mode, {
          normal: TOKENS.spacing[5],
          tight: TOKENS.spacing[4],
          limit: TOKENS.spacing[3],
        }),
        flexShrink: 0,
        height: 'var(--dashboard-card-header-height)',
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.accent}`,
          paddingLeft: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
        }}>
          Positions ({mounted ? activeVaults.length : 0})
        </span>
              <button
                onClick={handleClaimAll}
                disabled={safeAgg.totalClaimable === 0 || isClaimingAll}
                style={{
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                  background: safeAgg.totalClaimable > 0 && !isClaimingAll ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
                  border: `1px solid ${safeAgg.totalClaimable > 0 && !isClaimingAll ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                  color: safeAgg.totalClaimable > 0 && !isClaimingAll ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  textTransform: 'uppercase',
                  cursor: safeAgg.totalClaimable > 0 && !isClaimingAll ? 'pointer' : 'not-allowed',
                  opacity: (safeAgg.totalClaimable > 0 && !isClaimingAll) ? 1 : 0.5,
                  height: 'var(--dashboard-control-height-sm)',
                }}
              >
                {isClaimingAll ? 'Claiming...' : `Claim ${safeAgg.totalClaimable > 0 ? fmtUsdCompact(safeAgg.totalClaimable) : 'All'}`}
              </button>
            </div>

            <div
              className="hide-scrollbar"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[4],
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[4],
              }}>
                {activeVaults.length === 0 ? (
                  <EmptyState
                    title="No open positions"
                    description="When you deploy capital, your positions will appear here."
                  />
                ) : (
                  activeVaults.map((vault, index) => {
                    const last = userActivity.find((a) => a.vaultId === vault.id && a.type === 'claim')
                    return (
                      <VaultCardCompact
                        key={vault.id}
                        vault={vault}
                        index={index}
                        total={safeAgg.totalDeposited}
                        mode={mode}
                        lastClaim={last ? { amount: last.amount, timestamp: last.timestamp } : null}
                        onClick={() => onVaultSelect?.(vault.id)}
                        onClaim={() => onVaultSelect?.(vault.id)}
                        onExit={() => onVaultSelect?.(vault.id)}
                      />
                    )
                  })
                )}
              </div>

              {activeVaults.length > 0 && (
                <div style={{
                  paddingTop: TOKENS.spacing[4],
                  borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
                }}>
                  <MaturityTimelineCompact vaults={activeVaults} mode={mode} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateRows: fitValue(mode, {
            normal: '1fr 1fr',
            tight: '1fr 1fr',
            limit: '1fr 1fr',
          }),
          gap: `${shellGap}px`,
          minHeight: 0,
          minWidth: 0,
        }}>
          <DashboardSideCard
            mode={mode}
            title={`Available Vaults (${availableVaults.length})`}
            actionLabel={availableVaults.length > 0 ? 'View All' : undefined}
            onAction={availableVaults.length > 0 ? onAvailableVaultsClick : undefined}
            noScroll
          >
            {availableVaults.length === 0 ? (
              <PanelEmptyMessage message="No vaults available" />
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: TOKENS.spacing[5],
                paddingInline: TOKENS.spacing[3],
                minWidth: 0,
              }}>
                {availableVaults.slice(0, 4).map((vault, index) => (
                  <AvailableVaultTeaser
                    key={vault.id}
                    vault={vault}
                    index={index}
                    mode={mode}
                    onClick={() => onVaultSelect?.(vault.id)}
                  />
                ))}
              </div>
            )}
          </DashboardSideCard>

          <DashboardSideCard
            mode={mode}
            title="Recent Activity"
          >
            {recentActivity.length === 0 ? (
              <PanelEmptyMessage message="No recent activity yet" />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                paddingInline: TOKENS.spacing[3],
                minWidth: 0,
              }}>
                {recentActivity.map((item) => (
                  <ActivityRow
                    key={item.id}
                    type={item.type}
                    label={formatActivityType(item.type)}
                    vaultName={item.vaultName}
                    amount={item.amount}
                    timestamp={item.timestamp}
                  />
                ))}
              </div>
            )}
          </DashboardSideCard>
        </div>
      </div>
    </div>
  )
}

type DonutVaultItem = {
  id: string
  name: string
  color: string
  pct: number
  value: number
  claimable: number
  apr?: number
}

/** AllocationDonut — Circular portfolio allocation chart with interactive tooltips */
function AllocationDonut({
  data,
  total,
  mode,
  compact = false,
  topPerformerId,
  onSegmentClick,
}: {
  data: DonutVaultItem[]
  total: number
  mode: SmartFitMode
  compact?: boolean
  topPerformerId?: string | null
  onSegmentClick?: (vaultId: string) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const size = compact
    ? fitValue(mode, { normal: 120, tight: 100, limit: 88 })
    : fitValue(mode, { normal: 150, tight: 130, limit: 110 })
  const strokeHoverBoost = TOKENS.chart.strokeHoverBoost
  const strokeWidth = compact
    ? fitValue(mode, { normal: 16, tight: 14, limit: 12 })
    : fitValue(mode, { normal: 20, tight: 18, limit: 14 })
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Pre-calculate all segment geometry to avoid math in render
  const segments = useMemo(() => {
    let offsetCursor = 0
    return data.map((vault) => {
      const rawPct = total > 0 ? vault.pct / 100 : 0
      const dash = circumference * rawPct
      const segment = {
        dash,
        gap: circumference - dash,
        offset: -offsetCursor,
        color: vault.color,
        id: vault.id,
        name: vault.name,
        value: vault.value,
        claimable: vault.claimable,
        pct: vault.pct,
      }
      offsetCursor += dash
      return segment
    })
  }, [data, circumference, total])

  const hoveredSegment = segments.find(s => s.id === hoveredId)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: TOKENS.spacing[4],
      position: 'relative',
    }}>
      {/* Donut Chart */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
          role="img"
          aria-label={`Portfolio allocation: ${data.length} vaults, total ${fmtUsdCompact(total)}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TOKENS.colors.bgTertiary}
            strokeWidth={strokeWidth}
          />

          {/* Segments — interactive with hover effects */}
          {segments.map((seg) => {
            const isHovered = hoveredId === seg.id
            return (
              <circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + strokeHoverBoost : strokeWidth}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                style={{
                  cursor: onSegmentClick ? 'pointer' : 'default',
                  transition: TOKENS.transitions.fast,
                  filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
                }}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSegmentClick?.(seg.id)}
              />
            )
          })}
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          {hoveredSegment ? (
            <>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: hoveredSegment.color,
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formatVaultName(hoveredSegment.name)}
              </div>
              <div style={{
                fontSize: fitValue(mode, {
                  normal: TOKENS.fontSizes.md,
                  tight: TOKENS.fontSizes.sm,
                  limit: TOKENS.fontSizes.sm,
                }),
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: VALUE_LETTER_SPACING,
                color: TOKENS.colors.textPrimary,
                marginTop: TOKENS.spacing[2],
              }}>
                {fmtUsdCompact(hoveredSegment.value)}
              </div>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.accent,
                marginTop: TOKENS.spacing[2],
              }}>
                +{fmtUsdCompact(hoveredSegment.claimable)}
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textGhost,
              }}>
                Total
              </div>
              <div style={{
                fontSize: fitValue(mode, {
                  normal: TOKENS.fontSizes.md,
                  tight: TOKENS.fontSizes.sm,
                  limit: TOKENS.fontSizes.sm,
                }),
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: VALUE_LETTER_SPACING,
                color: TOKENS.colors.textPrimary,
                marginTop: TOKENS.spacing[2],
              }}>
                {fmtUsdCompact(total)}
              </div>
            </>
          )}
        </div>

        {/* Tooltip overlay */}
        {hoveredSegment && (
          <div
            style={{
              position: 'absolute',
              bottom: `calc(100% + ${TOKENS.tooltip.offset})`,
              left: '50%',
              transform: 'translateX(-50%)',
              background: TOKENS.colors.bgTertiary,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
              boxShadow: TOKENS.shadow.panel,
              zIndex: TOKENS.zIndex.tooltip,
              pointerEvents: 'none',
              animation: `fadeIn ${TOKENS.transitions.durFast}`,
              minWidth: TOKENS.tooltip.minWidth,
            }}
          >
            <div style={{
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              color: hoveredSegment.color,
              marginBottom: TOKENS.spacing[2],
            }}>
              {hoveredSegment.name}
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.md,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
            }}>
              {fmtUsdCompact(hoveredSegment.value)}
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.micro,
              color: TOKENS.colors.textSecondary,
              marginTop: TOKENS.spacing[2],
            }}>
              {hoveredSegment.pct.toFixed(1)}% of portfolio
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.micro,
              color: TOKENS.colors.accent,
              marginTop: TOKENS.spacing[2],
            }}>
              +{fmtUsdCompact(hoveredSegment.claimable)} claimable
            </div>
          </div>
        )}
      </div>

      {/* Legend — clickable, capped at 3 to prevent overflow */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing.half,
        width: '100%',
      }}>
        {data.slice(0, 3).map((vault) => (
          <div
            key={vault.id}
            onClick={() => onSegmentClick?.(vault.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: TOKENS.spacing[2],
              cursor: onSegmentClick ? 'pointer' : 'default',
              padding: `2px ${TOKENS.spacing[2]}`,
              borderRadius: TOKENS.radius.sm,
              transition: TOKENS.transitions.fast,
              background: hoveredId === vault.id ? TOKENS.colors.bgTertiary : 'transparent',
            }}
            onMouseEnter={() => setHoveredId(vault.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              minWidth: 0,
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: vault.color,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                color: hoveredId === vault.id ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
                transition: `color ${TOKENS.transitions.durFast}`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {formatVaultName(vault.name)}
              </span>
              {topPerformerId === vault.id && (
                <span
                  title="Highest APR in your portfolio"
                  style={{
                    padding: `0 ${TOKENS.spacing[1]}`,
                    background: TOKENS.colors.accentSubtle,
                    color: TOKENS.colors.accent,
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.nano,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    borderRadius: TOKENS.radius.sm,
                    flexShrink: 0,
                  }}
                >
                  Top
                </span>
              )}
            </div>
            <span style={{
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              flexShrink: 0,
            }}>
              {vault.pct.toFixed(0)}%
            </span>
          </div>
        ))}
        {data.length > 3 && (
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            textAlign: 'center',
            padding: `2px 0`,
          }}>
            +{data.length - 3} more
          </div>
        )}
      </div>
    </div>
  )
}

/** Generate deterministic historical data for sparkline (seeded for SSR/client consistency) */
/** Mini stat for donut panel */
function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: TOKENS.spacing[2],
    }}>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.wide,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        letterSpacing: VALUE_LETTER_SPACING,
      }}>
        {value}
      </div>
    </div>
  )
}

/** LineChartArea — Full area chart with gradient fill */
function LineChartArea({
  data,
  labels,
  portfolioValue,
  totalDeposited,
  mode,
}: {
  data: number[]
  labels: string[]
  portfolioValue: number
  totalDeposited: number
  mode: SmartFitMode
}) {
  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)
  // Add 1% headroom so the curve doesn't kiss the top tick
  const niceTicks = generateNiceTicks(dataMin, dataMax * 1.01, 7)
  const baseValue = niceTicks[0]
  const maxVal = niceTicks[niceTicks.length - 1]
  const range = maxVal - baseValue || (totalDeposited > 0 ? totalDeposited * 0.1 : 1)

  const startValue = data[0] ?? portfolioValue
  const change = startValue > 0 ? ((portfolioValue - startValue) / startValue) * 100 : 0
  const isPositive = change >= 0

  const width = 600
  const height = 240
  const padding = { top: 20, right: 10, bottom: 28, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((value, i) => ({
    x: padding.left + (i / Math.max(1, data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((value - baseValue) / range) * chartHeight,
  }))

  // Smooth cubic bezier curves
  const buildCurve = (pts: {x: number, y: number}[]) => {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = pts[i - 1]
      const cp1x = prev.x + (p.x - prev.x) / 2
      const cp1y = prev.y
      const cp2x = prev.x + (p.x - prev.x) / 2
      const cp2y = p.y
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`
    }).join(' ')
  }

  const linePath = buildCurve(points)
  
  const areaPath = [
    `M ${points[0].x} ${padding.top + chartHeight}`,
    ...points.map((p, i) => {
      if (i === 0) return `L ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cp1x = prev.x + (p.x - prev.x) / 2
      const cp1y = prev.y
      const cp2x = prev.x + (p.x - prev.x) / 2
      const cp2y = p.y
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`
    }),
    `L ${points[points.length - 1].x} ${padding.top + chartHeight}`,
    'Z',
  ].join(' ')

  const ticks = niceTicks.map((value) => ({
    label: fmtUsdCompact(value),
    ratio: range > 0 ? (value - baseValue) / range : 0,
  }))

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: fitValue(mode, {
          normal: TOKENS.spacing[4],
          tight: TOKENS.spacing[3],
          limit: TOKENS.spacing[2],
        }),
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.accent}`,
          paddingLeft: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
        }}>
          Portfolio value — last 12 months
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: TOKENS.spacing[3],
        }}>
          {change !== 0 && (
            <span style={{
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              color: isPositive ? TOKENS.colors.accent : TOKENS.colors.danger,
              fontFamily: TOKENS.fonts.mono,
              background: isPositive ? `${TOKENS.colors.accent}14` : `${TOKENS.colors.danger}14`,
              padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
              borderRadius: TOKENS.radius.full,
            }}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.wide,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
          }}>
            USD, daily
          </span>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TOKENS.colors.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={TOKENS.colors.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick, i) => {
            const yPos = padding.top + chartHeight * (1 - tick.ratio)
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke={tick.ratio === 0 ? TOKENS.colors.textSecondary : TOKENS.colors.borderMain}
                  strokeWidth={tick.ratio === 0 ? "1" : "0.5"}
                  strokeDasharray={tick.ratio === 0 ? "none" : "4,4"}
                />
                <text
                  x={padding.left - 12}
                  y={yPos + 4}
                  textAnchor="end"
                  fill={tick.ratio === 0 ? TOKENS.colors.textSecondary : TOKENS.colors.textGhost}
                  fontSize="11"
                  fontFamily={TOKENS.fonts.mono}
                  fontWeight={tick.ratio === 0 ? TOKENS.fontWeights.bold : TOKENS.fontWeights.regular}
                >
                  {tick.label}
                </text>
              </g>
            )
          })}

          <path d={areaPath} fill="url(#areaGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke={TOKENS.colors.accent}
            strokeWidth={TOKENS.chart.lineStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 4px 6px ${TOKENS.colors.accent}40)` }}
          />

          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={TOKENS.chart.dotRadius}
            fill={TOKENS.colors.accent}
            stroke={TOKENS.colors.black}
            strokeWidth={TOKENS.chart.dotStroke}
            style={{ filter: `drop-shadow(0 0 8px ${TOKENS.colors.accent})` }}
          />

          {labels.map((label, i) => {
            const x = padding.left + (i / Math.max(1, labels.length - 1)) * chartWidth
            const isFirst = i === 0
            const isLast = i === labels.length - 1
            return (
              <text
                key={`${label}-${i}`}
                x={x}
                y={height - 4}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fill={TOKENS.colors.textGhost}
                fontSize="10"
                fontFamily={TOKENS.fonts.mono}
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/** MaturityTimelineCompact — Ultra-compact timeline for unified panel */
function MaturityTimelineCompact({ vaults, mode }: { vaults: ActiveVault[]; mode: SmartFitMode }) {
  const items = vaults
    .map(v => ({ ...v, days: getDaysToMaturity(v.lockedUntil) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
      {/* Single line timeline with mini dots */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          whiteSpace: 'nowrap',
        }}>
          Maturity:
        </span>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          {items.map((v, i) => (
            <div key={v.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
            }}>
              <div style={{
                width: TOKENS.spacing[2],
                height: TOKENS.spacing[2],
                borderRadius: '50%',
                background: CHART_PALETTE[i % CHART_PALETTE.length],
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textSecondary,
                whiteSpace: 'nowrap',
              }}>
                {formatVaultName(v.name)} {v.days}d
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardSideCard({
  mode,
  title,
  actionLabel,
  onAction,
  children,
  noScroll = false,
}: {
  mode: SmartFitMode
  title: string
  actionLabel?: string
  onAction?: () => void
  children: ReactNode
  noScroll?: boolean
}) {
  const pad = fitValue(mode, {
    normal: TOKENS.spacing[5],
    tight: TOKENS.spacing[4],
    limit: TOKENS.spacing[3],
  })
  const headerGap = fitValue(mode, {
    normal: TOKENS.spacing[5],
    tight: TOKENS.spacing[4],
    limit: TOKENS.spacing[3],
  })

  return (
    <div style={{
      background: TOKENS.colors.black,
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: TOKENS.radius.lg,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: noScroll ? 'visible' : 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${pad}px ${pad}px 0`,
        marginBottom: headerGap,
        flexShrink: 0,
        height: 'var(--dashboard-card-header-height)',
        boxSizing: 'content-box',
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `var(--dashboard-card-border-accent-width) solid ${TOKENS.colors.accent}`,
          paddingLeft: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
        }}>
          {title}
        </span>
        {actionLabel ? (
          <CardAction label={actionLabel} onClick={onAction} />
        ) : null}
      </div>
      <div
        className={noScroll ? '' : 'hide-scrollbar'}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: noScroll ? 'visible' : 'auto',
          overflowX: noScroll ? 'visible' : 'hidden',
          padding: `0 ${pad}px ${pad}px`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function PanelEmptyMessage({ message }: { message: string }) {
  return (
    <div style={{
      padding: TOKENS.spacing[4],
      textAlign: 'center',
      color: TOKENS.colors.textGhost,
      fontSize: TOKENS.fontSizes.sm,
    }}>
      {message}
    </div>
  )
}

function ActivityRow({
  type,
  label,
  vaultName,
  amount,
  timestamp,
}: {
  type: string
  label: string
  vaultName: string
  amount: number
  timestamp: number
}) {
  const isNegative = type === 'withdraw'
  const accentColor = isNegative ? TOKENS.colors.danger : TOKENS.colors.accent

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `${TOKENS.spacing[4]} minmax(0, 1fr) auto`,
      gap: TOKENS.spacing[5],
      alignItems: 'center',
      padding: `${TOKENS.spacing[5]} 0`,
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      minWidth: 0,
    }}>
      {/* Tiny indicator */}
      <div style={{
        width: TOKENS.spacing[4],
        height: TOKENS.spacing[4],
        borderRadius: TOKENS.radius.full,
        background: `${accentColor}14`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accentColor,
        fontSize: TOKENS.activity.microFont,
        fontWeight: TOKENS.fontWeights.bold,
      }}>
        {activityGlyph(type)}
      </div>
      
      {/* Texts condensed */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textSecondary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {vaultName}
        </div>
      </div>

      {/* Amounts and Time */}
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: accentColor,
          letterSpacing: VALUE_LETTER_SPACING,
        }}>
          {isNegative ? '-' : '+'}{fmtUsdCompact(amount)}
        </div>
        <div style={{
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
        }}>
          {formatRelativeTime(timestamp)}
        </div>
      </div>
    </div>
  )
}

function activityGlyph(type: string) {
  switch (type) {
    case 'claim':
      return '↑'
    case 'withdraw':
      return '↓'
    default:
      return '•'
  }
}

function formatActivityType(type: string) {
  switch (type) {
    case 'claim':
      return 'Yield Claimed'
    case 'withdraw':
      return 'Withdrawal'
    default:
      return 'Deposit'
  }
}

function computeNextDailyDistribution(): { relative: string; absolute: string } {
  const now = new Date()
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ))

  const todayUtcDay = now.getUTCDate()
  const nextUtcDay = next.getUTCDate()
  const sameUtcMonth = now.getUTCMonth() === next.getUTCMonth() && now.getUTCFullYear() === next.getUTCFullYear()
  const isTomorrow = sameUtcMonth ? nextUtcDay === todayUtcDay + 1 : true

  const day = next.getUTCDate()
  const month = next.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const absolute = `${day} ${month} · 00:00 UTC`

  return {
    relative: isTomorrow ? 'Tomorrow' : absolute,
    absolute,
  }
}

function formatRelativeTime(timestamp: number) {
  const delta = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(delta / (1000 * 60))
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/** AvailableVaultTeaser — Card vault teaser */
function AvailableVaultTeaser({
  vault,
  index,
  mode,
  onClick,
}: {
  vault: AvailableVault
  index: number
  mode: SmartFitMode
  onClick?: () => void
}) {
  const accentColor = index === 0 ? TOKENS.colors.accent : TOKENS.colors.white
  const headerBg = `linear-gradient(135deg, ${TOKENS.colors.bgTertiary} 0%, ${TOKENS.colors.black} 100%)`

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: TOKENS.colors.black,
        borderRadius: TOKENS.radius.lg,
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: TOKENS.transitions.fast,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = accentColor
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = TOKENS.shadow.glowAccent
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Graphic Header */}
      <div style={{
        height: TOKENS.vault.headerHeight,
        background: headerBg,
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: TOKENS.vault.glowOffset,
          right: TOKENS.vault.glowOffset,
          width: TOKENS.vault.glowSize,
          height: TOKENS.vault.glowSize,
          background: accentColor,
          filter: `blur(${TOKENS.vault.glowBlur})`,
          opacity: TOKENS.vault.glowOpacity,
          borderRadius: TOKENS.radius.dot,
        }} />

        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: TOKENS.vault.gridOpacity,
          backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: `${TOKENS.vault.gridSize} ${TOKENS.vault.gridSize}`,
          backgroundPosition: 'center',
        }} />

        {/* Central Icon */}
        <div style={{
          width: TOKENS.vault.iconSize,
          height: TOKENS.vault.iconSize,
          borderRadius: TOKENS.radius.xs,
          background: `linear-gradient(135deg, ${TOKENS.colors.bgApp} 0%, ${TOKENS.colors.black} 100%)`,
          border: `1px solid ${accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: TOKENS.zIndex.raised,
          transform: 'rotate(45deg)',
          boxShadow: TOKENS.shadow.card,
        }}>
          <div style={{
            width: TOKENS.vault.gemSize,
            height: TOKENS.vault.gemSize,
            borderRadius: TOKENS.vault.gemBorderRadius,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
            transform: 'rotate(-45deg)',
          }} />
        </div>
      </div>

      {/* Content Body */}
      <div style={{
        padding: TOKENS.spacing[5],
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[3],
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textPrimary,
          textTransform: 'uppercase',
          letterSpacing: VALUE_LETTER_SPACING,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {formatVaultName(vault.name)}
        </span>
        
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: TOKENS.spacing[1],
        }}>
          <span style={{
            fontSize: TOKENS.fontSizes.lg,
            fontWeight: TOKENS.fontWeights.black,
            color: accentColor,
            letterSpacing: VALUE_LETTER_SPACING,
          }}>
            {vault.apr}%
          </span>
          <span style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textGhost,
            textTransform: 'uppercase',
          }}>
            APY
          </span>
        </div>
      </div>
    </div>
  )
}

