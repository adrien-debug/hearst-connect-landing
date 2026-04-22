'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsd, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { MetricTilesRow, MetricTile } from './projection-lens'
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
      className="min-h-0 flex-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        color: TOKENS.colors.textPrimary,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${pad}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        <Label id="sim-title" tone="scene" variant="text">
          Simulation
        </Label>
        <div style={{
          fontSize: fitValue(mode, {
            normal: TOKENS.fontSizes.xxxl,
            tight: TOKENS.fontSizes.xxl,
            limit: TOKENS.fontSizes.xl,
          }),
          fontWeight: TOKENS.fontWeights.black,
          textTransform: 'uppercase',
          letterSpacing: VALUE_LETTER_SPACING,
          lineHeight: LINE_HEIGHT.tight,
          color: TOKENS.colors.textPrimary,
          marginTop: TOKENS.spacing[2],
        }}>
          Projection Model
        </div>
      </div>

      {/* Main content - Single column layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          padding: `${pad}px`,
          gap: `${shellGap}px`,
        }}
      >
        {/* Top - Projection Chart */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: 'var(--color-bg-secondary)',
            
            padding: pad,
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: TOKENS.spacing[3],
          }}>
            <div>
              <div style={{
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                color: TOKENS.colors.textSecondary,
              }}>
                Projected Path
              </div>
              <div style={{
                fontSize: fitValue(mode, {
                  normal: TOKENS.fontSizes.lg,
                  tight: TOKENS.fontSizes.md,
                  limit: TOKENS.fontSizes.md,
                }),
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: VALUE_LETTER_SPACING,
                color: TOKENS.colors.textPrimary,
                marginTop: TOKENS.spacing[2],
              }}>
                {formatPercent(active.annualApr * 100)} APR
              </div>
            </div>
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
              background: TOKENS.colors.black,
              
              position: 'relative',
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

          {/* Metrics row */}
          <div style={{ marginTop: TOKENS.spacing[4] }}>
            <MetricTilesRow columns={4} compact={compact}>
              <MetricTile
                label="Yield"
                value={fmtUsd(active.cumulativeYield)}
                detail="Cumulative"
                compact={compact}
              />
              <MetricTile
                label="Total"
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

        {/* Bottom - Cockpit Controls */}
        <div
          style={{
            flexShrink: 0,
            background: 'var(--color-bg-secondary)',
            
            padding: pad,
          }}
        >
          {/* Scenario Selector - Large gauge buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: `${TOKENS.spacing[3]}px`,
              marginBottom: TOKENS.spacing[4],
            }}
          >
            {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
              const isActive = scenario === key
              const projection = projections[key]
              const yieldPercent = maxYield > 0 ? (projection.cumulativeYield / maxYield) * 100 : 33

              return (
                <button
                  key={`scenario-${key}`}
                  type="button"
                  onClick={() => setScenario(key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: isActive
                      ? 'var(--color-accent-subtle)'
                      : 'var(--color-bg-tertiary)',
                    border: isActive
                      ? `1px solid ${TOKENS.colors.accent}`
                      : `1px solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: '8px',
                    padding: TOKENS.spacing[4],
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Background gauge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${Math.max(15, yieldPercent)}%`,
                      background: isActive
                        ? 'var(--color-accent-subtle)'
                        : 'var(--color-bg-secondary)',
                      transition: 'height 300ms ease',
                    }}
                  />

                  {/* Content */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      letterSpacing: TOKENS.letterSpacing.display,
                      textTransform: 'uppercase',
                      color: isActive ? TOKENS.colors.accent : TOKENS.colors.textSecondary,
                      marginBottom: TOKENS.spacing[2],
                    }}>
                      {SCENARIOS[key].label}
                    </div>
                    <div style={{
                      fontSize: fitValue(mode, {
                        normal: TOKENS.fontSizes.xl,
                        tight: TOKENS.fontSizes.lg,
                        limit: TOKENS.fontSizes.md,
                      }),
                      fontWeight: TOKENS.fontWeights.black,
                      letterSpacing: VALUE_LETTER_SPACING,
                      color: isActive ? TOKENS.colors.textPrimary : 'var(--color-text-secondary)',
                    }}>
                      {formatPercent(projection.annualApr * 100)}
                    </div>
                    <div style={{
                      fontFamily: TOKENS.fonts.mono,
                      fontSize: TOKENS.fontSizes.micro,
                      color: isActive ? TOKENS.colors.textSecondary : 'var(--color-text-ghost)',
                      marginTop: TOKENS.spacing[2],
                    }}>
                      {formatCompactUsd(projection.cumulativeYield)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sliders - BTC & Horizon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
              gap: `${TOKENS.spacing[3]}px`,
            }}
          >
            {/* BTC Slider */}
            <div
              style={{
                background: 'var(--color-bg-tertiary)',
                
                borderRadius: '6px',
                padding: TOKENS.spacing[3],
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: TOKENS.spacing[2],
              }}>
                <span style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  BTC Price
                </span>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.md,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: VALUE_LETTER_SPACING,
                  color: TOKENS.colors.textPrimary,
                }}>
                  {fmtUsd(btcPrice)}
                </span>
              </div>
              <input
                type="range"
                min={40_000}
                max={220_000}
                step={1_000}
                value={btcPrice}
                onChange={(e) => setBtcPrice(Number(e.target.value))}
                style={rangeStyle}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: TOKENS.spacing[2],
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
              }}>
                <span>$40K</span>
                <span>$220K</span>
              </div>
            </div>

            {/* Horizon Slider */}
            <div
              style={{
                background: 'var(--color-bg-tertiary)',
                
                borderRadius: '6px',
                padding: TOKENS.spacing[3],
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: TOKENS.spacing[2],
              }}>
                <span style={{
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textSecondary,
                }}>
                  Horizon
                </span>
                <span style={{
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.md,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: VALUE_LETTER_SPACING,
                  color: TOKENS.colors.textPrimary,
                }}>
                  {months} mo
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={36}
                step={1}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                style={rangeStyle}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: TOKENS.spacing[2],
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
              }}>
                <span>3M</span>
                <span>36M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ l, v }: { l: string; v: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: TOKENS.fontSizes.sm,
      padding: `${TOKENS.spacing[2]} 0`,
      borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
    }}>
      <span style={{ color: TOKENS.colors.textSecondary }}>{l}</span>
      <span style={{
        fontFamily: TOKENS.fonts.mono,
        fontWeight: TOKENS.fontWeights.bold,
        color: TOKENS.colors.textPrimary,
      }}>{v}</span>
    </div>
  )
}
