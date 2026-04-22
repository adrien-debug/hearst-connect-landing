'use client'

import '@/styles/ui/tokens.css'
import { Label } from '@/components/ui/label'
import { EmptyState } from './empty-state'
import { TOKENS, fmtUsdCompact, fmtUsd, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import type { VaultLine, Aggregate, ActiveVault } from './data'
import { fitValue, type SmartFitMode, useSmartFit, useShellPadding } from './smart-fit'

export function PortfolioSummary({ vaults, agg }: { vaults: VaultLine[]; agg: Aggregate }) {
  const { mode } = useSmartFit({
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 940,
    limitWidth: 820,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const activeVaults = vaults.filter((v): v is ActiveVault => v.type === 'active')
  const maturedByDate = activeVaults
    .map(v => ({ ...v, maturityDate: new Date(v.maturity) }))
    .filter(v => !Number.isNaN(v.maturityDate.getTime()))
    .sort((a, b) => a.maturityDate.getTime() - b.maturityDate.getTime())
  const nextMaturity = maturedByDate[0]?.maturity ?? null
  const daysToNextMaturity = maturedByDate[0]
    ? Math.max(0, Math.ceil((maturedByDate[0].maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const portfolioValue = agg.totalDeposited + agg.totalClaimable
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  return (
    <div
      className="flex-1"
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
        {/* Top row — Context */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: TOKENS.spacing[3],
        }}>
          <Label id="port-overview" tone="scene" variant="text">
            Dashboard
          </Label>
          <div style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            {activeVaults.length} Active Position{activeVaults.length !== 1 ? 's' : ''}
            {nextMaturity && ` · Next: ${daysToNextMaturity}d`}
          </div>
        </div>

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
          {/* Net Value — Primary */}
          <CockpitGauge
            label="Net Value"
            value={fmtUsd(portfolioValue)}
            valueCompact={fmtUsdCompact(portfolioValue)}
            subtext={`${activeVaults.length} position${activeVaults.length !== 1 ? 's' : ''}`}
            mode={mode}
            primary
          />
          
          {/* Yield Earned — Accent */}
          <CockpitGauge
            label="Yield Earned"
            value={`+${fmtUsd(agg.totalClaimable)}`}
            valueCompact={`+${fmtUsdCompact(agg.totalClaimable)}`}
            subtext={`${agg.avgApr.toFixed(1)}% avg APY`}
            mode={mode}
            accent
          />
          
          {/* Performance / Maturity */}
          <CockpitGauge
            label="Performance"
            value={`${((agg.totalClaimable / (agg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            valueCompact={`${((agg.totalClaimable / (agg.totalDeposited || 1)) * 100).toFixed(1)}%`}
            subtext={nextMaturity ? `Next maturity: ${nextMaturity}` : 'All positions active'}
            mode={mode}
          />
        </div>
      </div>

      {/* Main content — Split layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: `${shellPadding}px`,
        gap: `${shellGap}px`,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Dashboard Grid — Donut + Vaults side by side on desktop */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: '320px 1fr',
            tight: '260px 1fr',
            limit: '1fr',
          }),
          gap: `${shellGap}px`,
          minHeight: 0,
          overflow: 'hidden',
        }}>
          {/* Left — Rich Analytics Panel */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${shellGap}px`,
            minHeight: 0,
            overflow: 'hidden',
          }}>
            {/* Top: Allocation Donut + Quick Stats */}
            <div style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: TOKENS.spacing[4],
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <AllocationDonut vaults={activeVaults} total={agg.totalDeposited} mode={mode} />
              
              {/* Mini stats row under donut */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[3],
                width: '100%',
                marginTop: TOKENS.spacing[4],
                paddingTop: TOKENS.spacing[4],
                borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
              }}>
                <MiniStat label="Avg Progress" value={`${Math.round(activeVaults.reduce((sum, v) => sum + v.progress, 0) / (activeVaults.length || 1))}%`} />
                <MiniStat label="Total Yield" value={`+${fmtUsdCompact(agg.totalClaimable)}`} accent />
              </div>
            </div>

            {/* Middle: Value Sparkline */}
            <div style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: TOKENS.spacing[4],
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
                marginBottom: TOKENS.spacing[3],
              }}>
                Value Trend (30D)
              </div>
              <SparklineChart 
                data={generateValueHistory(portfolioValue)} 
                mode={mode}
                accent
              />
              <SparklineLabels portfolioValue={portfolioValue} data={generateValueHistory(portfolioValue)} />
            </div>

            {/* Bottom: Maturity Timeline */}
            <div style={{
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              padding: TOKENS.spacing[4],
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
            }}>
              <div style={{
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
                marginBottom: TOKENS.spacing[3],
              }}>
                Maturity Timeline
              </div>
              <MaturityTimeline vaults={activeVaults} mode={mode} />
            </div>
          </div>

          {/* Right — Vault List */}
          <div style={{
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[3],
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
              marginBottom: TOKENS.spacing[4],
            }}>
              <Label id="positions" tone="scene" variant="text">
                Your Positions
              </Label>
              
              {/* Quick action buttons */}
              <div style={{
                display: 'flex',
                gap: TOKENS.spacing[2],
              }}>
                <button style={{
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                  background: 'var(--color-accent-subtle)',
                  border: `1px solid ${TOKENS.colors.accent}`,
                  borderRadius: 'var(--radius-md)',
                  color: TOKENS.colors.accent,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  textTransform: 'uppercase',
                  letterSpacing: TOKENS.letterSpacing.display,
                  cursor: 'pointer',
                }}>
                  Claim All
                </button>
              </div>
            </div>

            {/* Stacked bar mini */}
            <PortfolioStackBar vaults={activeVaults} total={agg.totalDeposited} mode={mode} />

            {/* Vault cards — scrollable */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginTop: TOKENS.spacing[4],
            }} className="hide-scrollbar">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[3],
              }}>
                {activeVaults.length === 0 ? (
                  <EmptyState
                    title="No open positions"
                    description="When you deploy capital, your positions will appear here."
                  />
                ) : (
                  activeVaults.map((vault, index) => (
                    <VaultCard key={vault.id} vault={vault} index={index} total={agg.totalDeposited} mode={mode} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** CockpitGauge — Large dashboard-style metric display */
function CockpitGauge({
  label,
  value,
  valueCompact,
  subtext,
  mode,
  primary = false,
  accent = false,
}: {
  label: string
  value: string
  valueCompact: string
  subtext: string
  mode: SmartFitMode
  primary?: boolean
  accent?: boolean
}) {
  const displayValue = mode === 'limit' ? valueCompact : value
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[2],
    }}>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fitValue(mode, {
          normal: primary ? TOKENS.fontSizes.xxl : TOKENS.fontSizes.xl,
          tight: primary ? TOKENS.fontSizes.xl : TOKENS.fontSizes.lg,
          limit: TOKENS.fontSizes.lg,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        lineHeight: LINE_HEIGHT.tight,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        fontFamily: primary ? TOKENS.fonts.mono : TOKENS.fonts.sans,
      }}>
        {displayValue}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textGhost,
        letterSpacing: '0.02em',
      }}>
        {subtext}
      </div>
    </div>
  )
}

