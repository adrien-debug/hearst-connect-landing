'use client'

import { useMemo, useState } from 'react'
import '@/styles/ui/tokens.css'
import { Label } from '@/components/ui/label'
import { EmptyState } from './empty-state'
import { VaultCardCompact } from './vault-card-compact'
import { TOKENS, fmtUsdCompact, fmtUsd, VALUE_LETTER_SPACING } from './constants'
import { formatVaultName } from './formatting'
import { generateValueHistory } from './utils/mock-data'
import { getDaysToMaturity } from './utils/date-utils'
import { CHART_PALETTE } from './constants/theme'
import { fitValue, type SmartFitMode, useSmartFit, useShellPadding } from './smart-fit'
import { type VaultLine, type Aggregate, type ActiveVault, type AvailableVault, type Activity, MOCK_ACTIVITIES } from './data'

import { CockpitGauge } from './cockpit-gauge'

import { AVAILABLE_VAULTS_VIEW_ID } from './view-ids'

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
  const activeVaults = vaults.filter((v): v is ActiveVault => v.type === 'active')
  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')
  const maturedByDate = activeVaults
    .map(v => ({ ...v, maturityDate: new Date(v.maturity) }))
    .filter(v => !Number.isNaN(v.maturityDate.getTime()))
    .sort((a, b) => a.maturityDate.getTime() - b.maturityDate.getTime())
  const nextMaturity = maturedByDate[0]?.maturity ?? null
  const daysToNextMaturity = maturedByDate[0]
    ? getDaysToMaturity(maturedByDate[0].maturity)
    : 0
  const portfolioValue = agg.totalDeposited + agg.totalClaimable
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // Memoized derived data — prevents recalculation on every render
  const valueHistory = useMemo(() => generateValueHistory(portfolioValue), [portfolioValue])
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
            subtext={`${activeVaults.length} position${activeVaults.length !== 1 ? 's' : ''}`}
            mode={mode}
            primary
            align="center"
          />

          {/* Accrued Yield — Accent */}
          <CockpitGauge
            label="Accrued Yield"
            value={`+${fmtUsd(agg.totalClaimable)}`}
            valueCompact={`+${fmtUsdCompact(agg.totalClaimable)}`}
            subtext={`${agg.avgApr.toFixed(1)}% avg APY`}
            mode={mode}
            accent
            align="center"
          />
          
          {/* Performance / Maturity */}
          <CockpitGauge
            label="Performance"
            value={`${((agg.totalClaimable / (agg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            valueCompact={`${((agg.totalClaimable / (agg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            subtext={nextMaturity ? `Next maturity: ${nextMaturity}` : 'All positions active'}
            mode={mode}
            align="center"
          />
        </div>
      </div>

      {/* Main content — Charts left, compact vaults right */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: `${shellPadding}px`,
        gap: `${shellGap}px`,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: '1fr 380px',
            tight: '1fr 320px',
            limit: '1fr',
          }),
          gap: `${shellGap}px`,
          minHeight: 0,
        }}>
          {/* Left — Analytics Charts */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${shellGap}px`,
            minHeight: 0,
          }}>
            {/* Top: Donut + Line Chart side by side on desktop */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: fitValue(mode, {
                normal: '200px 1fr',
                tight: '180px 1fr',
                limit: '1fr',
              }),
              gap: TOKENS.spacing[3],
              background: TOKENS.colors.black,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.lg,
              padding: TOKENS.spacing[3],
              flexShrink: 0,
            }}>
              {/* Donut - Compact */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <AllocationDonut 
                  data={donutData} 
                  total={portfolioValue}
                  mode={mode} 
                  compact
                  onSegmentClick={(vaultId) => onVaultSelect?.(vaultId)}
                />
                <div style={{
                  display: 'flex',
                  gap: TOKENS.spacing[3],
                  marginTop: TOKENS.spacing[2],
                }}>
                  <MiniStat label="Progress" value={`${Math.round(activeVaults.reduce((sum, v) => sum + v.progress, 0) / (activeVaults.length || 1))}%`} />
                  <MiniStat label="Yield" value={`+${fmtUsdCompact(agg.totalClaimable)}`} accent />
                </div>
              </div>

              {/* Line Chart - Full area */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                flex: 1,
              }}>
                <LineChartArea data={valueHistory} portfolioValue={portfolioValue} mode={mode} />
              </div>
            </div>

            {/* Bottom Left: Additional Insights / Activity (Fills the empty space) */}
            <div style={{
              flex: 1,
              background: TOKENS.colors.black,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.lg,
              padding: TOKENS.spacing[4],
              display: 'flex',
              flexDirection: 'column',
              gap: TOKENS.spacing[3],
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Available Vaults
                </span>
                {availableVaults.length > 3 && (
                  <button
                    onClick={onAvailableVaultsClick}
                    style={{
                      fontSize: TOKENS.fontSizes.xs,
                      color: TOKENS.colors.accent,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View all ({availableVaults.length})
                  </button>
                )}
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[2],
              }} className="hide-scrollbar">
                {availableVaults.length === 0 ? (
                  <div style={{
                    padding: TOKENS.spacing[4],
                    textAlign: 'center',
                    color: TOKENS.colors.textGhost,
                    fontSize: TOKENS.fontSizes.sm,
                  }}>
                    No vaults available
                  </div>
                ) : (
                  availableVaults.slice(0, 5).map((vault) => (
                    <AvailableVaultItem
                      key={vault.id}
                      vault={vault}
                      onClick={() => onVaultSelect?.(vault.id)}
                    />
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right — Smart Unified Panel */}
          <div style={{
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: `${TOKENS.spacing[4]}`,
              tight: `${TOKENS.spacing[3]}`,
              limit: `${TOKENS.spacing[3]}`,
            }),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}>
            {/* Header compact */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: TOKENS.spacing[2],
              padding: `0 ${TOKENS.spacing[2]}`,
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
              }}>
                Positions ({activeVaults.length})
              </span>
              <button
                disabled={agg.totalClaimable === 0}
                style={{
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                  background: agg.totalClaimable > 0 ? TOKENS.colors.accentSubtle : TOKENS.colors.bgTertiary,
                  border: `1px solid ${agg.totalClaimable > 0 ? TOKENS.colors.accent : TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                  color: agg.totalClaimable > 0 ? TOKENS.colors.accent : TOKENS.colors.textGhost,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  textTransform: 'uppercase',
                  cursor: agg.totalClaimable > 0 ? 'pointer' : 'not-allowed',
                  opacity: agg.totalClaimable > 0 ? 1 : 0.5,
                }}
              >
                Claim {agg.totalClaimable > 0 ? fmtUsdCompact(agg.totalClaimable) : 'All'}
              </button>
            </div>

            {/* Unified scrollable content */}
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }} className="hide-scrollbar">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[3],
              }}>
                {/* Vault list */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: TOKENS.spacing[2],
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
                        total={agg.totalDeposited}
                        mode={mode}
                        onClick={() => onVaultSelect?.(vault.id)}
                        onClaim={() => onVaultSelect?.(vault.id)}
                        onExit={() => onVaultSelect?.(vault.id)}
                      />
                    ))
                  )}
                </div>

                {/* Maturity Timeline - embedded in scroll area */}
                {activeVaults.length > 0 && (
                  <div style={{
                    paddingTop: TOKENS.spacing[2],
                    borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
                  }}>
                    <MaturityTimelineCompact 
                      vaults={activeVaults} 
                      mode={mode}
                    />
                  </div>
                )}

                {/* Available Vaults - embedded in scroll area */}
                {availableVaults.length > 0 && (
                  <div style={{
                    paddingTop: TOKENS.spacing[2],
                    borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: TOKENS.spacing[2],
                      padding: `0 ${TOKENS.spacing[2]}`,
                    }}>
                      <span style={{
                        fontFamily: TOKENS.fonts.mono,
                        fontSize: TOKENS.fontSizes.micro,
                        fontWeight: TOKENS.fontWeights.bold,
                        letterSpacing: TOKENS.letterSpacing.display,
                        textTransform: 'uppercase',
                        color: TOKENS.colors.textSecondary,
                      }}>
                        Available ({availableVaults.length})
                      </span>
                      <button
                        onClick={onAvailableVaultsClick}
                        style={{
                          padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                          background: 'transparent',
                          border: `1px solid ${TOKENS.colors.borderSubtle}`,
                          borderRadius: TOKENS.radius.md,
                          color: TOKENS.colors.textGhost,
                          fontSize: TOKENS.fontSizes.micro,
                          fontWeight: TOKENS.fontWeights.bold,
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.colors.accent
                          e.currentTarget.style.color = TOKENS.colors.accent
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
                          e.currentTarget.style.color = TOKENS.colors.textGhost
                        }}
                      >
                        View All
                      </button>
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: TOKENS.spacing[2],
                    }}>
                      {availableVaults.slice(0, 2).map((vault, index) => (
                        <AvailableVaultTeaser
                          key={vault.id}
                          vault={vault}
                          index={index}
                          mode={mode}
                          onClick={() => onVaultSelect?.(vault.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** ActivityItem — Renders a single activity feed item */
function ActivityItem({ activity }: { activity: Activity }) {
  const isPositive = activity.type === 'claim'
  const isNeutral = activity.type === 'system'
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: TOKENS.spacing[3],
      background: TOKENS.colors.bgTertiary,
      borderRadius: TOKENS.radius.sm,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: TOKENS.colors.black,
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPositive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
        }}>
          {activity.type === 'claim' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          {activity.type === 'deposit' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
          {activity.type === 'system' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textPrimary }}>
            {activity.title}
          </span>
          <span style={{ fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.textSecondary }}>
            {activity.vaultName || 'System'}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        {activity.amount && (
          <span style={{ 
            fontSize: TOKENS.fontSizes.sm, 
            fontWeight: TOKENS.fontWeights.black, 
            color: isPositive ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
            letterSpacing: VALUE_LETTER_SPACING
          }}>
            {isPositive ? '+' : ''}{fmtUsdCompact(activity.amount)}
          </span>
        )}
        <span style={{ fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textGhost }}>
          {Math.floor((Date.now() / 1000 - activity.timestamp) / 86400)}d ago
        </span>
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
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
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
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const startValue = data[0]
  const change = ((portfolioValue - startValue) / startValue) * 100
  const isPositive = change >= 0

  // Chart dimensions
  const width = 400
  const height = 120
  const padding = { top: 10, right: 10, bottom: 20, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Generate points
  const points = data.map((value, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((value - min) / range) * chartHeight,
  }))

  // Create area path
  const areaPath = [
    `M ${points[0].x} ${padding.top + chartHeight}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${padding.top + chartHeight}`,
    'Z',
  ].join(' ')

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Y-axis labels
  const yLabels = [min, (min + max) / 2, max].map((v) => fmtUsdCompact(v))

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: TOKENS.spacing[2],
      }}>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          color: TOKENS.colors.textSecondary,
        }}>
          Value Evolution (30D)
        </span>
        <span style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          color: isPositive ? TOKENS.colors.accent : TOKENS.colors.white,
        }}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TOKENS.colors.accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={TOKENS.colors.accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={width - padding.right}
            y2={padding.top + chartHeight * ratio}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, i) => (
          <text
            key={i}
            x={padding.left - 5}
            y={padding.top + chartHeight * (1 - ratio) + 3}
            textAnchor="end"
            fill={TOKENS.colors.textGhost}
            fontSize="9"
            fontFamily={TOKENS.fonts.mono}
          >
            {yLabels[i]}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={TOKENS.colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current value dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={TOKENS.colors.accent}
          stroke={TOKENS.colors.black}
          strokeWidth="2"
        />

        {/* X-axis labels */}
        <text x={padding.left} y={height - 5} fill={TOKENS.colors.textGhost} fontSize="9" fontFamily={TOKENS.fonts.mono}>
          30d ago
        </text>
        <text x={width - padding.right} y={height - 5} textAnchor="end" fill={TOKENS.colors.textGhost} fontSize="9" fontFamily={TOKENS.fonts.mono}>
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

/** AvailableVaultTeaser — Ultra-compact vault teaser */
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

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: TOKENS.colors.black,
        borderRadius: TOKENS.radius.md,
        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
        border: `1px solid ${TOKENS.colors.borderSubtle}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 120ms ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[2],
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = TOKENS.colors.accent
          e.currentTarget.style.background = TOKENS.colors.bgTertiary
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
        e.currentTarget.style.background = TOKENS.colors.black
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
        minWidth: 0,
      }}>
        <div style={{
          width: TOKENS.spacing[2],
          height: TOKENS.spacing[2],
          borderRadius: '50%',
          background: accentColor,
          flexShrink: 0,
        }} />
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
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          color: accentColor,
          letterSpacing: VALUE_LETTER_SPACING,
        }}>
          {vault.apr}%
        </span>
        <span style={{
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
        }}>
          APY
        </span>
      </div>
    </div>
  )
}

