'use client'

import { useState } from 'react'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS, fmtUsd, fmtUsdCompact } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding, fitValue } from './smart-fit'
import { useVaultActions } from '@/hooks/useVault'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { WalletNotConnected, VaultNotConfigured } from './empty-states'
import { useAppMode } from '@/hooks/useAppMode'
import { useDemoPortfolio } from '@/hooks/useDemoPortfolio'
import { useLiveActions } from '@/hooks/useLiveActions'

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
  const { isDemo } = useAppMode()
  const { actions: demoActions } = useDemoPortfolio()

  const vaultConfig = useVaultById(vault.id)
  const vaultAddress = vaultConfig?.vaultAddress
  const usdcAddress = vaultConfig?.usdcAddress
  const isVaultConfigured = !!vaultConfig && !!vaultAddress && !!usdcAddress

  const { deposit: chainDeposit, isPending: isDepositPending } = useVaultActions(
    isVaultConfigured ? vaultAddress : undefined
  )
  const { approve, isPending: isApprovePending } = useTokenAllowance(
    isVaultConfigured ? usdcAddress : undefined,
    address,
    isVaultConfigured ? vaultAddress : undefined
  )

  // Use live actions for deposit with backend persistence
  const { deposit: liveDeposit, isPending: isLivePending } = useLiveActions(vault.id)

  const num = parseFloat(amount) || 0
  const isValid = num >= vault.minDeposit
  const isReady = isValid && agreed
  const yearlyYield = num * (vault.apr / 100)
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0
  const totalYield = num * (targetPct / 100)
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  const handleApprove = async () => {
    if (isDemo) return
    if (!amount) return
    await approve(amount)
  }

  const handleDeposit = async () => {
    if (!isReady) return
    if (isDemo) {
      setIsDepositing(true)
      const result = await liveDeposit(num)
      if (result.success) {
        setAmount('')
        setAgreed(false)
        onBack?.()
      }
      setIsDepositing(false)
      return
    }
    if (!isVaultConfigured) return
    try {
      setIsDepositing(true)
      const result = await liveDeposit(num)
      if (result.success) {
        setAmount('')
        setAgreed(false)
      } else if (result.error) {
        console.error('[SubscribePanel] Deposit failed:', result.error)
      }
    } catch (err) {
      console.error('[SubscribePanel] Deposit failed:', err)
    } finally {
      setIsDepositing(false)
    }
  }

  const monthlyYield = num * (vault.apr / 100) / 12
  const dailyYield = monthlyYield / 30

  if (!isDemo && !isVaultConfigured) {
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
        <BackButton onBack={onBack} />
        <VaultNotConfigured />
      </div>
    )
  }

  if (!isDemo && !isConnected) {
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
        <BackButton onBack={onBack} />
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
      {/* Compact Header with Back + Lock Info */}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <BackButton onBack={onBack} />
        <div style={{
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          color: TOKENS.colors.textGhost,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
        }}>
          {isDemo && (
            <span style={{ color: TOKENS.colors.accent, marginRight: TOKENS.spacing[2] }}>DEMO</span>
          )}
          {vault.lockPeriod} lock
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
          isDemo={isDemo}
          amount={amount}
          onAmountChange={setAmount}
          agreed={agreed}
          onAgreedChange={setAgreed}
          isValid={isValid}
          isReady={isReady}
          num={num}
          monthlyYield={monthlyYield}
          dailyYield={dailyYield}
          yearlyYield={yearlyYield}
          totalYield={totalYield}
          onApprove={handleApprove}
          isApproving={isDemo ? false : isApprovePending}
          onDeposit={handleDeposit}
          isDepositing={isDepositing || (!isDemo && (isDepositPending || isLivePending))}
        />
      </div>
    </div>
  )
}

function BackButton({ onBack }: { onBack?: () => void }) {
  return (
    <button
      type="button"
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
  )
}
