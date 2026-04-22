'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsd, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import { MonthlyGauge } from './monthly-gauge'
import { CompressedMetricsStrip } from './compressed-metrics-strip'
import type { ActiveVault, MaturedVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'

export function VaultDetailPanel({ vault }: { vault: ActiveVault | MaturedVault }) {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 760,
    limitHeight: 680,
    tightWidth: 1100,
    limitWidth: 1200,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const currentValue = vault.deposited + vault.claimable
  const status = vault.type === 'matured' ? 'Matured' : 'Active'
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // Compute additional metrics
  const totalTargetYield = vault.deposited * (parseFloat(vault.target) / 100)
  const remainingToTarget = Math.max(0, totalTargetYield - vault.claimable)
  const progressToTarget = vault.progress
  const daysRemaining = Math.ceil((new Date(vault.maturity).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const isMatured = vault.type === 'matured'

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
      {/* Header — Position + Value */}
      <div
        style={{
          padding: `${shellPadding}px`,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Label id="pos-detail" tone="scene" variant="text">
              Position
            </Label>
            <div style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.xxxl,
                tight: TOKENS.fontSizes.xxl,
                limit: TOKENS.fontSizes.xl,
              }),
              fontWeight: TOKENS.fontWeights.black,
              textTransform: 'uppercase',
              marginTop: TOKENS.spacing[2],
              lineHeight: LINE_HEIGHT.tight,
              letterSpacing: VALUE_LETTER_SPACING,
            }}>
              {vault.name}
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              marginTop: TOKENS.spacing[2],
              lineHeight: LINE_HEIGHT.body,
            }}>
              {vault.strategy}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: fitValue(mode, {
                normal: TOKENS.fontSizes.xxxl,
                tight: TOKENS.fontSizes.xxl,
                limit: TOKENS.fontSizes.xl,
              }),
              fontWeight: TOKENS.fontWeights.black,
              letterSpacing: VALUE_LETTER_SPACING,
              color: TOKENS.colors.textPrimary,
            }}>
              {fmtUsd(currentValue)}
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: TOKENS.letterSpacing.display,
              color: TOKENS.colors.accent,
              marginTop: TOKENS.spacing[2],
            }}>
              {status}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: shellPadding,
        gap: shellGap,
        minHeight: 0,
        overflow: 'hidden',
      }}>
        {/* Primary metrics strip */}
        <CompressedMetricsStrip
          mode={mode}
          items={[
            { id: 'p', label: 'Principal', value: fmtUsdCompact(vault.deposited) },
            { id: 'y', label: 'Available yield', value: fmtUsdCompact(vault.claimable), accent: true },
            { id: 't', label: 'Target', value: vault.target },
            { id: 'm', label: 'Maturity', value: vault.maturity },
          ]}
        />

        {/* Secondary metrics — detailed stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: fitValue(mode, {
            normal: 'repeat(4, 1fr)',
            tight: 'repeat(2, 1fr)',
            limit: '1fr',
          }),
          gap: TOKENS.spacing[2],
          flexShrink: 0,
        }}>
          <StatCard
            label="Target yield"
            value={fmtUsdCompact(totalTargetYield)}
            subtext={`${vault.target} of principal`}
            mode={mode}
          />
          <StatCard
            label="Remaining"
            value={fmtUsdCompact(remainingToTarget)}
            subtext={`${progressToTarget}% complete`}
            mode={mode}
            accent
          />
          <StatCard
            label="APY"
            value={`${vault.apr}%`}
            subtext="Annual yield"
            mode={mode}
          />
          <StatCard
            label={isMatured ? 'Matured' : 'Days left'}
            value={isMatured ? 'Complete' : String(Math.max(0, daysRemaining))}
            subtext={isMatured ? 'Ready to withdraw' : 'Until maturity'}
            mode={mode}
          />
        </div>

        {/* Target progress */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: TOKENS.spacing[2],
            alignItems: 'baseline',
          }}>
            <Label id="tp-label" tone="scene" variant="text">
              Target progress
            </Label>
            <span
              style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                color: TOKENS.colors.textSecondary,
              }}
              aria-label={`${vault.progress} percent of ${vault.target} target`}
            >
              {vault.progress}% of {vault.target}
            </span>
          </div>
          <div
            style={{
              height: 12,
              background: TOKENS.colors.black,
              overflow: 'hidden',
              marginBottom: TOKENS.spacing[2],
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${vault.progress}%`,
                background: TOKENS.colors.accent,
                transition: 'width 1s ease',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              color: TOKENS.colors.textSecondary,
              lineHeight: LINE_HEIGHT.body,
            }}
          >
            Capital unlocks when {vault.target} cumulative target is reached or at maturity.
            {remainingToTarget > 0 && (
              <span> {fmtUsdCompact(remainingToTarget)} remaining to reach target.</span>
            )}
          </div>
        </div>

        {/* Month distribution */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <Label id="mo-label" tone="scene" variant="text">
            Month distribution
          </Label>
          <div style={{ marginTop: TOKENS.spacing[3] }}>
            <MonthlyGauge deposited={vault.deposited} apr={vault.apr} mode={mode} />
          </div>
        </div>

        {/* Performance history — new section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
          gap: shellGap,
          flex: 1,
          minHeight: 0,
        }}>
          <NarrativeBlock
            kicker="Capital rule"
            body="Safeguard active — not triggered. If principal falls below the initial deposit at maturity, the infrastructure layer can extend the recovery window."
            mode={mode}
          />
          <NarrativeBlock
            kicker="Strategy"
            body={!isLimit ? vault.strategy : `${vault.apr}% · ${vault.progress}% · ${vault.target}`}
            mode={mode}
            isMono={isLimit}
          />
        </div>

        {/* Capital Protection Visual */}
        <CapitalProtectionGauge 
          deposited={vault.deposited} 
          currentValue={currentValue}
          mode={mode} 
        />

        {/* Performance History Chart */}
        <PerformanceHistoryChart 
          deposited={vault.deposited}
          claimable={vault.claimable}
          apr={vault.apr}
          daysRemaining={daysRemaining}
          mode={mode}
        />
      </div>
    </div>
  )
}

/** CapitalProtectionGauge — Visual capital safeguard indicator */
function CapitalProtectionGauge({ 
  deposited, 
  currentValue,
  mode 
}: { 
  deposited: number
  currentValue: number
  mode: SmartFitMode 
}) {
  const protectionLevel = Math.min(100, (currentValue / deposited) * 100)
  const isProtected = currentValue >= deposited
  
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
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
      }}>
        <Label id="capital-protection" tone="scene" variant="text">
          Capital Protection
        </Label>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: isProtected ? TOKENS.colors.accent : '#FFFFFF',
          textTransform: 'uppercase',
        }}>
          {isProtected ? 'Protected' : 'At Risk'}
        </span>
      </div>
      
      {/* Protection Gauge */}
      <div style={{
        display: 'flex',
        height: '32px',
        borderRadius: '4px',
        overflow: 'hidden',
        background: 'var(--color-bg-secondary)',
        position: 'relative',
      }}>
        {/* Principal zone */}
        <div style={{
          width: '100%',
          height: '100%',
          background: isProtected 
            ? 'linear-gradient(90deg, rgba(167,251,144,0.3) 0%, rgba(167,251,144,0.1) 100%)'
            : 'linear-gradient(90deg, rgba(122,122,122,0.3) 0%, rgba(122,122,122,0.1) 100%)',
          position: 'relative',
        }}>
          {/* Current value marker */}
          <div style={{
            position: 'absolute',
            left: `${Math.min(100, protectionLevel)}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: isProtected ? TOKENS.colors.accent : '#7A7A7A',
            transform: 'translateX(-50%)',
          }} />
        </div>
      </div>
      
      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: TOKENS.spacing[2],
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.micro,
        color: TOKENS.colors.textGhost,
      }}>
        <span>Principal: {fmtUsdCompact(deposited)}</span>
        <span style={{ color: isProtected ? TOKENS.colors.accent : '#FFFFFF' }}>
          Current: {fmtUsdCompact(currentValue)} ({protectionLevel.toFixed(1)}%)
        </span>
      </div>
      
      {/* Safeguard explanation */}
      <div style={{
        marginTop: TOKENS.spacing[3],
        padding: TOKENS.spacing[3],
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textSecondary,
        lineHeight: LINE_HEIGHT.body,
      }}>
        <span style={{ color: TOKENS.colors.accent, fontWeight: TOKENS.fontWeights.bold }}>● Safeguard active</span> — 
        Capital is {isProtected ? 'above' : 'below'} principal threshold. 
        {isProtected 
          ? 'Yield generation continues normally. Auto-protection triggers if value drops below 95% of principal.'
          : 'Recovery protocol can be initiated. Extended lock period may apply to recover principal.'
        }
      </div>
    </div>
  )
}

