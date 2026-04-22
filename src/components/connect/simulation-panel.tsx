'use client'

import { useMemo, useState } from 'react'
import { TOKENS, fmtUsd } from './constants'

type Scenario = 'bear' | 'base' | 'bull'

const TICKET = 500_000
const BASE_PRICE = 95_000
const BASE_APR = 0.12

const SCENARIOS: Record<Scenario, { label: string; multiplier: number; futureMove: number }> = {
  bear: { label: 'Bear', multiplier: 0.72, futureMove: -0.22 },
  base: { label: 'Base', multiplier: 1, futureMove: 0.08 },
  bull: { label: 'Bull', multiplier: 1.34, futureMove: 0.34 },
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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

function projectScenario(price: number, months: number, scenario: Scenario) {
  const config = SCENARIOS[scenario]
  const priceFactor = Math.pow(price / BASE_PRICE, 0.85)
  const annualApr = clamp(BASE_APR * config.multiplier * priceFactor, 0.05, 0.42)
  const monthlyYield = (TICKET * annualApr) / 12
  const cumulativeYield = monthlyYield * months
  const totalValue = TICKET + cumulativeYield
  const horizonFactor = 1 + months / 24
  const expectedPrice = price * (1 + config.futureMove * horizonFactor)

  return {
    annualApr,
    cumulativeYield,
    totalValue,
    expectedPrice,
  }
}

export function SimulationPanel() {
  const [scenario, setScenario] = useState<Scenario>('base')
  const [btcPrice, setBtcPrice] = useState(95_000)
  const [months, setMonths] = useState(18)

  const projections = useMemo(() => {
    return {
      bear: projectScenario(btcPrice, months, 'bear'),
      base: projectScenario(btcPrice, months, 'base'),
      bull: projectScenario(btcPrice, months, 'bull'),
    }
  }, [btcPrice, months])

  const activeProjection = projections[scenario]
  const maxYield = Math.max(
    projections.bear.cumulativeYield,
    projections.base.cumulativeYield,
    projections.bull.cumulativeYield,
  )

  const series = useMemo(() => {
    const steps = Array.from({ length: 6 }, (_, index) => {
      const stepMonths = Math.max(1, Math.round(((index + 1) / 6) * months))
      return {
        month: stepMonths,
        bear: projectScenario(btcPrice, stepMonths, 'bear').totalValue,
        base: projectScenario(btcPrice, stepMonths, 'base').totalValue,
        bull: projectScenario(btcPrice, stepMonths, 'bull').totalValue,
      }
    })

    const values = steps.flatMap((step) => [step.bear, step.base, step.bull])
    const min = Math.min(...values)
    const max = Math.max(...values)

    const toPoints = (key: 'bear' | 'base' | 'bull') =>
      steps
        .map((step, index) => {
          const x = (index / Math.max(steps.length - 1, 1)) * 100
          const y = max === min ? 50 : 100 - ((step[key] - min) / (max - min)) * 100
          return `${x},${y}`
        })
        .join(' ')

    return {
      steps,
      bear: toPoints('bear'),
      base: toPoints('base'),
      bull: toPoints('bull'),
    }
  }, [btcPrice, months])

  const btcDelta = ((btcPrice - BASE_PRICE) / BASE_PRICE) * 100

  return (
    <div
      className="flex-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: TOKENS.colors.white,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]}`,
          borderBottom: `${TOKENS.borders.heavy} solid ${TOKENS.colors.black}`,
          background: TOKENS.colors.bgSurface,
          flexShrink: 0,
        }}
      >
        <Label>Simulation</Label>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: TOKENS.spacing[8],
          }}
        >
          <div style={{ maxWidth: '760px' }}>
            <div
              style={{
                fontSize: TOKENS.fontSizes.display,
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: TOKENS.letterSpacing.tight,
                lineHeight: 0.92,
                textTransform: 'uppercase',
              }}
            >
              Product Projection Tool
            </div>
            <div
              style={{
                marginTop: TOKENS.spacing[4],
                fontSize: TOKENS.fontSizes.md,
                lineHeight: 1.6,
                color: TOKENS.colors.textSecondary,
                maxWidth: '680px',
              }}
            >
              Simule un contexte bear, base ou bull en fonction du prix BTC et de l’horizon. Les sorties sont
              illustratives pour la narration produit.
            </div>
          </div>

          <div
            style={{
              background: TOKENS.colors.accent,
              color: TOKENS.colors.black,
              padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[6]}`,
              minWidth: '240px',
            }}
          >
            <div
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                marginBottom: TOKENS.spacing[2],
              }}
            >
              Active Scenario
            </div>
            <div
              style={{
                fontSize: TOKENS.fontSizes.xl,
                fontWeight: TOKENS.fontWeights.black,
                textTransform: 'uppercase',
              }}
            >
              {SCENARIOS[scenario].label}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          minHeight: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            borderRight: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]}`,
            overflowY: 'auto',
            background: TOKENS.colors.bgSurface,
          }}
        >
          <Label>Scenario</Label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: TOKENS.borders.thin,
              background: TOKENS.colors.black,
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.black}`,
              marginBottom: TOKENS.spacing[8],
            }}
          >
            {(Object.keys(SCENARIOS) as Scenario[]).map((key) => {
              const isActive = scenario === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenario(key)}
                  style={{
                    border: TOKENS.borders.none,
                    background: isActive ? TOKENS.colors.accent : TOKENS.colors.white,
                    color: TOKENS.colors.black,
                    padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[3]}`,
                    cursor: 'pointer',
                    fontFamily: TOKENS.fonts.mono,
                    fontSize: TOKENS.fontSizes.xs,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                  }}
                >
                  {SCENARIOS[key].label}
                </button>
              )
            })}
          </div>

          <ControlBlock
            label="BTC Price"
            value={fmtUsd(btcPrice)}
            minLabel="$40K"
            maxLabel="$220K"
          >
            <input
              type="range"
              min={40_000}
              max={220_000}
              step={1_000}
              value={btcPrice}
              onChange={(event) => setBtcPrice(Number(event.target.value))}
              style={rangeStyle}
            />
          </ControlBlock>

          <ControlBlock
            label="Time Horizon"
            value={`${months} ${months > 1 ? 'Months' : 'Month'}`}
            minLabel="3M"
            maxLabel="36M"
          >
            <input
              type="range"
              min={3}
              max={36}
              step={1}
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              style={rangeStyle}
            />
          </ControlBlock>

          <div
            style={{
              marginTop: TOKENS.spacing[8],
              padding: TOKENS.spacing[6],
              background: TOKENS.colors.white,
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.black}`,
            }}
          >
            <Label>Model Inputs</Label>
            <InfoRow label="Ticket" value="$500,000" />
            <InfoRow label="Base BTC" value="$95,000" />
            <InfoRow label="BTC Delta" value={`${btcDelta >= 0 ? '+' : ''}${formatPercent(btcDelta)}`} />
          </div>
        </div>

        <div style={{ padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]}`, overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: TOKENS.borders.thin,
              background: TOKENS.colors.black,
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.black}`,
            }}
          >
            <ProjectionCard
              label="Scenario APR"
              value={formatPercent(activeProjection.annualApr * 100)}
              detail="Annualized yield estimate under the active market regime."
            />
            <ProjectionCard
              label="Projected Cash Yield"
              value={fmtUsd(activeProjection.cumulativeYield)}
              detail="Estimated cumulative yield over the selected horizon."
            />
            <ProjectionCard
              label="Projected Total Value"
              value={fmtUsd(activeProjection.totalValue)}
              detail="Starting capital plus projected cumulative yield."
            />
            <ProjectionCard
              label="Implied BTC Target"
              value={fmtUsd(activeProjection.expectedPrice)}
              detail="Illustrative future BTC level implied by the selected regime."
              accent
            />
          </div>

          <div
            style={{
              marginTop: TOKENS.spacing[8],
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.black}`,
              background: TOKENS.colors.white,
            }}
          >
            <div
              style={{
                padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]} ${TOKENS.spacing[6]}`,
                borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.black}`,
              }}
            >
              <Label>Projection Graph</Label>
              <div
                style={{
                  fontSize: TOKENS.fontSizes.xl,
                  fontWeight: TOKENS.fontWeights.black,
                  textTransform: 'uppercase',
                  marginBottom: TOKENS.spacing[2],
                }}
              >
                Yield Trajectory by Scenario
              </div>
              <div
                style={{
                  color: TOKENS.colors.textSecondary,
                  fontSize: TOKENS.fontSizes.sm,
                  lineHeight: 1.6,
                  maxWidth: '720px',
                }}
              >
                Le graphe compare la valeur totale projetee du ticket sur l’horizon choisi pour les trois regimes
                de marche.
              </div>
            </div>

            <div style={{ padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[8]}` }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 8',
                  background: TOKENS.colors.bgSurface,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  padding: TOKENS.spacing[6],
                }}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  {[20, 40, 60, 80].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke={TOKENS.colors.gray200}
                      strokeWidth="0.5"
                    />
                  ))}
                  <polyline
                    points={series.bear}
                    fill="none"
                    stroke={TOKENS.colors.gray500}
                    strokeWidth="2.5"
                  />
                  <polyline
                    points={series.base}
                    fill="none"
                    stroke={TOKENS.colors.black}
                    strokeWidth="2.5"
                  />
                  <polyline
                    points={series.bull}
                    fill="none"
                    stroke={TOKENS.colors.accent}
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: TOKENS.spacing[4],
                  marginTop: TOKENS.spacing[4],
                  color: TOKENS.colors.textSecondary,
                  fontFamily: TOKENS.fonts.mono,
                  fontSize: TOKENS.fontSizes.xs,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                }}
              >
                {series.steps.map((step) => (
                  <span key={step.month}>M{step.month}</span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: TOKENS.spacing[8],
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: TOKENS.spacing[4],
            }}
          >
            {(Object.keys(projections) as Scenario[]).map((key) => {
              const projection = projections[key]
              const width = maxYield > 0 ? Math.max((projection.cumulativeYield / maxYield) * 100, 10) : 10
              const isActive = key === scenario

              return (
                <div
                  key={key}
                  style={{
                    border: `${TOKENS.borders.thin} solid ${isActive ? TOKENS.colors.black : TOKENS.colors.borderSubtle}`,
                    padding: TOKENS.spacing[6],
                    background: isActive ? TOKENS.colors.bgSurface : TOKENS.colors.white,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: TOKENS.spacing[4],
                      marginBottom: TOKENS.spacing[4],
                    }}
                  >
                    <div
                      style={{
                        fontFamily: TOKENS.fonts.mono,
                        fontSize: TOKENS.fontSizes.xs,
                        fontWeight: TOKENS.fontWeights.bold,
                        letterSpacing: TOKENS.letterSpacing.display,
                        textTransform: 'uppercase',
                        borderLeft: `3px solid ${TOKENS.colors.accent}`,
                        paddingLeft: TOKENS.spacing[3],
                      }}
                    >
                      {SCENARIOS[key].label}
                    </div>
                    <div
                      style={{
                        fontFamily: TOKENS.fonts.mono,
                        fontSize: TOKENS.fontSizes.xs,
                        fontWeight: TOKENS.fontWeights.bold,
                        color: isActive ? TOKENS.colors.black : TOKENS.colors.textSecondary,
                        textTransform: 'uppercase',
                      }}
                    >
                      {formatPercent(projection.annualApr * 100)}
                    </div>
                  </div>

                  <div
                    style={{
                      height: '12px',
                      background: TOKENS.colors.black,
                      marginBottom: TOKENS.spacing[3],
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${width}%`,
                        background: TOKENS.colors.accent,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: TOKENS.fontSizes.lg,
                      fontWeight: TOKENS.fontWeights.black,
                      marginBottom: TOKENS.spacing[2],
                    }}
                  >
                    {formatCompactUsd(projection.cumulativeYield)}
                  </div>
                  <div
                    style={{
                      color: TOKENS.colors.textSecondary,
                      fontSize: TOKENS.fontSizes.sm,
                      lineHeight: 1.6,
                    }}
                  >
                    Total value {fmtUsd(projection.totalValue)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        borderLeft: `3px solid ${TOKENS.colors.accent}`,
        paddingLeft: TOKENS.spacing[3],
        marginBottom: TOKENS.spacing[4],
      }}
    >
      {children}
    </div>
  )
}

