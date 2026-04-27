'use client'

import { useState } from 'react'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit, useShellPadding } from './smart-fit'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useAccount } from 'wagmi'
import { WalletNotConnected, VaultNotConfigured } from './empty-states'
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
  const [preFlightReady, setPreFlightReady] = useState(false)

  const { address, isConnected } = useAccount()

  const vaultConfig = useVaultById(vault.id)
  const vaultAddress = vaultConfig?.vaultAddress
  const usdcAddress = vaultConfig?.usdcAddress
  const isVaultConfigured = !!vaultConfig && !!vaultAddress && !!usdcAddress

  const { approve, isPending: isApprovePending } = useTokenAllowance(
    usdcAddress,
    address,
    vaultAddress
  )

  const { deposit: liveDeposit, isPending: isLivePending } = useLiveActions(vault.id)

  const num = parseFloat(amount) || 0
  const isValid = num >= vault.minDeposit
  const isReady = isValid && agreed && preFlightReady
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
      const result = await liveDeposit(num)
      if (result.success) {
        setAmount('')
        setAgreed(false)
      } else if (result.error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[SubscribePanel] Deposit failed:', result.error)
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SubscribePanel] Deposit failed:', err)
      }
    } finally {
      setIsDepositing(false)
    }
  }

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
        <BackButton onBack={onBack} />
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
      {/* Main content — locked to viewport, no body scroll. */}
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
          isDepositing={isDepositing || isLivePending}
          onPreFlightReady={setPreFlightReady}
          onBack={onBack}
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