/** AllocationDonut — Circular portfolio allocation chart */
function AllocationDonut({ vaults, total, mode }: { vaults: ActiveVault[]; total: number; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, '#FFFFFF', '#7A7A7A', '#5A5A5A', '#4A4A4A']
  const size = fitValue(mode, {
    normal: 200,
    tight: 160,
    limit: 140,
  })
  const strokeWidth = fitValue(mode, {
    normal: 24,
    tight: 20,
    limit: 16,
  })
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: TOKENS.spacing[4],
    }}>
      {/* Donut Chart */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
          aria-label="Portfolio allocation by vault"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          
          {/* Segments */}
          {vaults.map((vault, index) => {
            const pct = total > 0 ? vault.deposited / total : 0
            const dash = circumference * pct
            const segment = (
              <circle
                key={vault.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={palette[index % palette.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsetCursor}
                strokeLinecap="round"
              />
            )
            offsetCursor += dash
            return segment
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
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing[2],
        width: '100%',
      }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div 
              key={vault.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: TOKENS.spacing[3],
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing[2],
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: palette[index % palette.length],
                }} />
                <span style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textSecondary,
                }}>
                  {vault.name.replace('HashVault ', '')}
                </span>
              </div>
              <span style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
              }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Generate deterministic historical data for sparkline (seeded for SSR/client consistency) */
function generateValueHistory(currentValue: number): number[] {
  const points = 30
  const data: number[] = []
  let value = currentValue * 0.92
  // Seeded pseudo-random for SSR/client consistency
  let seed = 12345
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = 0; i < points; i++) {
    value = value + (currentValue - value) * (0.08 + seededRandom() * 0.04)
    data.push(value)
  }
  data[data.length - 1] = currentValue
  return data
}