function ControlBlock({
  label,
  value,
  minLabel,
  maxLabel,
  children,
}: {
  label: string
  value: string
  minLabel: string
  maxLabel: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        paddingBottom: TOKENS.spacing[8],
        marginBottom: TOKENS.spacing[8],
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[4],
          marginBottom: TOKENS.spacing[4],
        }}
      >
        <Label>{label}</Label>
        <div
          style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.lg,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.tight,
          }}
        >
          {value}
        </div>
      </div>

      {children}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[4],
          marginTop: TOKENS.spacing[3],
          color: TOKENS.colors.textSecondary,
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}
      >
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

function ProjectionCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string
  value: string
  detail: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        background: accent ? TOKENS.colors.accent : TOKENS.colors.white,
        color: TOKENS.colors.black,
        padding: TOKENS.spacing[8],
        minHeight: '192px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[6],
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            borderLeft: `3px solid ${accent ? TOKENS.colors.black : TOKENS.colors.accent}`,
            paddingLeft: TOKENS.spacing[3],
            marginBottom: TOKENS.spacing[4],
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: TOKENS.fontSizes.xxl,
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            lineHeight: 0.95,
          }}
        >
          {value}
        </div>
      </div>

      <div
        style={{
          color: accent ? 'rgba(0,0,0,0.7)' : TOKENS.colors.textSecondary,
          fontSize: TOKENS.fontSizes.sm,
          lineHeight: 1.6,
        }}
      >
        {detail}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[4],
        padding: `${TOKENS.spacing[3]} 0`,
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
        fontSize: TOKENS.fontSizes.sm,
      }}
    >
      <span style={{ color: TOKENS.colors.textSecondary }}>{label}</span>
      <span
        style={{
          fontFamily: TOKENS.fonts.mono,
          fontWeight: TOKENS.fontWeights.bold,
        }}
      >
        {value}
      </span>
    </div>
  )
}

const rangeStyle: React.CSSProperties = {
  width: '100%',
  accentColor: TOKENS.colors.accent,
  cursor: 'pointer',
}
