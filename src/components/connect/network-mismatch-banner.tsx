'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import { TOKENS } from './constants'

/** NetworkMismatchBanner — shows a persistent strip when the connected wallet
 * is on a different chain than the active vault expects. Hides itself in demo
 * mode (no real chain involved) and when the wallet isn't connected at all
 * (the WalletNotConnected empty state handles that case). */
export function NetworkMismatchBanner({
  expectedChainId,
  expectedChainName,
}: {
  expectedChainId?: number
  expectedChainName?: string
}) {
  const { isConnected, chainId: connectedChainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()
  const isDemo = useDemoMode()

  if (isDemo) return null
  if (!isConnected) return null
  if (!expectedChainId || !connectedChainId) return null
  if (connectedChainId === expectedChainId) return null

  const handleSwitch = () => {
    if (isPending) return
    switchChain({ chainId: expectedChainId })
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: TOKENS.spacing[3],
        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[5]}`,
        background: TOKENS.colors.bgTertiary,
        borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.warning}`,
        flexShrink: 0,
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: TOKENS.spacing[2],
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.warning,
        minWidth: 0,
      }}>
        <span aria-hidden style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: TOKENS.radius.full,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.warning}`,
          fontSize: 10,
          lineHeight: 1,
          flexShrink: 0,
        }}>
          !
        </span>
        Wrong network
        {expectedChainName ? (
          <span style={{ color: TOKENS.colors.textSecondary, textTransform: 'none', letterSpacing: 0, fontWeight: TOKENS.fontWeights.regular }}>
            — actions on this position need {expectedChainName}.
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={handleSwitch}
        disabled={isPending}
        aria-disabled={isPending}
        aria-label={isPending ? 'Switching network…' : `Switch network${expectedChainName ? ` to ${expectedChainName}` : ''}`}
        title={isPending ? 'Switching network…' : undefined}
        style={{
          padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
          background: TOKENS.colors.warning,
          color: TOKENS.colors.black,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.warning}`,
          borderRadius: TOKENS.radius.sm,
          fontFamily: TOKENS.fonts.mono,
          fontSize: TOKENS.fontSizes.micro,
          fontWeight: TOKENS.fontWeights.black,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          flexShrink: 0,
        }}
      >
        {isPending ? 'Switching…' : `Switch${expectedChainName ? ` to ${expectedChainName}` : ' network'} →`}
      </button>
    </div>
  )
}
