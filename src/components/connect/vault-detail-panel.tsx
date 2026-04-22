'use client'

import { Label } from '@/components/ui/label'
import { TOKENS, fmtUsd } from './constants'
import { MonthlyGauge } from './monthly-gauge'
import { HeroVaultStage } from './hero-vault-stage'
import { CompressedMetricsStrip } from './compressed-metrics-strip'
import type { ActiveVault, MaturedVault } from './data'
import { fitValue, useSmartFit, type SmartFitMode } from './smart-fit'

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
  const shellPadding = fitValue(mode, {
    normal: TOKENS.spacing[6],
    tight: TOKENS.spacing[4],
    limit: TOKENS.spacing[3],
  })
  const shellGap = fitValue(mode, {
    normal: TOKENS.spacing[4],
    tight: TOKENS.spacing[3],
    limit: TOKENS.spacing[2],
  })

  return (
    <div
      className="flex-1"
      style={{
        overflow: 'hidden',
        padding: `${shellPadding} ${shellPadding}`,
        background: TOKENS.colors.bgPage,
        color: TOKENS.colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        gap: shellGap,
        minHeight: 0,
        height: '100%',
      }}
    >
      <HeroVaultStage
        mode={mode}
        kicker="Position"
        title={vault.name}
        description={vault.strategy}
        sideLabel="Current value"
        sideValue={fmtUsd(currentValue)}
        sideBadge={status}
      />

      <CompressedMetricsStrip
        mode={mode}
        items={[
          { id: 'p', label: 'Principal', value: fmtUsd(vault.deposited) },
          { id: 'y', label: 'Available yield', value: fmtUsd(vault.claimable), accent: true },
          { id: 't', label: 'Target', value: vault.target },
          { id: 'm', label: 'Maturity', value: vault.maturity },
        ]}
      />

      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: TOKENS.spacing[2], alignItems: 'baseline' }}>
          <Label id="tp-label" tone="scene" variant="text">
            Target progress
          </Label>
          <span
            style={{
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
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
            background: 'rgba(0,0,0,0.4)',
            overflow: 'hidden',
            marginBottom: TOKENS.spacing[2],
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
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
            lineHeight: 1.45,
          }}
        >
          Capital unlocks when {vault.target} cumulative target is reached or at maturity.
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: fitValue(mode, { normal: TOKENS.spacing[2], tight: TOKENS.spacing[2], limit: TOKENS.spacing[2] }),
        }}
      >
        <Label id="mo-label" tone="scene" variant="text">
          Month distribution
        </Label>
        <div style={{ marginTop: TOKENS.spacing[2] }}>
          <MonthlyGauge deposited={vault.deposited} apr={vault.apr} mode={mode} />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isLimit ? '1fr' : '1fr 1fr',
          gap: shellGap,
          flex: 1,
          minHeight: 0,
          borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
          paddingTop: shellGap,
        }}
      >
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
  )
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function NarrativeBlock({ kicker, body, mode, isMono = false }: { kicker: string; body: string; mode: SmartFitMode; isMono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Label id={`narrative-${slug(kicker)}`} tone="scene" variant="text">
        {kicker}
      </Label>
      <p
        style={{
          margin: fitValue(mode, { normal: `${TOKENS.spacing[2]} 0 0 0`, tight: `${TOKENS.spacing[2]} 0 0 0`, limit: `${TOKENS.spacing[2]} 0 0 0` }),
          fontSize: isMono ? TOKENS.fontSizes.xs : TOKENS.fontSizes.sm,
          lineHeight: 1.5,
          color: TOKENS.colors.textSecondary,
          fontFamily: isMono ? TOKENS.fonts.mono : TOKENS.fonts.sans,
        }}
      >
        {body}
      </p>
    </div>
  )
}