/** PerformanceHistoryChart — Historical value projection */
function PerformanceHistoryChart({ 
  deposited, 
  claimable,
  apr,
  daysRemaining,
  mode 
}: { 
  deposited: number
  claimable: number
  apr: number
  daysRemaining: number
  mode: SmartFitMode 
}) {
  // Generate projection data
  const months = 6
  const monthlyYield = (deposited * (apr / 100)) / 12
  const data = Array.from({ length: months }, (_, i) => {
    const month = i + 1
    const projectedYield = Math.min(claimable + (monthlyYield * month), deposited * 0.5)
    return {
      month,
      value: deposited + projectedYield,
      yield: projectedYield,
    }
  })
  
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = deposited * 0.98
  
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
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: TOKENS.spacing[3],
      }}>
        <Label id="performance-chart" tone="scene" variant="text">
          Value Projection
        </Label>
        <span style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {daysRemaining}d remaining
        </span>
      </div>
      
      {/* Chart */}
      <div style={{
        height: '120px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[2],
        paddingBottom: TOKENS.spacing[4],
        borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
      }}>
        {data.map((point, index) => {
          const height = ((point.value - minValue) / (maxValue - minValue)) * 100
          const isCurrent = index === 0
          
          return (
            <div key={point.month} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              flex: 1,
            }}>
              <div style={{
                width: '100%',
                height: `${Math.max(10, height)}%`,
                background: isCurrent 
                  ? TOKENS.colors.accent 
                  : `rgba(200,200,200,${0.3 + (index * 0.1)})`,
                borderRadius: '2px 2px 0 0',
                minHeight: '4px',
              }} />
              <div style={{
                fontFamily: TOKENS.fonts.mono,
                fontSize: TOKENS.fontSizes.micro,
                color: TOKENS.colors.textGhost,
              }}>
                M{point.month}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: TOKENS.spacing[3],
        fontSize: TOKENS.fontSizes.xs,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: TOKENS.colors.accent,
            borderRadius: '2px',
          }} />
          <span style={{ color: TOKENS.colors.textSecondary }}>
            Current: {fmtUsdCompact(deposited + claimable)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: '#9A9A9A',
            borderRadius: '2px',
          }} />
          <span style={{ color: TOKENS.colors.textSecondary }}>
            Projected (6M): {fmtUsdCompact(data[data.length - 1].value)}
          </span>
        </div>
      </div>
    </div>
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function NarrativeBlock({ kicker, body, mode, isMono = false }: {
  kicker: string
  body: string
  mode: SmartFitMode
  isMono?: boolean
}) {
  return (
    <div style={{
      minWidth: 0,
      background: 'var(--color-bg-secondary)',
      
      padding: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[3],
      }),
    }}>
      <Label id={`narrative-${slug(kicker)}`} tone="scene" variant="text">
        {kicker}
      </Label>
      <p
        style={{
          margin: `${TOKENS.spacing[2]} 0 0 0`,
          fontSize: isMono ? TOKENS.fontSizes.xs : TOKENS.fontSizes.sm,
          lineHeight: LINE_HEIGHT.body,
          color: TOKENS.colors.textSecondary,
          fontFamily: isMono ? TOKENS.fonts.mono : TOKENS.fonts.sans,
        }}
      >
        {body}
      </p>
    </div>
  )
}

function StatCard({ label, value, subtext, mode, accent = false }: {
  label: string
  value: string
  subtext: string
  mode: SmartFitMode
  accent?: boolean
}) {
  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      
      padding: fitValue(mode, {
        normal: TOKENS.spacing[3],
        tight: TOKENS.spacing[2],
        limit: TOKENS.spacing[2],
      }),
    }}>
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
        fontSize: fitValue(mode, {
          normal: TOKENS.fontSizes.lg,
          tight: TOKENS.fontSizes.md,
          limit: TOKENS.fontSizes.md,
        }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.xs,
        color: TOKENS.colors.textGhost,
        marginTop: TOKENS.spacing[2],
      }}>
        {subtext}
      </div>
    </div>
  )
}
