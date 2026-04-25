'use client'

import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { EmptyState } from './empty-states'
import { VaultCardCompact } from './vault-card-compact'
import { TOKENS, fmtUsdCompact, fmtUsd, VALUE_LETTER_SPACING, CHART_PALETTE } from './constants'
import { formatVaultName } from './formatting'
import { buildPortfolioSparklineFromActivity, getDaysToMaturity } from './utils/portfolio-chart-utils'
import { fitValue, type SmartFitMode, useSmartFit, useShellPadding } from './smart-fit'
import { type VaultLine, type Aggregate, type ActiveVault, type AvailableVault } from './data'
import { useUserData } from '@/hooks/useUserData'

import { CockpitGauge } from './cockpit-gauge'

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
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 940,
    limitWidth: 820,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)
  const [mounted, setMounted] = useState(false)
  const [isClaimingAll, setIsClaimingAll] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { actions: userActions, activity: userActivity } = useUserData()

  const activeVaults = vaults.filter((v): v is ActiveVault => v.type === 'active')
  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')
  const maturedByDate = activeVaults
    .map(v => ({ ...v, lockedUntilMs: v.lockedUntil }))
    .sort((a, b) => a.lockedUntilMs - b.lockedUntilMs)
  const nextMaturity = maturedByDate[0]?.maturity ?? null
  // Use client-only values to prevent hydration mismatch
  const safeAgg = mounted ? agg : { totalDeposited: 0, totalClaimable: 0, avgApr: 0, activeVaults: 0 }
  const portfolioValue = safeAgg.totalDeposited + safeAgg.totalClaimable

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
  const valueHistory = useMemo(
    () => buildPortfolioSparklineFromActivity(userActivity, portfolioValue),
    [userActivity, portfolioValue],
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
    }))
  }, [activeVaults, portfolioValue])

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
            normal: `${shellPadding}px`,
            tight: `${shellPadding * 0.75}px`,
            limit: `${shellPadding * 0.5}px`,
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
          {/* Position Value — Primary */}
          <CockpitGauge
            label="Position Value"
            value={fmtUsd(portfolioValue)}
            valueCompact={fmtUsdCompact(portfolioValue)}
            subtext={`${mounted ? activeVaults.length : 0} position${(mounted ? activeVaults.length : 0) !== 1 ? 's' : ''}`}
            mode={mode}
            primary
            align="center"
          />

          {/* Accrued Yield — Accent */}
          <CockpitGauge
            label="Accrued Yield"
            value={`+${fmtUsd(safeAgg.totalClaimable)}`}
            valueCompact={`+${fmtUsdCompact(safeAgg.totalClaimable)}`}
            subtext={`${safeAgg.avgApr.toFixed(1)}% avg APY`}
            mode={mode}
            accent
            align="center"
          />
          
          {/* Performance / Maturity */}
          <CockpitGauge
            label="Performance"
            value={`${((safeAgg.totalClaimable / (safeAgg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            valueCompact={`${((safeAgg.totalClaimable / (safeAgg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            subtext={nextMaturity ? `Next maturity: ${nextMaturity}` : 'All positions active'}
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
          normal: '1fr 380px',
          tight: '1fr 320px',
          limit: '1fr',
        }),
        padding: `${shellPadding}px`,
        gap: `${shellGap}px`,
        minHeight: 0,
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
              normal: '260px 1fr',
              tight: '220px 1fr',
              limit: '1fr',
            }),
            gap: TOKENS.spacing[6],
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: TOKENS.spacing[6],
            minHeight: fitValue(mode, {
              normal: '340px',
              tight: '280px',
              limit: 'auto',
            }),
            flexShrink: 0,
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
                onSegmentClick={(vaultId) => onVaultSelect?.(vaultId)}
              />
              <div style={{
                display: 'flex',
                gap: TOKENS.spacing[6],
                marginTop: TOKENS.spacing[6],
              }}>
                <MiniStat
                  label="Progress"
                  value={`${mounted ? Math.round(activeVaults.reduce((sum, v) => sum + v.progress, 0) / (activeVaults.length || 1)) : 0}%`}
                />
                <MiniStat label="Yield" value={`+${fmtUsdCompact(safeAgg.totalClaimable)}`} accent />
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
        padding: `0 0 0`,
        marginBottom: TOKENS.spacing[8],
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `3px solid ${TOKENS.colors.accent}`,
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
                  activeVaults.map((vault, index) => (
                    <VaultCardCompact
                      key={vault.id}
                      vault={vault}
                      index={index}
                      total={safeAgg.totalDeposited}
                      mode={mode}
                      onClick={() => onVaultSelect?.(vault.id)}
                      onClaim={() => onVaultSelect?.(vault.id)}
                      onExit={() => onVaultSelect?.(vault.id)}
                    />
                  ))
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
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: TOKENS.spacing[5] 
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
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
}

