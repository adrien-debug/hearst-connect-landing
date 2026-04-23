'use client'

import { useState } from 'react'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS, MONO, fmtUsd, fmtUsdCompact, LINE_HEIGHT, VALUE_LETTER_SPACING } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'
import { useVaultActions } from '@/hooks/useVault'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined

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
  const [isDepositing, setIsDepositing] = useState(false)

  const { address } = useAccount()
  const { deposit, isPending: isDepositPending } = useVaultActions(VAULT_ADDRESS)
  const { approve, isPending: isApprovePending } = useTokenAllowance(USDC_ADDRESS, address, VAULT_ADDRESS)

  const num = parseFloat(amount) || 0
  const isValid = num >= vault.minDeposit
  const isReady = isValid && agreed
  const yearlyYield = num * (vault.apr / 100)
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0
  const totalYield = num * (targetPct / 100)
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  const handleApprove = async () => {
    if (!amount) return
    await approve(amount)
  }

  const handleDeposit = async () => {
    if (!isReady) return
    try {
      setIsDepositing(true)
      const amountBigInt = parseUnits(amount, 6) // USDC has 6 decimals
      await deposit(amountBigInt)
      // Success - could show toast/redirect here
    } catch (err) {
      console.error('Deposit failed:', err)
    } finally {
      setIsDepositing(false)
    }
  }

  // Calculate projection details
  const monthlyYield = num * (vault.apr / 100) / 12
  const dailyYield = monthlyYield / 30

  return (
    <div
      className="flex-1"
      suppressHydrationWarning
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
            align="center"
          />
          <CockpitGauge
            label="Target Yield"
            value={vault.target}
            valueCompact={vault.target}
            subtext="Cumulative return"
            mode={mode}
            primary
            accent
            align="center"
          />
          <CockpitGauge
            label="Annual APY"
            value={`${vault.apr}%`}
            valueCompact={`${vault.apr}%`}
            subtext={`${vault.risk} risk profile`}
            mode={mode}
            align="center"
          />
        </div>
      </div>

      {/* Main content */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: shellPadding,
          gap: shellGap,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
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
          onApprove={handleApprove}
          isApproving={isApprovePending}
          onDeposit={handleDeposit}
          isDepositing={isDepositing || isDepositPending}
        />
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

