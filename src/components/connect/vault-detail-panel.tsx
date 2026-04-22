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
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
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
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
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
      background: 'rgba(0,0,0,0.2)',
      boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
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
          margin: `${TOKENS.spacing[2]}px 0 0 0`,
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
      background: 'rgba(0,0,0,0.2)',
      boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
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