/** AllocationDonut — Circular portfolio allocation chart with interactive tooltips */
function AllocationDonut({ 
  data, 
  total, 
  mode, 
  compact = false,
  onSegmentClick,
}: { 
  data: DonutVaultItem[]; 
  total: number; 
  mode: SmartFitMode; 
  compact?: boolean
  onSegmentClick?: (vaultId: string) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const size = compact
    ? fitValue(mode, { normal: 140, tight: 120, limit: 100 })
    : fitValue(mode, { normal: 200, tight: 160, limit: 140 })
  const strokeWidth = compact
    ? fitValue(mode, { normal: 18, tight: 16, limit: 14 })
    : fitValue(mode, { normal: 24, tight: 20, limit: 16 })
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
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                style={{
                  cursor: onSegmentClick ? 'pointer' : 'default',
                  transition: 'all 150ms ease-out',
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
              bottom: 'calc(100% + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: TOKENS.colors.bgTertiary,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              padding: `${TOKENS.spacing[3]}px ${TOKENS.spacing[4]}px`,
              boxShadow: 'var(--hc-shadow-lg)',
              zIndex: 10,
              pointerEvents: 'none',
              animation: 'fadeIn 150ms ease-out',
              minWidth: TOKENS.spacing[18],
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

      {/* Legend — clickable */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[2],
        width: '100%',
      }}>
        {data.slice(0, 4).map((vault) => (
          <div
            key={vault.id}
            onClick={() => onSegmentClick?.(vault.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: TOKENS.spacing[3],
              cursor: onSegmentClick ? 'pointer' : 'default',
              padding: `${TOKENS.spacing[2]}px`,
              borderRadius: TOKENS.radius.sm,
              transition: 'all 120ms ease-out',
              background: hoveredId === vault.id ? TOKENS.colors.bgTertiary : 'transparent',
            }}
            onMouseEnter={() => setHoveredId(vault.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
            }}>
              <div style={{
                width: TOKENS.spacing[2],
                height: TOKENS.spacing[2],
                borderRadius: '50%',
                background: vault.color,
              }} />
              <span style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: hoveredId === vault.id ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
                transition: 'color 120ms ease-out',
              }}>
                {formatVaultName(vault.name)}
              </span>
            </div>
            <span style={{
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
            }}>
              {vault.pct.toFixed(0)}%
            </span>
          </div>
        ))}
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
        letterSpacing: '0.1em',
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
function LineChartArea({ data, portfolioValue, mode }: { data: number[]; portfolioValue: number; mode: SmartFitMode }) {
  const isFlat = data.every(v => v === data[0])
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const startValue = data[0]
  const change = startValue > 0 ? ((portfolioValue - startValue) / startValue) * 100 : 0
  const isPositive = change >= 0

  const width = 400
  const height = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((value, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: isFlat
      ? padding.top + chartHeight * 0.3
      : padding.top + chartHeight - ((value - min) / range) * chartHeight,
  }))

  const areaPath = [
    `M ${points[0].x} ${padding.top + chartHeight}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${padding.top + chartHeight}`,
    'Z',
  ].join(' ')

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const yLabels = isFlat
    ? [fmtUsdCompact(portfolioValue)]
    : [fmtUsdCompact(min), fmtUsdCompact((min + max) / 2), fmtUsdCompact(max)]
  const yRatios = isFlat ? [0.7] : [0, 0.5, 1]

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: `0 0 0`,
        marginBottom: TOKENS.spacing[8],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `3px solid ${TOKENS.colors.accent}`,
          paddingLeft: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
        }}>
          Portfolio Value
        </span>
        {change !== 0 && (
          <span style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            color: isPositive ? TOKENS.colors.accent : TOKENS.colors.danger,
            fontFamily: TOKENS.fonts.mono,
          }}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TOKENS.colors.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={TOKENS.colors.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yRatios.map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke={TOKENS.colors.borderMain}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {yRatios.map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 5}
            y={padding.top + chartHeight * (1 - ratio) + 3}
            textAnchor="end"
            fill={TOKENS.colors.textGhost}
            fontSize="7"
            fontFamily={TOKENS.fonts.mono}
          >
            {yLabels[i]}
          </text>
        ))}

        <path d={areaPath} fill="url(#areaGradient)" />

        <path
          d={linePath}
          fill="none"
          stroke={TOKENS.colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={TOKENS.colors.accent}
          stroke={TOKENS.colors.black}
          strokeWidth="2"
        />

        <text x={padding.left} y={height - 5} fill={TOKENS.colors.textGhost} fontSize="7" fontFamily={TOKENS.fonts.mono}>
          Start
        </text>
        <text x={width - padding.right} y={height - 5} textAnchor="end" fill={TOKENS.colors.textGhost} fontSize="7" fontFamily={TOKENS.fonts.mono}>
          Today
        </text>
      </svg>
    </div>
  )
}

