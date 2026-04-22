'use client'

import { useState } from 'react'
import { SubscriptionComposer } from './subscription-composer'
import { TOKENS } from './constants'
import type { AvailableVault } from './data'
import { useSmartFit } from './smart-fit'

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
  const shellPadding = getShellPadding(mode)
  return (
    <div
      className="min-h-0 min-w-0 flex-1"
      style={{
        height: '100%',
        overflow: 'hidden',
        padding: shellPadding,
        background: TOKENS.colors.bgPage,
        color: TOKENS.colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
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
      />
    </div>
  )
}

function getShellPadding(mode: ReturnType<typeof useSmartFit>['mode']) {
  if (mode === 'limit') return `${TOKENS.spacing[3]} ${TOKENS.spacing[3]}`
  if (mode === 'tight') return `${TOKENS.spacing[4]} ${TOKENS.spacing[4]}`
  return `${TOKENS.spacing[6]} ${TOKENS.spacing[6]}`
}
