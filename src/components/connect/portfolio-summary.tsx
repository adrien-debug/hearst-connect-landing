'use client'

import { TOKENS, fmtUsdCompact } from './constants'
import type { VaultLine, Aggregate, ActiveVault } from './data'

export function PortfolioSummary({ vaults, agg }: { vaults: VaultLine[]; agg: Aggregate }) {
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
        padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]}`,
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        flexShrink: 0,
        background: TOKENS.colors.bgSurface,
      }}>
        <Label>Portfolio</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: TOKENS.spacing[12], alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: 'clamp(40px, 6vh, 72px)',
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: TOKENS.letterSpacing.tight,
              lineHeight: 0.95,
              color: TOKENS.colors.black,
            }}>
              {fmtUsdCompact(portfolioValue)}
            </div>
          </div>
          <HeroMetric label="Available Yield" value={fmtUsdCompact(agg.totalClaimable)} secondary={`${activeVaults.length} active positions`} />
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: TOKENS.spacing[8],
        gap: TOKENS.spacing[8],
        minHeight: 0,
        overflow: 'hidden',
      }}>
        <div style={{ flexShrink: 0 }}>
          <div>
            <Label>Resource Allocation</Label>
            <AllocationDonut vaults={activeVaults} total={agg.totalDeposited} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.95fr', gap: TOKENS.spacing[8], flexShrink: 0 }}>
          <div>
            <Label>Yield by Position</Label>
            <YieldChart vaults={activeVaults} />
          </div>
          <div>
            <Label>Next Distribution Window</Label>
            <MaturityPanel
              nextMaturity={nextMaturity}
              daysToNextMaturity={daysToNextMaturity}
              totalDeposited={agg.totalDeposited}
              avgApr={agg.avgApr}
              avgProgress={avgProgress}
              yieldShare={yieldShare}
            />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
            paddingBottom: TOKENS.spacing[2],
            borderBottom: `${TOKENS.borders.thick} solid ${TOKENS.colors.black}`,
            flexShrink: 0
          }}>
            {['Position', 'Principal', 'Current Value', 'Yield', 'Maturity'].map(h => (
              <span key={h} style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: TOKENS.colors.textGhost }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
            {activeVaults.map(v => <VaultRow key={v.id} vault={v} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function CapitalAllocation({ vaults, total }: { vaults: ActiveVault[]; total: number }) {
  return <AllocationDonut vaults={vaults} total={total} />
}

function VaultRow({ vault: v }: { vault: ActiveVault }) {
  const principal = Math.max(0, v.deposited - v.claimable)
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.2fr 1.1fr 1.1fr 1fr 1fr',
      padding: `${TOKENS.spacing[4]} 0`,
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{v.name}</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: TOKENS.colors.textSecondary }}>{v.strategy}</div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: TOKENS.colors.textSecondary }}>{fmtUsdCompact(principal)}</div>
      <div style={{ fontSize: '13px', fontWeight: 900 }}>{fmtUsdCompact(v.deposited)}</div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 900, color: TOKENS.colors.accent }}>{fmtUsdCompact(v.claimable)}</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: TOKENS.colors.textSecondary }}>{v.apr}% APY</div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700 }}>{v.maturity}</div>
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
  label,
  value,
  secondary,
}: {
  label: string
  value: string
  secondary: string
}) {
  return (
    <div style={{
      paddingLeft: TOKENS.spacing[6],
      borderLeft: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
    }}>
      <Label>{label}</Label>
      <div style={{
        fontSize: TOKENS.fontSizes.xl,
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

function YieldChart({ vaults }: { vaults: ActiveVault[] }) {
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
      padding: TOKENS.spacing[6],
      display: 'flex',
      flexDirection: 'column',
      gap: TOKENS.spacing[6],
      minHeight: '100%',
    }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '180px', display: 'block' }} aria-hidden="true">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: TOKENS.spacing[4] }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vaults.length || 1}, minmax(0, 1fr))`, gap: TOKENS.spacing[4] }}>
        {vaults.map((vault, index) => (
          <div key={vault.id} style={{ display: 'flex', alignItems: 'flex-start', gap: TOKENS.spacing[3] }}>
            <span style={{
              width: '12px',
              height: '12px',
              background: palette[index % palette.length],
              flexShrink: 0,
              marginTop: '2px',
            }} />
            <div>
              <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase' }}>
                {vault.name}
              </div>
              <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
                {fmtUsdCompact(vault.claimable)} current · {vault.target} target
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaturityPanel({
  nextMaturity,
  daysToNextMaturity,
  totalDeposited,
  avgApr,
  avgProgress,
  yieldShare,
}: {
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
      padding: TOKENS.spacing[6],
      background: TOKENS.colors.bgSurface,
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontSize: TOKENS.fontSizes.xl,
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
          marginBottom: TOKENS.spacing[6],
          lineHeight: 1.5,
        }}>
          {daysToNextMaturity} days until the earliest maturity.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: TOKENS.spacing[4] }}>
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

function AllocationDonut({ vaults, total }: { vaults: ActiveVault[]; total: number }) {
  const palette = [TOKENS.colors.accent, TOKENS.colors.black, TOKENS.colors.gray500]
  const size = 180
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offsetCursor = 0

  return (
    <div style={{
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      background: TOKENS.colors.bgSurface,
      padding: TOKENS.spacing[6],
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gap: TOKENS.spacing[8],
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
            fontSize: TOKENS.fontSizes.lg,
            fontWeight: TOKENS.fontWeights.black,
            color: TOKENS.colors.black,
          }}>
            {fmtUsdCompact(total)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
        {vaults.map((vault, index) => {
          const pct = total > 0 ? (vault.deposited / total) * 100 : 0
          return (
            <div key={vault.id} style={{ display: 'flex', alignItems: 'flex-start', gap: TOKENS.spacing[3] }}>
              <span style={{
                width: '12px',
                height: '12px',
                background: palette[index % palette.length],
                flexShrink: 0,
                marginTop: '2px',
              }} />
              <div>
                <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: TOKENS.fontWeights.black, textTransform: 'uppercase' }}>
                  {vault.name}
                </div>
                <div style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
                  {fmtUsdCompact(vault.deposited)} · {pct.toFixed(1)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
