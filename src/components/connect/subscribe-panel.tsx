'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS, fmtUsd, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import type { SmartFitMode } from './smart-fit'

export function SubscribePanel({ vault }: { vault: AvailableVault }) {
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
      {/* Header */}
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
            <Label id="sub-header" tone="scene" variant="text">
              Subscribe
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
              color: TOKENS.colors.accent,
            }}>
              {vault.apr}%
            </div>
            <div style={{
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              textTransform: 'uppercase',
              letterSpacing: TOKENS.letterSpacing.display,
              color: TOKENS.colors.textSecondary,
              marginTop: TOKENS.spacing[2],
            }}>
              APY
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
          <StatCard label="Minimum" value={fmtUsdCompact(vault.minDeposit)} subtext="Entry threshold" mode={mode} />
          <StatCard label="Target" value={vault.target} subtext="Cumulative yield" mode={mode} accent />
          <StatCard label="Lock period" value={vault.lockPeriod} subtext="Duration" mode={mode} />
          <StatCard label="Risk" value={vault.risk} subtext="Profile" mode={mode} />
        </div>

        {/* Projection calculator */}
        {num > 0 && (
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
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
          padding: fitValue(mode, {
            normal: TOKENS.spacing[6],
            tight: TOKENS.spacing[4],
            limit: TOKENS.spacing[3],
          }),
          overflow: 'auto',
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
          background: 'rgba(0,0,0,0.2)',
          boxShadow: `inset 0 0 0 1px ${TOKENS.colors.borderSubtle}`,
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

function ProjectionItem({ label, value, accent = false }: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
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
