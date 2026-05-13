'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TOKENS } from '../constants'
import type { AvailableVault } from '../data'
import { useSmartFit, useShellPadding, fitValue } from '../smart-fit'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useLiveActions } from '@/hooks/useLiveActions'
import { useConnectWallet } from '@/hooks/useConnectWallet'
import { useToast } from '../toast'
import { NetworkMismatchBanner } from '../network-mismatch-banner'
import { WalletNotConnected, VaultNotConfigured } from '../empty-states'
import { StepProgress, type WizardStep } from './step-progress'
import { StepProduct } from './step-product'
import { StepDeposit } from './step-deposit'
import { StepConfirmed } from './step-confirmed'

interface InvestWizardProps {
  vault: AvailableVault
  onBack?: () => void
}

/** InvestWizard — Steps 2-3-4 of the Invest flow (Step 1 lives in
 * AvailableVaultsPanel). Internal state machine drives which step renders. */
export function InvestWizard({ vault, onBack }: InvestWizardProps) {
  const { mode } = useSmartFit({
    tightHeight: 880,
    limitHeight: 720,
    tightWidth: 1280,
    limitWidth: 1024,
    reserveHeight: 64,
    reserveWidth: 280,
  })
  const { padding: shellPadding, gap: shellGap } = useShellPadding(mode)

  const { address, isConnected } = useAccount()
  const { connectWallet } = useConnectWallet()
  const toast = useToast()
  const vaultConfig = useVaultById(vault.id)
  const vaultAddress = vaultConfig?.vaultAddress
  const usdcAddress = vaultConfig?.usdcAddress
  const isVaultConfigured = !!vaultConfig && !!vaultAddress && !!usdcAddress

  const { approve, isPending: isApproving } = useTokenAllowance(usdcAddress, address, vaultAddress)
  const { deposit: liveDeposit, isPending: isLivePending } = useLiveActions(vault.id)

  const [step, setStep] = useState<Exclude<WizardStep, 'select'>>('product')
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null)

  const num = parseFloat(amount) || 0
  const isAmountValid = num >= vault.minDeposit
  const isReadyToDeposit = isAmountValid && agreed

  const handleApprove = async () => {
    if (!amount) return
    await approve(amount)
  }

  const handleDeposit = async () => {
    if (!isReadyToDeposit) return
    try {
      setIsDepositing(true)
      const result = await liveDeposit(num)
      if (result.success) {
        setConfirmedTxHash(result.txHash ?? '0x0000…0000')
        setStep('confirmed')
        const explorerBase = vaultConfig?.chain?.blockExplorers?.default?.url
        const txUrl = result.txHash && explorerBase
          ? `${explorerBase.replace(/\/$/, '')}/tx/${result.txHash}`
          : undefined
        toast.success(`Deposited into ${vault.name}`, {
          body: 'Position created. Yield distributions begin in the next epoch.',
          action: txUrl ? { label: 'View tx', href: txUrl } : undefined,
        })
      } else {
        toast.error('Deposit failed', {
          body: result.error ?? 'Unknown error. Check your wallet and try again.',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error during deposit.'
      toast.error('Deposit failed', { body: message })
    } finally {
      setIsDepositing(false)
    }
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
      <h1 className="sr-only">Invest</h1>

      <NetworkMismatchBanner
        expectedChainId={vaultConfig?.chain?.id}
        expectedChainName={vaultConfig?.chain?.name}
      />

      {/* Wizard header */}
      <div
        style={{
          padding: fitValue(mode, {
            normal: 'var(--space-6)',
            tight: 'var(--space-4)',
            limit: 'var(--space-3)',
          }),
          borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          background: TOKENS.colors.black,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: TOKENS.spacing[3],
          flexWrap: 'wrap',
        }}
      >
        <StepProgress active={step} />
        {onBack && step !== 'confirmed' && (
          <button
            type="button"
            onClick={() => {
              if (step === 'deposit' && (amount.length > 0 || agreed)) {
                if (!window.confirm('Discard your deposit setup and go back to vaults?')) return
              }
              onBack()
            }}
            disabled={isDepositing || isLivePending}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: TOKENS.colors.textSecondary,
              fontFamily: TOKENS.fonts.mono,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              cursor: isDepositing || isLivePending ? 'not-allowed' : 'pointer',
              opacity: isDepositing || isLivePending ? 0.5 : 1,
            }}
          >
            ← Back to vaults
          </button>
        )}
      </div>

      {/* Wizard body */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          padding: shellPadding,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {!isVaultConfigured ? (
          <VaultNotConfigured onBack={onBack} />
        ) : !isConnected ? (
          <WalletNotConnected onConnect={connectWallet} />
        ) : step === 'product' ? (
          <StepProduct
            vault={vault}
            vaultConfig={vaultConfig}
            onContinue={() => setStep('deposit')}
          />
        ) : step === 'deposit' ? (
          <StepDeposit
            vault={vault}
            vaultConfig={vaultConfig}
            amount={amount}
            onAmountChange={setAmount}
            agreed={agreed}
            onAgreedChange={setAgreed}
            isReady={isReadyToDeposit}
            isDepositing={isDepositing || isLivePending}
            isApproving={isApproving}
            onApprove={handleApprove}
            onDeposit={handleDeposit}
            onBack={() => setStep('product')}
            shellGap={shellGap}
          />
        ) : (
          <StepConfirmed
            vault={vault}
            depositedAmount={num}
            txHash={confirmedTxHash ?? '0x0000…0000'}
            onBackToDashboard={onBack}
          />
        )}
      </div>
    </div>
  )
}
