'use client'

import { useState } from 'react'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS, fmtUsd, fmtUsdCompact } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { CockpitGauge } from './cockpit-gauge'
import { useVaultActions } from '@/hooks/useVault'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { WalletNotConnected, VaultNotConfigured } from './empty-states'

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

  const { address, isConnected } = useAccount()

  // Get vault config from registry for real addresses
  const vaultConfig = useVaultById(vault.id)
  const vaultAddress = vaultConfig?.vaultAddress
  const usdcAddress = vaultConfig?.usdcAddress
  const isVaultConfigured = !!vaultConfig && !!vaultAddress && !!usdcAddress

  const { deposit, isPending: isDepositPending } = useVaultActions(
    isVaultConfigured ? vaultAddress : undefined
  )
  const { approve, isPending: isApprovePending } = useTokenAllowance(
    isVaultConfigured ? usdcAddress : undefined,
    address,
    isVaultConfigured ? vaultAddress : undefined
  )

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
    if (!isReady || !isVaultConfigured) return
    try {
      setIsDepositing(true)
      const amountBigInt = parseUnits(amount, 6) // USDC has 6 decimals

      // Validate BigInt doesn't overflow
      const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
      if (amountBigInt > maxSafe) {
        throw new Error('Amount too large. Please enter a smaller amount.')
      }

      await deposit(amountBigInt)
      // Success - could show toast/redirect here
      setAmount('')
      setAgreed(false)
    } catch (err) {
      // Error is logged and can be displayed via UI toast/modal in future
      console.error('[SubscribePanel] Deposit failed:', err)
    } finally {
      setIsDepositing(false)
    }
  }

  // Calculate projection details
  const monthlyYield = num * (vault.apr / 100) / 12
  const dailyYield = monthlyYield / 30

  // Show empty states if needed
  if (!isVaultConfigured) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: `${shellPadding}px`,
          gap: `${shellGap}px`,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4] }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              background: 'none',
              border: 'none',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ← Back
          </button>
        </div>
        <VaultNotConfigured />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: `${shellPadding}px`,
          gap: `${shellGap}px`,
        }}
      >
        <div style={{ marginBottom: TOKENS.spacing[4] }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              background: 'none',
              border: 'none',
              color: TOKENS.colors.accent,
              fontSize: TOKENS.fontSizes.sm,
              fontWeight: TOKENS.fontWeights.bold,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            ← Back
          </button>
        </div>
        <WalletNotConnected />
      </div>
    )
  }

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
            fontFamily: TOKENS.fonts.mono,
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

