'use client'

import { TOKENS, fmtUsdCompact } from './constants'
import type { VaultLine, Aggregate, ActiveVault } from './data'
import { fitValue, type SmartFitMode, useSmartFit } from './smart-fit'

export function PortfolioSummary({ vaults, agg }: { vaults: VaultLine[]; agg: Aggregate }) {
  const { mode } = useSmartFit({
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 940,
    limitWidth: 820,
    reserveHeight: 64,
    reserveWidth: 360,
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
  const shellPadding = fitValue(mode, {
    normal: TOKENS.spacing[6],
    tight: TOKENS.spacing[4],
    limit: TOKENS.spacing[3],
  })
  const shellGap = fitValue(mode, {
    normal: TOKENS.spacing[6],
    tight: TOKENS.spacing[4],
    limit: TOKENS.spacing[3],
  })
  const heroValueSize = fitValue(mode, {
    normal: TOKENS.fontSizes.xxxl,
    tight: TOKENS.fontSizes.xxxl,
    limit: TOKENS.fontSizes.xxl,
  })

  return (
    <div
      className="flex-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: TOKENS.colors.white,
        overflow: 'hidden',
        fontFamily: TOKENS.fonts.sans,
        height: '100%',
      }}
    >
      <div style={{
        padding: `${shellPadding} ${shellPadding}`,
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        flexShrink: 0,
        background: TOKENS.colors.bgSurface,
      }}>
        <Label>Portfolio</Label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: '1.35fr 0.9fr',
            tight: '1.28fr 0.9fr',
            limit: '1.12fr 0.82fr',
          }),
          gap: shellGap,
          alignItems: 'end',
        }}>
          <div>
            <div style={{
              fontSize: heroValueSize,
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: TOKENS.letterSpacing.tight,
              lineHeight: 0.95,
              color: TOKENS.colors.black,
            }}>
              {fmtUsdCompact(portfolioValue)}
            </div>
          </div>
          <HeroMetric mode={mode} label="Available Yield" value={fmtUsdCompact(agg.totalClaimable)} secondary={`${activeVaults.length} active positions`} />
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: shellPadding,
        gap: shellGap,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <div style={{ flexShrink: 0 }}>
          <Label>Resource Allocation</Label>
          <AllocationDonut mode={mode} vaults={activeVaults} total={agg.totalDeposited} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: '1.55fr 0.9fr',
            tight: '1.48fr 0.9fr',
            limit: '1.24fr 0.86fr',
          }),
          gap: shellGap,
          flexShrink: 0,
        }}>
          <div>
            <Label>Yield by Position</Label>
            <YieldChart mode={mode} vaults={activeVaults} />
          </div>
          <div>
            <Label>Next Distribution Window</Label>
            <MaturityPanel
              mode={mode}
              nextMaturity={nextMaturity}
              daysToNextMaturity={daysToNextMaturity}
              totalDeposited={agg.totalDeposited}
              avgApr={agg.avgApr}
              avgProgress={avgProgress}
              yieldShare={yieldShare}
            />
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          marginTop: fitValue(mode, {
            normal: `-${TOKENS.spacing[2]}`,
            tight: '0px',
            limit: '0px',
          }),
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
            paddingBottom: TOKENS.spacing[2],
            borderBottom: `${TOKENS.borders.thick} solid ${TOKENS.colors.black}`,
            flexShrink: 0,
          }}>
            {['Position', 'Principal', 'Current Value', 'Yield', 'Maturity'].map(h => (
              <span key={h} style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase', color: TOKENS.colors.textGhost }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
            {activeVaults.map(v => <VaultRow key={v.id} mode={mode} vault={v} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function VaultRow({ vault: v, mode }: { vault: ActiveVault; mode: SmartFitMode }) {
  const principal = Math.max(0, v.deposited - v.claimable)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
      padding: `${fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      })} 0`,
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase' }}>{v.name}</div>
        <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
          {mode === 'limit' ? `${v.apr}% APY` : v.strategy}
        </div>
      </div>
      <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>{fmtUsdCompact(principal)}</div>
      <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black }}>{fmtUsdCompact(v.deposited)}</div>
      <div>
        <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black, color: TOKENS.colors.accent }}>{fmtUsdCompact(v.claimable)}</div>
        {mode !== 'limit' && (
          <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>{v.apr}% APY</div>
        )}
      </div>
      <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.bold }}>{v.maturity}</div>
    </div>
  )
}

function Label({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase', color: TOKENS.colors.textSecondary, marginBottom: TOKENS.spacing[2], ...style }}>
      {children}
    </div>
  )
}