/** SparklineLabels — Dynamic labels with calculated change */
function SparklineLabels({ portfolioValue, data }: { portfolioValue: number; data: number[] }) {
  const startValue = data[0]
  const change = ((portfolioValue - startValue) / startValue) * 100
  const isPositive = change >= 0
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: TOKENS.spacing[2],
      fontFamily: TOKENS.fonts.mono,
      fontSize: TOKENS.fontSizes.micro,
      color: TOKENS.colors.textGhost,
    }}>
      <span>30d ago</span>
      <span style={{ color: isPositive ? TOKENS.colors.accent : '#FFFFFF' }}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
      <span>Today</span>
    </div>
  )
}

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
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.md,
        fontWeight: TOKENS.fontWeights.black,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        letterSpacing: VALUE_LETTER_SPACING,
      }}>
        {value}
      </div>
    </div>
  )
}

/** SparklineChart — Pixel-perfect trend visualization */

/** SparklineChart — Clean minimal trend */
function SparklineChart({ data, mode, accent = false }: { data: number[]; mode: SmartFitMode; accent?: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const width = 200
  const height = 40
  
  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((value - min) / range) * height
  }))
  
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
      <path d={line} fill="none" stroke={accent ? TOKENS.colors.accent : '#FFFFFF'} strokeWidth="1.5" />
    </svg>
  )
}

