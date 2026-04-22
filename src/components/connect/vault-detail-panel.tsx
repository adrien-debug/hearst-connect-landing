'use client'

import { TOKENS, fmtUsd } from './constants'
import { MonthlyGauge } from './monthly-gauge'
import type { ActiveVault, MaturedVault } from './data'
import { fitValue, useSmartFit, type SmartFitMode } from './smart-fit'

export function VaultDetailPanel({ vault }: { vault: ActiveVault | MaturedVault }) {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 940,
    limitWidth: 820,
    reserveHeight: 64,
    reserveWidth: 360,
  })
  const currentValue = vault.deposited + vault.claimable
  const status = vault.type === 'matured' ? 'Matured' : 'Active'
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

  return (
    <div
      className="flex-1"
      style={{
        overflowY: 'auto',
        padding: `${shellPadding} ${shellPadding}`,
        background: TOKENS.colors.bgPage,
        display: 'flex',
        flexDirection: 'column',
        gap: shellGap,
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: shellGap,
        paddingBottom: fitValue(mode, {
          normal: TOKENS.spacing[4],
          tight: TOKENS.spacing[3],
          limit: TOKENS.spacing[3],
        }),
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      }}>
        <div>
          <Label>Position Detail</Label>
          <div style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.xxxl,
              tight: TOKENS.fontSizes.xxxl,
              limit: TOKENS.fontSizes.xxl,
            }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            lineHeight: 0.95,
            marginBottom: TOKENS.spacing[2],
          }}>
            {vault.name}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.medium,
            color: TOKENS.colors.textSecondary,
            maxWidth: '700px',
            lineHeight: 1.5,
          }}>
            {vault.strategy}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Label>Current Value</Label>
          <div style={{
            fontSize: fitValue(mode, {
              normal: TOKENS.fontSizes.xxl,
              tight: TOKENS.fontSizes.xl,
              limit: TOKENS.fontSizes.xl,
            }),
            fontWeight: TOKENS.fontWeights.black,
            letterSpacing: TOKENS.letterSpacing.tight,
            color: TOKENS.colors.black,
          }}>
            {fmtUsd(currentValue)}
          </div>
          <div style={{
            marginTop: TOKENS.spacing[2],
            display: 'inline-flex',
            alignItems: 'center',
            padding: `4px ${TOKENS.spacing[3]}`,
            background: TOKENS.colors.black,
            color: TOKENS.colors.accent,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            {status}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: fitValue(mode, {
          normal: TOKENS.spacing[4],
          tight: TOKENS.spacing[3],
          limit: TOKENS.spacing[2],
        }),
      }}>
        <MetricCard mode={mode} label="Principal" value={fmtUsd(vault.deposited)} />
        <MetricCard mode={mode} label="Available Yield" value={fmtUsd(vault.claimable)} accent />
        <MetricCard mode={mode} label="Target" value={vault.target} />
        <MetricCard mode={mode} label="Maturity" value={vault.maturity} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: TOKENS.spacing[2], alignItems: 'baseline' }}>
          <Label>Target Progress</Label>
          <span style={{
            fontFamily: TOKENS.fonts.mono,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            color: TOKENS.colors.textSecondary,
          }}>{vault.progress}% of {vault.target}</span>
        </div>
        <div style={{ height: '12px', background: TOKENS.colors.black, overflow: 'hidden', marginBottom: TOKENS.spacing[3] }}>
          <div style={{ height: '100%', width: `${vault.progress}%`, background: TOKENS.colors.accent, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontFamily: TOKENS.fonts.mono, fontSize: TOKENS.fontSizes.xs, fontWeight: TOKENS.fontWeights.bold, color: TOKENS.colors.textSecondary }}>
          Capital unlocks when {vault.target} cumulative target is reached or at maturity.
        </div>
      </div>

      <div style={{ borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`, paddingTop: TOKENS.spacing[4] }}>
        <MonthlyGauge deposited={vault.deposited} apr={vault.apr} mode={mode} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fitValue(mode, {
        normal: TOKENS.spacing[4],
        tight: TOKENS.spacing[3],
        limit: TOKENS.spacing[2],
      }) }}>
        <div style={{ borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`, paddingTop: TOKENS.spacing[4] }}>
          <Label>Capital Protection</Label>
          <div style={{
            fontFamily: TOKENS.fonts.sans,
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.medium,
            color: TOKENS.colors.textSecondary,
            lineHeight: 1.6,
          }}>
            Safeguard active — not triggered. If principal falls below initial deposit at maturity, mining infrastructure operates for up to 2 additional years to restore capital.
          </div>
        </div>

        <div style={{ borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`, paddingTop: TOKENS.spacing[4] }}>
          <Label>Strategy</Label>
          {!isLimit && (
            <div style={{
              fontFamily: TOKENS.fonts.sans,
              fontSize: TOKENS.fontSizes.sm,
              marginBottom: TOKENS.spacing[3],
              color: TOKENS.colors.black,
              fontWeight: TOKENS.fontWeights.medium,
            }}>{vault.strategy}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[2],
          }) }}>
            <MetricCard mode={mode} label="Yield Rate" value={`${vault.apr}% APY`} compact accent />
            <MetricCard mode={mode} label="Progress" value={`${vault.progress}%`} compact />
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: TOKENS.fonts.mono,
      fontSize: TOKENS.fontSizes.xs,
      fontWeight: TOKENS.fontWeights.bold,
      letterSpacing: TOKENS.letterSpacing.display,
      textTransform: 'uppercase' as const,
      color: TOKENS.colors.textPrimary,
      marginBottom: TOKENS.spacing[3],
    }}>
      {children}
    </div>
  )
}

function MetricCard({
  mode,
  label,
  value,
  accent = false,
  compact = false,
}: {
  mode: SmartFitMode
  label: string
  value: string
  accent?: boolean
  compact?: boolean
}) {
  return (
    <div style={{
      padding: compact
        ? fitValue(mode, { normal: TOKENS.spacing[3], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] })
        : fitValue(mode, { normal: TOKENS.spacing[4], tight: TOKENS.spacing[3], limit: TOKENS.spacing[2] }),
      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.gray200}`,
      background: TOKENS.colors.bgPage,
    }}>
      <Label>{label}</Label>
      <div style={{
        fontFamily: TOKENS.fonts.sans,
        fontSize: compact
          ? fitValue(mode, { normal: TOKENS.fontSizes.md, tight: TOKENS.fontSizes.sm, limit: TOKENS.fontSizes.sm })
          : fitValue(mode, { normal: TOKENS.fontSizes.xl, tight: TOKENS.fontSizes.lg, limit: TOKENS.fontSizes.md }),
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: '-0.03em',
        color: accent ? TOKENS.colors.accent : TOKENS.colors.black,
        lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  )
}