function HeroMetric({
  mode,
  label,
  value,
  secondary,
}: {
  mode: SmartFitMode
  label: string
  value: string
  secondary: string
}) {
  return (
    <div style={{
      paddingLeft: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      borderLeft: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
    }}>
      <Label>{label}</Label>
      <div style={{
        fontSize: fitValue(mode, {
          normal: TOKENS.fontSizes.lg,
          tight: TOKENS.fontSizes.md,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: '-0.03em',
        color: TOKENS.colors.black,
        marginBottom: TOKENS.spacing[2],
      }}>
        {value}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.medium,
        color: TOKENS.colors.textSecondary,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
      }}>
        {secondary}
      </div>
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
  const chartHeight = 160
  const leftPad = 20
  const rightPad = 16
  const topPad = 12
  const bottomPad = 28
  const palette = [TOKENS.colors.accent, TOKENS.colors.black, TOKENS.colors.gray500]

  const xFor = (index: number) => leftPad + ((chartWidth - leftPad - rightPad) / (points.length - 1)) * index
  const yFor = (value: number) => topPad + (chartHeight - topPad - bottomPad) * (1 - value / maxValue)

  return (
    <div style={{
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      background: TOKENS.colors.bgSurface,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      display: 'flex',
      flexDirection: 'column',
      gap: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[2],
      }),
      minHeight: '100%',
    }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: fitValue(mode, {
        normal: '148px',
        tight: '132px',
        limit: '116px',
      }), display: 'block' }} aria-hidden="true">
        {[0, 1, 2].map(index => (
          <line
            key={index}
            x1={xFor(index)}
            y1={topPad}
            x2={xFor(index)}
            y2={chartHeight - bottomPad}
            stroke={TOKENS.colors.gray200}
            strokeWidth="1"
          />
        ))}
        <line
          x1={leftPad}
          y1={chartHeight - bottomPad}
          x2={chartWidth - rightPad}
          y2={chartHeight - bottomPad}
          stroke={TOKENS.colors.black}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }) }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vaults.length || 1}, minmax(0, 1fr))`, gap: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }) }}>
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
              <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase' }}>
                {vault.name}
              </div>
              {mode !== 'limit' && (
                <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
                  {fmtUsdCompact(vault.claimable)} current · {vault.target} target
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaturityPanel({
  mode,
  nextMaturity,
  daysToNextMaturity,
  totalDeposited,
  avgApr,
  avgProgress,
  yieldShare,
}: {
  mode: SmartFitMode
  nextMaturity: string
  daysToNextMaturity: number
  totalDeposited: number
  avgApr: number
  avgProgress: number
  yieldShare: number
}) {
  const progressWidth = Math.max(4, Math.min(100, avgProgress))

  return (
    <div style={{
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      background: TOKENS.colors.bgSurface,
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.lg,
            tight: TOKENS.fontSizes.md,
            limit: TOKENS.fontSizes.md,
          }),
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: '-0.03em',
          color: TOKENS.colors.black,
          marginBottom: TOKENS.spacing[2],
        }}>
          {nextMaturity}
        </div>
        <div style={{
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.medium,
          color: TOKENS.colors.textSecondary,
          marginBottom: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[2],
          }),
          lineHeight: 1.5,
        }}>
          {daysToNextMaturity} days until the earliest maturity.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }) }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: TOKENS.spacing[2] }}>
            <span style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, letterSpacing: TOKENS.letterSpacing.display, textTransform: 'uppercase', color: TOKENS.colors.textSecondary }}>
              Portfolio Progress
            </span>
            <span style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.black }}>
              {avgProgress.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: '12px', background: TOKENS.colors.black, overflow: 'hidden' }}>
            <div style={{ width: `${progressWidth}%`, height: '100%', background: TOKENS.colors.accent }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fitValue(mode, {
          normal: TOKENS.spacing[3],
          tight: TOKENS.spacing[2],
          limit: TOKENS.spacing[2],
        }) }}>
          <StatCell label="Average Yield" value={`${avgApr.toFixed(2)}% APY`} accent />
          <StatCell label="Deployed Capital" value={fmtUsdCompact(totalDeposited)} />
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
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.md,
        fontWeight: TOKENS.fontWeights.black,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.black,
      }}>
        {value}
      </div>
    </div>
  )
}

function AllocationDonut({ vaults, total, mode }: { vaults: ActiveVault[]; total: number; mode: SmartFitMode }) {
  const palette = [TOKENS.colors.accent, TOKENS.colors.black, TOKENS.colors.gray500]
  const size = fitValue(mode, {
    normal: 144,
    tight: 128,
    limit: 112,
  })
  const strokeWidth = fitValue(mode, {
    normal: 20,
    tight: 18,
    limit: 16,
  })
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div style={{
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      background: TOKENS.colors.bgSurface,
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      display: 'grid',
      gridTemplateColumns: fitValue(mode, {
        normal: '176px 1fr',
        tight: '160px 1fr',
        limit: '136px 1fr',
      }),
      gap: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
      alignItems: 'center',
    }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TOKENS.colors.gray200}
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
            color: TOKENS.colors.black,
          }}>
            {fmtUsdCompact(total)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }) }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div key={vault.id} style={{ display: 'flex', alignItems: 'flex-start', gap: TOKENS.spacing[3] }}>
              <span style={{
                width: '10px',
                height: '10px',
                background: palette[index % palette.length],
                flexShrink: 0,
                marginTop: '2px',
              }} />
              <div>
                <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase' }}>
                  {vault.name}
                </div>
                <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
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
