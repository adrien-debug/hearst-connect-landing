'use client'

import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useUserPosition } from '@/hooks/useUserPosition'
import { useDeposit } from '@/hooks/useDeposit'
import { useWithdraw } from '@/hooks/useWithdraw'
import { useRewards } from '@/hooks/useRewards'

type FlowMode = 'deposit' | 'withdraw' | 'claim'

export const FlowActions = memo(function FlowActions() {
  const { isConnected, usdcBalance, canWithdraw } = useUserPosition()
  const { pending, claim, isClaiming, isConfirming: isClaimConfirming } = useRewards()
  const depositFlow = useDeposit()
  const withdrawFlow = useWithdraw()

  const [mode, setMode] = useState<FlowMode>('deposit')
  const [amount, setAmount] = useState('')

  const pendingNum = parseFloat(pending) || 0

  const handleSubmit = useCallback(() => {
    if (!amount && mode !== 'claim') return
    switch (mode) {
      case 'deposit':
        depositFlow.execute(amount)
        break
      case 'withdraw':
        withdrawFlow.withdraw(amount)
        break
      case 'claim':
        claim()
        break
    }
  }, [mode, amount, depositFlow, withdrawFlow, claim])

  const isProcessing =
    depositFlow.isApproving ||
    depositFlow.isDepositing ||
    depositFlow.isConfirming ||
    withdrawFlow.isPending ||
    withdrawFlow.isConfirming ||
    isClaiming ||
    isClaimConfirming

  if (!isConnected) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem 0',
        }}
      >
        <ConnectButton />
      </div>
    )
  }

  return (
    <div
      className="flow-actions"
      style={{
        position: 'relative',
        width: '100%',
        padding: '1.5rem 0',
      }}
    >
      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          marginBottom: '1.5rem',
          background: 'var(--dashboard-surface)',
          borderRadius: 'var(--dashboard-radius-sm)',
          padding: '2px',
          border: '1px solid var(--dashboard-border)',
        }}
      >
        {(['deposit', 'withdraw', 'claim'] as FlowMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={m === 'withdraw' && !canWithdraw}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--dashboard-text-xs)',
              letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
              textTransform: 'uppercase',
              background: mode === m ? 'var(--dashboard-accent-dim)' : 'transparent',
              color:
                mode === m
                  ? 'var(--dashboard-accent)'
                  : 'var(--dashboard-text-muted)',
              border: 'none',
              borderRadius: 'calc(var(--dashboard-radius-sm) - 2px)',
              cursor: m === 'withdraw' && !canWithdraw ? 'not-allowed' : 'pointer',
              opacity: m === 'withdraw' && !canWithdraw ? 0.4 : 1,
              transition: 'all var(--dashboard-duration) var(--dashboard-ease)',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input area */}
      <AnimatePresence mode="wait">
        {mode !== 'claim' ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--dashboard-surface)',
                borderRadius: 'var(--dashboard-radius-input)',
                border: '1px solid var(--dashboard-border)',
                marginBottom: '1rem',
              }}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '')
                  setAmount(v)
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--dashboard-text-lg)',
                  fontWeight: 600,
                  color: 'var(--dashboard-text-primary)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--dashboard-text-xs)',
                  color: 'var(--dashboard-text-ghost)',
                  letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
                }}
              >
                USDC
              </span>
              {mode === 'deposit' && (
                <button
                  onClick={() => setAmount(usdcBalance)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--dashboard-text-xs)',
                    color: 'var(--dashboard-accent)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
                  }}
                >
                  Max
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="claim-info"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              textAlign: 'center',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--dashboard-text-2xl)',
                fontWeight: 600,
                color: pendingNum > 0 ? 'var(--dashboard-accent)' : 'var(--dashboard-text-muted)',
              }}
            >
              ${parseFloat(pending).toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--dashboard-text-xs)',
                color: 'var(--dashboard-text-ghost)',
                marginTop: '0.25rem',
                letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
                textTransform: 'uppercase',
              }}
            >
              Claimable rewards
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || (mode !== 'claim' && !amount) || (mode === 'claim' && pendingNum === 0)}
        style={{
          width: '100%',
          padding: '0.875rem',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--dashboard-text-sm)',
          fontWeight: 600,
          letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
          textTransform: 'uppercase',
          background: isProcessing ? 'var(--dashboard-accent-dim)' : 'var(--dashboard-accent)',
          color: isProcessing ? 'var(--dashboard-accent)' : 'var(--dashboard-page)',
          border: 'none',
          borderRadius: 'var(--dashboard-radius-input)',
          cursor: isProcessing ? 'wait' : 'pointer',
          transition: 'all var(--dashboard-duration) var(--dashboard-ease)',
          opacity:
            (mode !== 'claim' && !amount) || (mode === 'claim' && pendingNum === 0)
              ? 'var(--dashboard-disabled-opacity)'
              : 1,
        }}
      >
        {getButtonLabel(mode, depositFlow, withdrawFlow, isClaiming, isClaimConfirming)}
      </button>

      {/* Tx feedback */}
      <AnimatePresence>
        {(depositFlow.depositHash || withdrawFlow.txHash) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--dashboard-text-xs)',
              color: 'var(--dashboard-text-ghost)',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            TX submitted — confirming…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

function getButtonLabel(
  mode: FlowMode,
  deposit: ReturnType<typeof useDeposit>,
  withdraw: ReturnType<typeof useWithdraw>,
  isClaiming: boolean,
  isClaimConfirming: boolean,
): string {
  if (mode === 'deposit') {
    if (deposit.isApproving) return 'Approving…'
    if (deposit.isDepositing) return 'Depositing…'
    if (deposit.isConfirming) return 'Confirming…'
    if (deposit.needsApproval('0')) return 'Approve & Deposit'
    return 'Deposit'
  }
  if (mode === 'withdraw') {
    if (withdraw.isPending) return 'Withdrawing…'
    if (withdraw.isConfirming) return 'Confirming…'
    return 'Withdraw'
  }
  if (isClaiming) return 'Claiming…'
  if (isClaimConfirming) return 'Confirming…'
  return 'Claim Rewards'
}
