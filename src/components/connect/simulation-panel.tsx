'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsd } from './constants'
import { useSmartFit } from './smart-fit'
import { ProjectionLens, MetricTilesRow, MetricTile } from './projection-lens'
import {
  type ScenarioKey,
  SCENARIOS,
  projectScenario,
  PROJECTION_SIM_BASE_PRICE,
} from '@/lib/projection-simulation'

const rangeStyle: CSSProperties = {
  width: '100%',
  accentColor: TOKENS.colors.accent,
  cursor: 'pointer',
}

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function SimulationPanel() {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 700,
    limitHeight: 620,
    tightWidth: 1100,
    limitWidth: 1200,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const [scenario, setScenario] = useState<ScenarioKey>('base')
  const [btcPrice, setBtcPrice] = useState(95_000)
  const [months, setMonths] = useState(18)

  const projections = useMemo(
    () => ({
      bear: projectScenario(btcPrice, months, 'bear'),
      base: projectScenario(btcPrice, months, 'base'),
      bull: projectScenario(btcPrice, months, 'bull'),
    }),
    [btcPrice, months],
  )
  const active = projections[scenario]
  const maxYield = Math.max(
    projections.bear.cumulativeYield,
    projections.base.cumulativeYield,
    projections.bull.cumulativeYield,
  )

  const series = useMemo(() => {
    const steps = Array.from({ length: 6 }, (_, i) => {
      const m = Math.max(1, Math.round(((i + 1) / 6) * months))
      return { month: m, bear: projectScenario(btcPrice, m, 'bear').totalValue, base: projectScenario(btcPrice, m, 'base').totalValue, bull: projectScenario(btcPrice, m, 'bull').totalValue }
    })
    const all = steps.flatMap((s) => [s.bear, s.base, s.bull])
    const minV = Math.min(...all)
    const maxV = Math.max(...all)
    const line = (key: 'bear' | 'base' | 'bull') =>
      steps
        .map((s, j) => {
          const x = (j / Math.max(steps.length - 1, 1)) * 100
          const y = maxV === minV ? 50 : 100 - ((s[key] - minV) / (maxV - minV)) * 100
          return `${x},${y}`
        })
        .join(' ')
    return { steps, bear: line('bear'), base: line('base'), bull: line('bull') }
  }, [btcPrice, months])

  const delta = ((btcPrice - PROJECTION_SIM_BASE_PRICE) / PROJECTION_SIM_BASE_PRICE) * 100
  const pad = mode === 'limit' ? TOKENS.spacing[3] : mode === 'tight' ? TOKENS.spacing[4] : TOKENS.spacing[6]
  const compact = isLimit || mode === 'tight'

  return (
    <div
      className="min-h-0 flex-1"
      style={{ display: 'flex', flexDirection: 'column', background: TOKENS.colors.bgPage, color: TOKENS.colors.textPrimary, height: '100%', overflow: 'hidden' }}
    >
      <div
        className="min-h-0 flex flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : 'minmax(200px,260px) minmax(0,1fr)',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: TOKENS.spacing[4],
            borderRight: isLimit ? 'none' : `1px solid ${TOKENS.colors.borderSubtle}`,
            padding: pad,
            minHeight: 0,
            overflow: 'auto',
            background: TOKENS.colors.bgApp,
          }}
          className="hide-scrollbar"
        >
          <div>
            <Label id="sc-label" tone="scene" variant="text">
              Scenario
            </Label>
            <div
              style={{
                marginTop: TOKENS.spacing[2],
                display: 'flex',
                flexWrap: 'wrap',
                gap: TOKENS.spacing[2],
              }}
            >
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
                const isActive = scenario === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setScenario(key)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      letterSpacing: TOKENS.letterSpacing.display,
                      textTransform: 'uppercase' as const,
                      padding: `${TOKENS.spacing[2]} 0`,
                      boxShadow: isActive ? `inset 0 -1px 0 0 ${TOKENS.colors.accent}` : 'none',
                    }}
                  >
                    {SCENARIOS[key].label}
                  </button>
                )
              })}
            </div>
          </div>
          <ControlGroup label="BTC price" value={fmtUsd(btcPrice)} minL="$40K" maxL="$220K" id="control-btc">
            <input
              type="range"
              min={40_000}
              max={220_000}
              step={1_000}
              value={btcPrice}
              onChange={(e) => setBtcPrice(Number(e.target.value))}
              style={rangeStyle}
              aria-label="Bitcoin price in dollars"
            />
          </ControlGroup>
          <ControlGroup label="Horizon" value={`${months} mo`} minL="3M" maxL="36M" id="control-horizon">
            <input
              type="range"
              min={3}
              max={36}
              step={1}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              style={rangeStyle}
              aria-label="Time horizon in months"
            />
          </ControlGroup>
          <div style={{ paddingTop: TOKENS.spacing[2] }}>
            <InfoRow l="Ticket" v="$500,000" />
            <InfoRow l="Base BTC" v="$95,000" />
            <InfoRow l="BTC delta" v={`${delta >= 0 ? '+' : ''}${formatPercent(delta)}`} />
          </div>
        </div>
        <div
          className="min-h-0 flex-1"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            padding: pad,
          }}
        >
          <ProjectionLens
            kicker="Model"
            title="Projection"
            compact={compact}
            subtitle="Illustrative path — bear, base, and bull. Not investment advice."
          >
            <MetricTilesRow columns={2} compact={compact}>
              <MetricTile
                label="Scenario APR"
                value={formatPercent(active.annualApr * 100)}
                detail="Annualized yield (model)."
                compact={compact}
              />
              <MetricTile
                label="Cumulative yield"
                value={fmtUsd(active.cumulativeYield)}
                detail="Over the selected window."
                compact={compact}
              />
              <MetricTile
                label="Total notional"
                value={fmtUsd(active.totalValue)}
                detail="Capital plus modeled yield."
                compact={compact}
              />
              <MetricTile
                label="Implied BTC"
                value={fmtUsd(active.expectedPrice)}
                detail="Path sketch from regime."
                accent
                compact={compact}
              />
            </MetricTilesRow>
            <div
              className="min-h-0 flex-1"
              style={{
                marginTop: pad,
                minHeight: isLimit ? 100 : 140,
                maxHeight: isLimit ? 160 : 200,
                padding: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                }}
                aria-label="Projected value curves"
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                  {[20, 40, 60, 80].map((y) => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  ))}
                  <polyline points={series.bear} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                  <polyline points={series.base} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.45" />
                  <polyline points={series.bull} fill="none" stroke={TOKENS.colors.accent} strokeWidth="0.5" />
                </svg>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: TOKENS.spacing[2],
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  color: TOKENS.colors.textSecondary,
                }}
              >
                {series.steps.map((s, i) => (
                  <span key={`axis-${i}-${s.month}`}>M{s.month}</span>
                ))}
              </div>
            </div>
            <div
              className="hide-scrollbar"
              style={{ marginTop: pad, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: TOKENS.spacing[3], overflow: 'auto', maxHeight: isLimit ? 120 : 200 }}
            >
              {(Object.keys(projections) as ScenarioKey[]).map((k) => {
                const p = projections[k]
                const w = maxYield > 0 ? Math.max((p.cumulativeYield / maxYield) * 100, 8) : 8
                return (
                  <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: 700, color: k === scenario ? TOKENS.colors.accent : TOKENS.colors.textSecondary }}>
                        {SCENARIOS[k].label}
                      </span>
                      <span style={{ fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.textGhost }}>
                        {formatPercent(p.annualApr * 100)}
                      </span>
                    </div>
                    <div
                      style={{ height: 6, background: 'rgba(0,0,0,0.45)' }}
                    >
                      <div style={{ width: `${w}%`, height: '100%', background: k === scenario ? TOKENS.colors.accent : 'rgba(255,255,255,0.25)' }} />
                    </div>
                    <div style={{ fontSize: TOKENS.fontSizes.sm, fontWeight: 800, color: TOKENS.colors.textPrimary }}>{formatCompactUsd(p.cumulativeYield)}</div>
                    <div style={{ fontSize: TOKENS.fontSizes.micro, color: TOKENS.colors.textSecondary, lineHeight: 1.35 }}>Notional {fmtUsd(p.totalValue)}</div>
                  </div>
                )
              })}
            </div>
          </ProjectionLens>
        </div>
      </div>
    </div>
  )
}

function ControlGroup({
  label,
  value,
  minL,
  maxL,
  id,
  children,
}: {
  label: string
  value: string
  minL: string
  maxL: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        paddingBottom: TOKENS.spacing[3],
        marginBottom: TOKENS.spacing[2],
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: TOKENS.spacing[3] }}
      >
        <div id={`${id}-l`} style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: TOKENS.colors.textSecondary }}>
          {label}
        </div>
        <div style={{ fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.lg, fontWeight: 700, color: TOKENS.colors.textPrimary }} aria-describedby={`${id}-l`}>
          {value}
        </div>
      </div>
      {children}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: TOKENS.spacing[2], color: TOKENS.colors.textSecondary, fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs, fontWeight: 700, letterSpacing: '0.12em' }}>
        <span>{minL}</span>
        <span>{maxL}</span>
      </div>
    </div>
  )
}

function InfoRow({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: TOKENS.fontSizes.sm, padding: `${TOKENS.spacing[2]} 0` }}>
      <span style={{ color: TOKENS.colors.textSecondary }}>{l}</span>
      <span style={{ fontFamily: TOKENS.fonts.mono, fontWeight: 700 }}>{v}</span>
    </div>
  )
}
