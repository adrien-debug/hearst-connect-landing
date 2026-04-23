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
            {months} months · {fmtUsd(btcPrice)} BTC
          </div>
        </div>

        {/* Main cockpit gauges — 3 Scenarios */}
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
            label="Bear"
            value={formatPercent(projections.bear.annualApr * 100)}
            valueCompact={formatPercent(projections.bear.annualApr * 100)}
            subtext={`${formatCompactUsd(projections.bear.cumulativeYield)} yield`}
            mode={mode}
            primary={scenario === 'bear'}
            accent={scenario === 'bear'}
            onClick={() => setScenario('bear')}
            active={scenario === 'bear'}
            align="center"
          />
          <CockpitGauge
            label="Base"
            value={formatPercent(projections.base.annualApr * 100)}
            valueCompact={formatPercent(projections.base.annualApr * 100)}
            subtext={`${formatCompactUsd(projections.base.cumulativeYield)} yield`}
            mode={mode}
            primary={scenario === 'base'}
            accent={scenario === 'base'}
            onClick={() => setScenario('base')}
            active={scenario === 'base'}
            align="center"
          />
          <CockpitGauge
            label="Bull"
            value={formatPercent(projections.bull.annualApr * 100)}
            valueCompact={formatPercent(projections.bull.annualApr * 100)}
            subtext={`${formatCompactUsd(projections.bull.cumulativeYield)} yield`}
            mode={mode}
            primary={scenario === 'bull'}
            accent={scenario === 'bull'}
            onClick={() => setScenario('bull')}
            active={scenario === 'bull'}
            align="center"
          />
        </div>
      </div>

      {/* Sticky Controls Bar */}
      <div
        style={{
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          padding: `${pad}px`,
        }}
      >
        {/* Sliders - BTC & Horizon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
            gap: `${TOKENS.spacing[3]}px`,
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

      {/* Main content - Scrollable */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
          padding: `${pad}px`,
          gap: `${shellGap}px`,
        }}
      >
        {/* Projection Chart */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: isLimit ? 296 : 400,
            background: TOKENS.colors.bgSecondary,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[2],
            }),
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: TOKENS.spacing[3],
          }}>
            <Label id="proj-path" tone="scene" variant="text">
              Projected Path
            </Label>
            <div style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textGhost,
            }}>
              {months} months · {fmtUsd(btcPrice)} BTC
            </div>
          </div>

          {/* Chart */}
          <div
            style={{
              flex: 1,
              minHeight: isLimit ? 120 : 160,
              background: TOKENS.colors.bgTertiary,
              borderRadius: TOKENS.radius.lg,
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
                <polyline points={series.bear} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                <polyline points={series.base} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.45" />
                <polyline points={series.bull} fill="none" stroke={TOKENS.colors.accent} strokeWidth="0.5" />
              </svg>
            </div>
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

          {/* Metrics row */}
          <div style={{ marginTop: TOKENS.spacing[3] }}>
            <MetricTilesRow columns={4} compact={compact}>
              <MetricTile
                label="Yield"
                value={fmtUsd(active.cumulativeYield)}
                detail="Cumulative"
                compact={compact}
              />
              <MetricTile
                label="Total Value"
                value={fmtUsd(active.totalValue)}
                detail="Capital + yield"
                compact={compact}
              />
              <MetricTile
                label="Implied BTC"
                value={fmtUsd(active.expectedPrice)}
                detail="Target price"
                accent
                compact={compact}
              />
              <MetricTile
                label="Ticket"
                value="$500K"
                detail="Entry"
                compact={compact}
              />
            </MetricTilesRow>
          </div>
        </div>

      </div>
    </div>
  )
}
