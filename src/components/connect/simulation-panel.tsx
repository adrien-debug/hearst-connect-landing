'use client'

import { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { TOKENS, MONO, fmtUsd, fmtUsdCompact, VALUE_LETTER_SPACING } from './constants'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'
import { RangeSlider } from './range-slider'
import { MetricTilesRow, MetricTile } from './projection-lens'
import {
  type ScenarioKey,
  projectScenario,
} from '@/lib/projection-simulation'

function formatCompactUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
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

  const { padding: pad, gap: shellGap } = useShellPadding(mode)
  const compact = isLimit || mode === 'tight'

  return (
    <div
      className="flex-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        color: TOKENS.colors.textPrimary,
        height: '100%',
        overflow: 'hidden',
        fontFamily: TOKENS.fonts.sans,
      }}
    >
      {/* COCKPIT HEADER — Same structure as dashboard */}
      <div
        style={{
          padding: fitValue(mode, {
            normal: `${pad}px`,
            tight: `${pad * 0.75}px`,
            limit: `${pad * 0.5}px`,
          }),
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* Top row — Context */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: TOKENS.spacing[3],
        }}>
          <div style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            {scenario.toUpperCase()} SCENARIO
          </div>
        </div>

        {/* Main cockpit gauges — Actual Metrics */}
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
          <CockpitGauge
            label="Projected Value"
            value={fmtUsd(active.totalValue)}
            valueCompact={fmtUsdCompact(active.totalValue)}
            subtext="Capital + Yield"
            mode={mode}
            primary
            align="center"
          />
          <CockpitGauge
            label="Cumulative Yield"
            value={`+${fmtUsd(active.cumulativeYield)}`}
            valueCompact={`+${fmtUsdCompact(active.cumulativeYield)}`}
            subtext={`${formatPercent(active.annualApr * 100)} APY`}
            mode={mode}
            accent
            align="center"
          />
          <CockpitGauge
            label="Implied BTC Price"
            value={fmtUsd(active.expectedPrice)}
            valueCompact={fmtUsdCompact(active.expectedPrice)}
            subtext="At maturity"
            mode={mode}
            align="center"
          />
        </div>
      </div>

      {/* Main content - Scrollable */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden', // Changed from auto to hidden to fit in screen
          padding: `${pad}px`,
          gap: `${shellGap}px`,
        }}
      >
        {/* Chart & Recap Grid */}
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
          {/* Left Column: Chart + Controls */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${shellGap}px`,
            minHeight: 0,
          }}>
            {/* Projection Chart */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: TOKENS.colors.black,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.lg,
                padding: fitValue(mode, {
                  normal: TOKENS.spacing[6],
                  tight: TOKENS.spacing[4],
                  limit: TOKENS.spacing[3],
                }),
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: TOKENS.spacing[4],
              }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Projected Path
                </span>
              </div>

              {/* Chart */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  background: 'transparent',
                  position: 'relative',
                }}
                aria-label="Projected value curves"
              >
                <div key={`${scenario}-${btcPrice}-${months}`} className="connect-panel-stage h-full">
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
                    <polyline points={series.bear} fill="none" stroke={scenario === 'bear' ? TOKENS.colors.accent : "rgba(255,255,255,0.2)"} strokeWidth={scenario === 'bear' ? "0.8" : "0.3"} />
                    <polyline points={series.base} fill="none" stroke={scenario === 'base' ? TOKENS.colors.accent : "rgba(255,255,255,0.2)"} strokeWidth={scenario === 'base' ? "0.8" : "0.3"} />
                    <polyline points={series.bull} fill="none" stroke={scenario === 'bull' ? TOKENS.colors.accent : "rgba(255,255,255,0.2)"} strokeWidth={scenario === 'bull' ? "0.8" : "0.3"} />
                  </svg>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: TOKENS.spacing[3],
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  color: TOKENS.colors.textGhost,
                }}
              >
                {series.steps.map((s) => (
                  <span key={s.id}>M{s.month}</span>
                ))}
              </div>
            </div>

            {/* Controls Panel */}
            <div
              style={{
                background: TOKENS.colors.black,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.lg,
                padding: fitValue(mode, {
                  normal: TOKENS.spacing[6],
                  tight: TOKENS.spacing[4],
                  limit: TOKENS.spacing[3],
                }),
                display: 'flex',
                flexDirection: 'column',
                gap: TOKENS.spacing[6],
                flexShrink: 0,
              }}
            >
              {/* Scenario Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: TOKENS.spacing[4] }}>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Market Scenario
                </span>
                <div style={{ 
                  display: 'flex', 
                  background: TOKENS.colors.bgTertiary, 
                  borderRadius: '24px', 
                  padding: '4px',
                  border: `1px solid ${TOKENS.colors.borderSubtle}`
                }}>
                  {(['bear', 'base', 'bull'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setScenario(s)}
                      style={{
                        padding: '6px 24px',
                        borderRadius: '20px',
                        background: scenario === s ? TOKENS.colors.accent : 'transparent',
                        color: scenario === s ? TOKENS.colors.black : TOKENS.colors.textSecondary,
                        fontSize: TOKENS.fontSizes.xs,
                        fontWeight: TOKENS.fontWeights.bold,
                        textTransform: 'uppercase',
                        letterSpacing: TOKENS.letterSpacing.display,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: scenario === s ? `0 2px 8px ${TOKENS.colors.accent}40` : 'none',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
                  gap: `${TOKENS.spacing[6]}px`,
                }}
              >
                <RangeSlider
                  id="btc-price"
                  label="BTC Price"
                  value={btcPrice}
                  min={40_000}
                  max={220_000}
                  step={1_000}
                  formatValue={fmtUsd}
                  minLabel="$40K"
                  maxLabel="$220K"
                  ariaLabel="Bitcoin price projection"
                  ariaValueText={(v) => `${fmtUsd(v)} per BTC`}
                  onChange={setBtcPrice}
                />
                <RangeSlider
                  id="horizon"
                  label="Horizon"
                  value={months}
                  min={3}
                  max={36}
                  step={1}
                  formatValue={(v) => `${v} mo`}
                  minLabel="3M"
                  maxLabel="36M"
                  ariaLabel="Time horizon projection"
                  ariaValueText={(v) => `${v} months`}
                  onChange={setMonths}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Recap Panel */}
          <div style={{
            background: TOKENS.colors.black,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[6],
              tight: TOKENS.spacing[4],
              limit: TOKENS.spacing[3],
            }),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}>
            <span style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textSecondary,
              marginBottom: TOKENS.spacing[4],
            }}>
              Projection Recap
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3], flex: 1, minHeight: 0, overflowY: 'auto' }} className="hide-scrollbar">
              <RecapRow label="Initial Deposit" value={fmtUsd(500000)} />
              <RecapRow label="Duration" value={`${months} Months`} />
              <RecapRow label="BTC Target" value={fmtUsd(active.expectedPrice)} />
              
              <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[1]}px 0`, flexShrink: 0 }} />
              
              <RecapRow label="Est. APY" value={formatPercent(active.annualApr * 100)} />
              <RecapRow label="Net Yield" value={`+${fmtUsd(active.cumulativeYield)}`} accent />
              
              <div style={{ height: 1, background: TOKENS.colors.borderSubtle, margin: `${TOKENS.spacing[1]}px 0`, flex: 1, minHeight: TOKENS.spacing[4] }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', flexShrink: 0 }}>
                <span style={{ 
                  fontSize: TOKENS.fontSizes.xs, 
                  fontWeight: TOKENS.fontWeights.bold,
                  color: TOKENS.colors.textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: TOKENS.letterSpacing.display,
                }}>
                  Total Value
                </span>
                <span style={{ 
                  fontSize: TOKENS.fontSizes.xl, 
                  fontWeight: TOKENS.fontWeights.black,
                  color: TOKENS.colors.textPrimary,
                  letterSpacing: VALUE_LETTER_SPACING,
                }}>
                  {fmtUsdCompact(active.totalValue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RecapRow({ label, value, accent, primary }: { label: string; value: string; accent?: boolean; primary?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ 
        fontSize: TOKENS.fontSizes.xs, 
        color: primary ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
        fontWeight: primary ? TOKENS.fontWeights.bold : 'normal',
      }}>
        {label}
      </span>
      <span style={{ 
        fontSize: primary ? TOKENS.fontSizes.md : TOKENS.fontSizes.sm, 
        fontWeight: TOKENS.fontWeights.bold,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
        letterSpacing: VALUE_LETTER_SPACING,
      }}>
        {value}
      </span>
    </div>
  )
}
