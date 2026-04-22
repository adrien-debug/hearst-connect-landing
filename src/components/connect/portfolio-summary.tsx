'use client'

import { Label } from '@/components/ui/label'
import { EmptyState } from './empty-state'
import { CompressedMetricsStrip } from './compressed-metrics-strip'
import { TOKENS, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
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
  const nextMaturity = maturedByDate[0]?.maturity ?? '—'
  const daysToNextMaturity = maturedByDate[0]
    ? Math.max(0, Math.ceil((maturedByDate[0].maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const yieldShare = agg.totalDeposited > 0 ? (agg.totalClaimable / agg.totalDeposited) * 100 : 0
  const avgProgress = activeVaults.length > 0
    ? activeVaults.reduce((sum, vault) => sum + vault.progress, 0) / activeVaults.length
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
      {/* Header */}
      <div
        style={{
          padding: `${shellPadding}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        <Label id="port-overview" tone="scene" variant="text">
          Portfolio
        </Label>
        <div style={{ marginTop: `${shellGap}px` }}>
          <CompressedMetricsStrip
            mode={mode}
            items={[
              { id: 'net', label: 'Net position', value: fmtUsdCompact(portfolioValue) },
              { id: 'yield', label: 'Available yield', value: fmtUsdCompact(agg.totalClaimable), accent: true },
              ...(mode === 'normal'
                ? [{ id: 'pos', label: 'Active', value: String(activeVaults.length) }]
                : []),
            ]}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: `${shellPadding}px`,
        gap: `${shellGap}px`,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Resource Allocation — full width container */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[2],
          }),
          flexShrink: 0,
        }}>
          <Label id="alloc" tone="scene" variant="text">
            Resource allocation
          </Label>
          <AllocationDonut mode={mode} vaults={activeVaults} total={agg.totalDeposited} />
        </div>

        {/* Middle row — Yield Chart + Maturity */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: '1.6fr 0.9fr',
            tight: '1.5fr 0.9fr',
            limit: '1fr',
          }),
          gap: `${shellGap}px`,
          flexShrink: 0,
        }}>
          {/* Yield Chart */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[2],
            }),
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Label id="ychart" tone="scene" variant="text">
              Yield by position
            </Label>
            <YieldChart mode={mode} vaults={activeVaults} />
          </div>

          {/* Maturity Panel */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[2],
            }),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <Label id="maturity" tone="scene" variant="text">
                Next distribution
              </Label>
              <div style={{
                fontSize: fitValue(mode, {
                  normal: TOKENS.fontSizes.lg,
                  tight: TOKENS.fontSizes.md,
                  limit: TOKENS.fontSizes.md,
                }),
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: VALUE_LETTER_SPACING,
                color: TOKENS.colors.textPrimary,
                marginTop: TOKENS.spacing[3],
              }}>
                {nextMaturity}
              </div>
              <div style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.medium,
                color: TOKENS.colors.textSecondary,
                marginTop: TOKENS.spacing[2],
                lineHeight: LINE_HEIGHT.body,
              }}>
                {daysToNextMaturity} days until the earliest maturity.
              </div>
            </div>

            <div style={{ marginTop: TOKENS.spacing[4] }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: TOKENS.spacing[2],
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Portfolio Progress
                </span>
                <span style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textPrimary,
                }}>
                  {avgProgress.toFixed(0)}%
                </span>
              </div>
              <div style={{
                height: '12px',
                background: TOKENS.colors.black,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.max(4, Math.min(100, avgProgress))}%`,
                  height: '100%',
                  background: TOKENS.colors.accent,
                }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: TOKENS.spacing[3],
                marginTop: TOKENS.spacing[4],
              }}>
                <StatCell label="Average Yield" value={`${agg.avgApr.toFixed(2)}% APY`} accent />
                <StatCell label="Deployed" value={fmtUsdCompact(agg.totalDeposited)} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — Positions list */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[2],
          }),
          overflow: 'hidden',
        }}>
          <Label id="positions" tone="scene" variant="text">
            Active positions ({activeVaults.length})
          </Label>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
            paddingBottom: TOKENS.spacing[2],
            borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
            marginTop: TOKENS.spacing[3],
            flexShrink: 0,
          }}>
            {['Position', 'Principal', 'Current', 'Yield', 'Maturity'].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase' as const,
                  color: TOKENS.colors.textGhost,
                }}
              >
                {h}
              </span>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginTop: TOKENS.spacing[2] }} className="hide-scrollbar">
            {activeVaults.length === 0 ? (
              <EmptyState
                title="No open positions"
                description="When you deploy capital, positions will show here with live principal, yield, and maturity context."
              />
            ) : (
              activeVaults.map((v) => <VaultRow key={v.id} mode={mode} vault={v} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase' as const,
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.md,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
    </div>
  )
}

/** Vault row padding by mode */
const VAULT_ROW_PADDING: Record<SmartFitMode, string> = {
  normal: `${TOKENS.spacing[3]} 0`,
  tight: `${TOKENS.spacing[2]} 0`,
  limit: `${TOKENS.spacing[2]} 0`,
}

function VaultRow({ vault: v, mode }: { vault: ActiveVault; mode: SmartFitMode }) {
  const principal = Math.max(0, v.deposited - v.claimable)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
      padding: VAULT_ROW_PADDING[mode],
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      alignItems: 'center',
    }}>
      <div>
        <div style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase' as const,
          lineHeight: LINE_HEIGHT.tight,
          color: TOKENS.colors.textPrimary,
        }}>{v.name}</div>
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          lineHeight: LINE_HEIGHT.tight,
          color: TOKENS.colors.textSecondary,
        }}>
          {mode === 'limit' ? `${v.apr}% APY` : v.strategy}
        </div>
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.bold,
        lineHeight: LINE_HEIGHT.tight,
        color: TOKENS.colors.textSecondary,
      }}>{fmtUsdCompact(principal)}</div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        lineHeight: LINE_HEIGHT.tight,
        color: TOKENS.colors.textPrimary,
      }}>{fmtUsdCompact(v.deposited)}</div>
      <div>
        <div style={{
          fontSize: TOKENS.fontSizes.sm,
          fontWeight: TOKENS.fontWeights.black,
          lineHeight: LINE_HEIGHT.tight,
          color: TOKENS.colors.accent,
        }}>{fmtUsdCompact(v.claimable)}</div>
        {mode !== 'limit' && (
          <div style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            lineHeight: LINE_HEIGHT.tight,
            color: TOKENS.colors.textSecondary,
          }}>{v.apr}% APY</div>
        )}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.bold,
        lineHeight: LINE_HEIGHT.tight,
        color: TOKENS.colors.textPrimary,
      }}>{v.maturity}</div>
    </div>
  )
}