/** MaturityTimelineCompact — Ultra-compact timeline for unified panel */
function MaturityTimelineCompact({ vaults, mode }: { vaults: ActiveVault[]; mode: SmartFitMode }) {
  const items = vaults
    .map(v => ({ ...v, days: getDaysToMaturity(v.maturity) }))
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
    normal: TOKENS.spacing[8],
    tight: TOKENS.spacing[6],
    limit: TOKENS.spacing[4],
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
        marginBottom: TOKENS.spacing[8],
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          borderLeft: `3px solid ${TOKENS.colors.accent}`,
          paddingLeft: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
        }}>
          {title}
        </span>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            style={{
              padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
              background: 'transparent',
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              color: TOKENS.colors.textGhost,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              cursor: onAction ? 'pointer' : 'default',
            }}
          >
            {actionLabel}
          </button>
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
      gridTemplateColumns: `${TOKENS.spacing[4]} 1fr auto`,
      gap: TOKENS.spacing[5],
      alignItems: 'center',
      padding: `${TOKENS.spacing[5]} 0`,
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
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
        fontSize: '10px',
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
        transition: 'all 150ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = accentColor
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}1A`
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
        height: '72px',
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
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: accentColor,
          filter: 'blur(32px)',
          opacity: 0.15,
          borderRadius: '50%',
        }} />

        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
          backgroundPosition: 'center',
        }} />

        {/* Central Icon */}
        <div style={{
          width: TOKENS.spacing[8],
          height: TOKENS.spacing[8],
          borderRadius: TOKENS.radius.sm,
          background: `linear-gradient(135deg, ${TOKENS.colors.bgApp} 0%, ${TOKENS.colors.black} 100%)`,
          border: `1px solid ${accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          transform: 'rotate(45deg)',
          boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
        }}>
          <div style={{
            width: TOKENS.spacing[3],
            height: TOKENS.spacing[3],
            borderRadius: '2px',
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

