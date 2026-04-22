'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsd, VALUE_LETTER_SPACING } from './constants'
import { useSmartFit, useShellPadding } from './smart-fit'
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

function RangeField({
  id,
  label,
  valueDisplay,
  minL,
  maxL,
  min,
  max,
  step,
  val,
  valueText,
  onChange,
}: {
  id: string
  label: string
  valueDisplay: string
  minL: string
  maxL: string
  min: number
  max: number
  step: number
  val: number
  valueText: string
  onChange: (n: number) => void
}) {
  return (
    <div
      className="bg-gradient-to-b from-transparent to-white/[0.02] pb-3"
      style={{ marginBottom: TOKENS.spacing[2] }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: TOKENS.spacing[3] }}>
        <div id={`${id}-l`} style={{ fontSize: TOKENS.fontSizes.xs, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: TOKENS.colors.textSecondary }}>
          {label}
        </div>
        <div style={{ fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.lg, fontWeight: 700, color: TOKENS.colors.textPrimary }} aria-hidden>
          {valueDisplay}
        </div>
      </div>
      <input
        id={`${id}-input`}
        type="range"
        role="slider"
        aria-labelledby={`${id}-l`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={val}
        aria-valuetext={valueText}
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        style={rangeStyle}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: TOKENS.spacing[2], color: TOKENS.colors.textSecondary, fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs, fontWeight: 700, letterSpacing: '0.12em' }}>
        <span>{minL}</span>
        <span>{maxL}</span>
      </div>
    </div>
  )
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
      const id = `projection-horizon-${i}-m${m}`
      return {
        id,
        month: m,
        bear: projectScenario(btcPrice, m, 'bear').totalValue,
        base: projectScenario(btcPrice, m, 'base').totalValue,
        bull: projectScenario(btcPrice, m, 'bull').totalValue,
      }
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
  const { padding: pad } = useShellPadding(mode)
  const compact = isLimit || mode === 'tight'

  return (
    <div
      className="min-h-0 flex-1"
      style={{ display: 'flex', flexDirection: 'column', background: 'transparent', color: TOKENS.colors.textPrimary, height: '100%', overflow: 'hidden' }}
    >
      {/* Main content area - 2 columns */}
      <div
        className="min-h-0 flex flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : 'minmax(200px,260px) minmax(0,1fr)',
          minHeight: 0,
        }}
      >
        {/* Left panel - Controls only (no scenario selector) */}
        <div
          className="hide-scrollbar flex min-h-0 flex-col overflow-auto bg-[#050505] bg-gradient-to-b from-[#050505] to-[#060606]/40"
          style={{
            gap: TOKENS.spacing[4],
            padding: pad,
          }}
        >
          <RangeField
            id="control-btc"
            label="BTC price"
            valueDisplay={fmtUsd(btcPrice)}
            minL="$40K"
            maxL="$220K"
            min={40_000}
            max={220_000}
            step={1_000}
            val={btcPrice}
            valueText={`${fmtUsd(btcPrice)} per bitcoin`}
            onChange={(n) => setBtcPrice(n)}
          />
          <RangeField
            id="control-horizon"
            label="Horizon"
            valueDisplay={`${months} mo`}
            minL="3M"
            maxL="36M"
            min={3}
            max={36}
            step={1}
            val={months}
            valueText={`${months} months`}
            onChange={(n) => setMonths(n)}
          />
          <div style={{ paddingTop: TOKENS.spacing[2] }}>
            <InfoRow l="Ticket" v="$500,000" />
            <InfoRow l="Base BTC" v="$95,000" />
            <InfoRow l="BTC delta" v={`${delta >= 0 ? '+' : ''}${formatPercent(delta)}`} />
          </div>
        </div>

        {/* Right panel - Projection display */}
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
                    <line
                      key={`chart-gridline-y-${y}`}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.3"
                    />
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
                {series.steps.map((s) => (
                  <span key={s.id}>M{s.month}</span>
                ))}
              </div>
            </div>
          </ProjectionLens>
        </div>
      </div>

      {/* Bottom horizontal scenario selector */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.3) 100%)',
          padding: `${TOKENS.spacing[3]} ${pad}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: TOKENS.spacing[2],
          }}
        >
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
            const isActive = scenario === key
            const projection = projections[key]
            return (
              <button
                key={`scenario-${key}`}
                type="button"
                onClick={() => setScenario(key)}
                style={{
                  flex: 1,
                  maxWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: TOKENS.spacing[2],
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(167,251,144,0.08) 0%, rgba(167,251,144,0.02) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: isActive
                    ? `inset 0 0 0 1px ${TOKENS.colors.accent}, 0 2px 8px rgba(167,251,144,0.1)`
                    : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                <span
                  style={{
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.xs,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
                  }}
                >
                  {SCENARIOS[key].label}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.fonts.sans,
                    fontSize: TOKENS.fontSizes.md,
                    fontWeight: TOKENS.fontWeights.black,
                    letterSpacing: VALUE_LETTER_SPACING,
                    color: isActive ? TOKENS.colors.textPrimary : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {formatPercent(projection.annualApr * 100)}
                </span>
                <span
                  style={{
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.micro,
                    color: isActive ? TOKENS.colors.textSecondary : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {formatCompactUsd(projection.cumulativeYield)}
                </span>
                {/* Mini progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '3px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: TOKENS.spacing[2],
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${maxYield > 0 ? (projection.cumulativeYield / maxYield) * 100 : 0}%`,
                      minWidth: '8%',
                      background: isActive ? TOKENS.colors.accent : 'rgba(255,255,255,0.25)',
                      borderRadius: '2px',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
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
