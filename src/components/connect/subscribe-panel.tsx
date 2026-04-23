'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS, MONO, fmtUsd, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'
import { StatCard } from './stat-card'

export function SubscribePanel({ vault, onBack }: { vault: AvailableVault; onBack?: () => void }) {
  const { mode, isLimit } = useSmartFit({
    tightHeight: 740,
    limitHeight: 660,
    tightWidth: 1100,
    limitWidth: 1200,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)

  const num = parseFloat(amount) || 0
  const isValid = num >= vault.minDeposit
  const isReady = isValid && agreed
  const yearlyYield = num * (vault.apr / 100)
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0
  const totalYield = num * (targetPct / 100)
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  // Calculate projection details
  const monthlyYield = num * (vault.apr / 100) / 12
  const dailyYield = monthlyYield / 30

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
      {/* COCKPIT HEADER — Same structure as dashboard */}
      <div
        style={{
          padding: fitValue(mode, {
            normal: `${shellPadding}px`,
            tight: `${shellPadding * 0.75}px`,
            limit: `${shellPadding * 0.5}px`,
          }),
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* Top row — Context */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: TOKENS.spacing[3],
        }}>
          <Label id="sub-header" tone="scene" variant="text">
            Subscribe
          </Label>
          <div style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.micro,
            color: TOKENS.colors.textGhost,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
          }}>
            {vault.lockPeriod} lock
          </div>
        </div>

        {/* Main cockpit gauges — Min / Target / APY */}
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
            label="Minimum Entry"
            value={fmtUsd(vault.minDeposit)}
            valueCompact={fmtUsdCompact(vault.minDeposit)}
            subtext="Capital required"
            mode={mode}
          />
          <CockpitGauge
            label="Target Yield"
            value={vault.target}
            valueCompact={vault.target}
            subtext="Cumulative return"
            mode={mode}
            primary
            accent
          />
          <CockpitGauge
            label="Annual APY"
            value={`${vault.apr}%`}
            valueCompact={`${vault.apr}%`}
            subtext={`${vault.risk} risk profile`}
            mode={mode}
          />
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: shellPadding,
          gap: shellGap,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Vault stats overview */}
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
          <StatCard label="Minimum" value={fmtUsdCompact(vault.minDeposit)} subtext="Entry threshold" mode={mode} size="compact" />
          <StatCard label="Target" value={vault.target} subtext="Cumulative yield" mode={mode} accent size="compact" />
          <StatCard label="Unlock Timeline" value={vault.lockPeriod} subtext="Duration" mode={mode} size="compact" />
          <StatCard label="Risk" value={vault.risk} subtext="Profile" mode={mode} size="compact" />
        </div>

        {/* Projection calculator */}
        {num > 0 && (
          <div style={{
            background: TOKENS.colors.bgSecondary,
            borderRadius: TOKENS.radius.lg,
            padding: fitValue(mode, {
              normal: TOKENS.spacing[4],
              tight: TOKENS.spacing[3],
              limit: TOKENS.spacing[3],
            }),
            flexShrink: 0,
          }}>
            <Label id="proj-label" tone="scene" variant="text">
              Yield projection
            </Label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: fitValue(mode, {
                normal: 'repeat(3, 1fr)',
                tight: 'repeat(3, 1fr)',
                limit: '1fr',
              }),
              gap: TOKENS.spacing[3],
              marginTop: TOKENS.spacing[3],
            }}>
              <ProjectionItem label="Monthly" value={fmtUsdCompact(monthlyYield)} />
              <ProjectionItem label="Daily" value={fmtUsdCompact(dailyYield)} />
              <ProjectionItem label="To target" value={fmtUsdCompact(totalYield)} accent />
            </div>
          </div>
        )}

        {/* Subscription form */}
        <div style={{
          flex: 1,
          background: TOKENS.colors.bgSecondary,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[6],
            tight: TOKENS.spacing[4],
            limit: TOKENS.spacing[3],
          }),
          overflow: 'hidden',
        }}>
          <SubscriptionComposer
            vault={vault}
            mode={mode}
            isLimit={isLimit}
            amount={amount}
            onAmountChange={setAmount}
            agreed={agreed}
            onAgreedChange={setAgreed}
            isValid={isValid}
            isReady={isReady}
            num={num}
            yearlyYield={yearlyYield}
            totalYield={totalYield}
          />
        </div>

        {/* Terms block */}
        <div style={{
          background: TOKENS.colors.bgSecondary,
          borderRadius: TOKENS.radius.lg,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[4],
            tight: TOKENS.spacing[3],
            limit: TOKENS.spacing[3],
          }),
          flexShrink: 0,
        }}>
          <Label id="sub-info" tone="scene" variant="text">
            Vault terms
          </Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLimit ? '1fr' : 'repeat(3, 1fr)',
            gap: shellGap,
            marginTop: TOKENS.spacing[3],
          }}>
            <TermItem label="Fees" value={vault.fees} />
            <TermItem label="Target" value={vault.target} />
            <TermItem label="Maturity" value={vault.lockPeriod} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectionItem({ label, value, accent = false }: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        fontFamily: MONO,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.md,
        fontWeight: TOKENS.fontWeights.black,
        letterSpacing: VALUE_LETTER_SPACING,
        color: accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
      }}>
        {value}
      </div>
    </div>
  )
}

function TermItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        fontFamily: MONO,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[2],
      }}>
        {label}
      </div>
      <div style={{
        fontSize: TOKENS.fontSizes.sm,
        fontWeight: TOKENS.fontWeights.black,
        color: TOKENS.colors.textPrimary,
        lineHeight: LINE_HEIGHT.tight,
      }}>
        {value}
      </div>
    </div>
  )
}