function YieldChart({ vaults, mode }: { vaults: ActiveVault[]; mode: SmartFitMode }) {
  const points = ['0%', 'Current', 'Target']
  const targetValues = vaults.map(v => {
    const targetPct = parseFloat(v.target.replace('%', '')) || 0
    return v.deposited * (targetPct / 100)
  })
  const maxValue = Math.max(...targetValues, ...vaults.map(v => v.claimable), 1)
  const chartWidth = 420
  const chartHeight = 140
  const leftPad = 20
  const rightPad = 16
  const topPad = 10
  const bottomPad = 24
  const palette = [TOKENS.colors.accent, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.28)']

  const xFor = (index: number) => leftPad + ((chartWidth - leftPad - rightPad) / (points.length - 1)) * index
  const yFor = (value: number) => topPad + (chartHeight - topPad - bottomPad) * (1 - value / maxValue)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }),
      marginTop: TOKENS.spacing[3],
    }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{
        width: '100%',
        height: fitValue(mode, { normal: '120px', tight: '100px', limit: '90px' }),
        display: 'block',
      }} aria-hidden="true">
        {[0, 1, 2].map(index => (
          <line
            key={index}
            x1={xFor(index)}
            y1={topPad}
            x2={xFor(index)}
            y2={chartHeight - bottomPad}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        ))}
        <line
          x1={leftPad}
          y1={chartHeight - bottomPad}
          x2={chartWidth - rightPad}
          y2={chartHeight - bottomPad}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />

        {vaults.map((vault, index) => {
          const targetPct = parseFloat(vault.target.replace('%', '')) || 0
          const targetYield = vault.deposited * (targetPct / 100)
          const linePoints = [
            [xFor(0), yFor(0)],
            [xFor(1), yFor(vault.claimable)],
            [xFor(2), yFor(targetYield)],
          ]
          const path = linePoints.map(([x, y], pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
          const stroke = palette[index % palette.length]

          return (
            <g key={vault.id}>
              <path d={path} fill="none" stroke={stroke} strokeWidth="3" />
              {linePoints.map(([x, y], pointIndex) => (
                <circle key={`${vault.id}-${pointIndex}`} cx={x} cy={y} r="4" fill={stroke} />
              ))}
            </g>
          )
        })}
      </svg>

      {/* X axis labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: TOKENS.spacing[3],
      }}>
        {points.map(point => (
          <div key={point} style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}>
            {point}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${vaults.length || 1}, minmax(0, 1fr))`,
        gap: TOKENS.spacing[3],
        marginTop: TOKENS.spacing[2],
      }}>
        {vaults.map((vault, index) => (
          <div key={vault.id} style={{ display: 'flex', alignItems: 'flex-start', gap: TOKENS.spacing[3] }}>
            <span style={{
              width: '10px',
              height: '10px',
              background: palette[index % palette.length],
              flexShrink: 0,
              marginTop: '2px',
            }} />
            <div>
              <div style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                textTransform: 'uppercase',
              }}>
                {vault.name}
              </div>
              {mode !== 'limit' && (
                <div style={{
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textSecondary,
                }}>
                  {fmtUsdCompact(vault.claimable)} · {vault.target}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AllocationDonut({ vaults, total, mode }: { vaults: ActiveVault[]; total: number; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.28)']
  const size = fitValue(mode, {
    normal: 128,
    tight: 112,
    limit: 96,
  })
  const strokeWidth = fitValue(mode, {
    normal: 18,
    tight: 16,
    limit: 14,
  })
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: fitValue(mode, {
        normal: '140px 1fr',
        tight: '120px 1fr',
        limit: '100px 1fr',
      }),
      gap: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[2],
      }),
      alignItems: 'center',
      marginTop: TOKENS.spacing[3],
    }}>
      {/* Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
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
              />
            )
            offsetCursor += dash
            return segment
          })}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
            marginBottom: TOKENS.spacing[2],
          }}>
            Deployed
          </div>
          <div style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.md,
              tight: TOKENS.fontSizes.sm,
              limit: TOKENS.fontSizes.sm,
            }),
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.textPrimary,
          }}>
            {fmtUsdCompact(total)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: fitValue(mode, {
          normal: TOKENS.spacing[3],
          tight: TOKENS.spacing[2],
          limit: TOKENS.spacing[2],
        }),
      }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div key={vault.id} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
              <span style={{
                width: '10px',
                height: '10px',
                background: palette[index % palette.length],
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.black,
                  textTransform: 'uppercase',
                  lineHeight: LINE_HEIGHT.tight,
                }}>
                  {vault.name}
                </div>
                <div style={{
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textSecondary,
                  marginTop: TOKENS.spacing[2],
                }}>
                  {mode === 'limit' ? `${pct.toFixed(0)}%` : `${fmtUsdCompact(vault.deposited)} · ${pct.toFixed(1)}%`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