/** MaturityTimeline — Clean minimal timeline */
function MaturityTimeline({ vaults, mode }: { vaults: ActiveVault[]; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, '#FFFFFF', '#9A9A9A', '#6A6A6A']
  const today = Date.now()
  
  const items = vaults
    .map(v => ({ ...v, days: Math.ceil((new Date(v.maturity).getTime() - today) / (1000 * 60 * 60 * 24)) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 4)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Timeline bar */}
      <div style={{ position: 'relative', height: '2px', background: '#333', margin: '16px 0' }}>
        {items.map((v, i) => {
          const pos = Math.min(100, (v.days / 365) * 100)
          return (
            <div key={v.id} style={{ position: 'absolute', left: `${pos}%`, top: '-5px', transform: 'translateX(-50%)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: palette[i % 4], border: '2px solid #000' }} />
            </div>
          )
        })}
      </div>
      
      {/* Vault list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((v, i) => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#0A0A0A', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette[i % 4] }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF' }}>{v.name.replace('HashVault ', '')}</span>
            </div>
            <span style={{ fontFamily: TOKENS.fonts.mono, fontSize: '11px', color: v.days < 30 ? TOKENS.colors.accent : '#9A9A9A' }}>{v.days}d</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortfolioStackBar({ vaults, total, mode }: { vaults: ActiveVault[]; total: number; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, '#FFFFFF', '#6A6A6A']
  const height = fitValue(mode, { normal: 24, tight: 20, limit: 16 })

  return (
    <div style={{ marginTop: TOKENS.spacing[4] }}>
      {/* The stacked bar */}
      <div style={{
        display: 'flex',
        height: `${height}px`,
        borderRadius: '4px',
        overflow: 'hidden',
        background: TOKENS.colors.black,
      }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div
              key={vault.id}
              style={{
                width: `${pct}%`,
                minWidth: pct > 0 ? '4px' : '0',
                background: palette[index % palette.length],
                transition: 'width 0.3s ease',
              }}
              title={`${vault.name}: ${pct.toFixed(1)}%`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: TOKENS.spacing[4],
        marginTop: TOKENS.spacing[3],
      }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div key={vault.id} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                background: palette[index % palette.length],
              }} />
              <span style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.textSecondary,
              }}>
                {vault.name.split(' ')[0]} <span style={{ color: TOKENS.colors.textPrimary }}>{pct.toFixed(0)}%</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Single vault card — enriched with Design System data */
function VaultCard({ vault, index, total, mode }: { vault: ActiveVault; index: number; total: number; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, '#FFFFFF', '#7A7A7A']
  const allocationPct = total > 0 ? (vault.deposited / total) * 100 : 0
  const color = palette[index % palette.length]
  
  // Derived metrics
  const yieldProgress = vault.deposited > 0 ? (vault.claimable / vault.deposited) * 100 : 0
  const daysToMaturity = Math.max(0, Math.ceil((new Date(vault.maturity).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const canWithdraw = vault.progress >= 100 && daysToMaturity <= 0
  
  return (
    <div style={{
      background: TOKENS.colors.black,
      borderRadius: 'var(--radius-lg)',
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      border: '1px solid var(--color-border-subtle)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: color,
      }} />
      
      {/* Header: Name + Badges + Value */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: TOKENS.spacing[3],
        marginTop: TOKENS.spacing[2],
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: TOKENS.spacing[2],
          }}>
            <div style={{
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              textTransform: 'uppercase',
              letterSpacing: VALUE_LETTER_SPACING,
            }}>
              {vault.name}
            </div>
            {/* Status badges */}
            {vault.progress >= 100 && (
              <span style={{
                padding: '2px 6px',
                background: 'var(--color-accent-subtle)',
                borderRadius: '4px',
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.accent,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
              }}>
                Target Reached
              </span>
            )}
            {daysToMaturity < 30 && daysToMaturity > 0 && (
              <span style={{
                padding: '2px 6px',
                background: 'rgba(251, 191, 36, 0.15)',
                borderRadius: '4px',
                fontSize: TOKENS.fontSizes.micro,
                fontWeight: TOKENS.fontWeights.bold,
                color: TOKENS.colors.white,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
              }}>
                Expiring Soon
              </span>
            )}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textSecondary,
          }}>
            {vault.target} target · {vault.apr}% APY
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: fitValue(mode, { normal: TOKENS.fontSizes.lg, tight: TOKENS.fontSizes.md, limit: TOKENS.fontSizes.md }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: VALUE_LETTER_SPACING,
            color: TOKENS.colors.textPrimary,
          }}>
            {fmtUsdCompact(vault.deposited)}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
          }}>
            {allocationPct.toFixed(1)}% ALLOC
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: TOKENS.spacing[3],
        padding: `${TOKENS.spacing[3]} 0`,
        borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
        marginBottom: TOKENS.spacing[3],
      }}>
        {/* Pending Rewards */}
        <div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
            marginBottom: TOKENS.spacing[2],
          }}>
            Pending
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.md,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.accent,
          }}>
            +{fmtUsdCompact(vault.claimable)}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            marginTop: TOKENS.spacing[2],
          }}>
            {yieldProgress.toFixed(1)}% of deposit
          </div>
        </div>
        
        {/* Progress to Target */}
        <div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
            marginBottom: TOKENS.spacing[2],
          }}>
            Progress
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.md,
            fontWeight: TOKENS.fontWeights.black,
            color: vault.progress >= 100 ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          }}>
            {vault.progress}%
          </div>
          <div style={{
            width: '100%',
            height: '3px',
            background: TOKENS.colors.black,
            marginTop: TOKENS.spacing[2],
            borderRadius: '2px',
          }}>
            <div style={{
              width: `${Math.min(100, vault.progress)}%`,
              height: '100%',
              background: vault.progress >= 100 ? TOKENS.colors.accent : color,
              borderRadius: '2px',
            }} />
          </div>
        </div>
        
        {/* Maturity / Lock Status */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textGhost,
            marginBottom: TOKENS.spacing[2],
          }}>
            {canWithdraw ? 'Available' : 'Locked'}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.black,
            color: canWithdraw ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
          }}>
            {canWithdraw ? 'Ready' : `${daysToMaturity}d`}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            marginTop: TOKENS.spacing[2],
          }}>
            {vault.maturity}
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Left: Strategy tag */}
        <div style={{
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {vault.strategy}
        </div>
        
        {/* Right: Actions */}
        <div style={{
          display: 'flex',
          gap: TOKENS.spacing[2],
        }}>
          {vault.claimable > 0 && (
            <button style={{
              padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
              background: 'var(--color-accent-subtle)',
              border: `1px solid ${TOKENS.colors.accent}`,
              borderRadius: 'var(--radius-sm)',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: TOKENS.letterSpacing.display,
              cursor: 'pointer',
            }}>
              Claim
            </button>
          )}
          <button style={{
            padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
            background: 'transparent',
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: 'var(--radius-sm)',
            color: TOKENS.colors.textSecondary,
            fontSize: TOKENS.fontSizes.micro,
            fontWeight: TOKENS.fontWeights.bold,
            textTransform: 'uppercase',
            letterSpacing: TOKENS.letterSpacing.display,
            cursor: 'pointer',
          }}>
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}
