'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import { TOKENS } from './constants'
import { useToast } from './toast'

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
  const { switchChainAsync, isPending } = useSwitchChain()
  const toast = useToast()
  const isDemo = useDemoMode()

  if (isDemo) return null
  if (!isConnected) return null
  if (!expectedChainId || !connectedChainId) return null
  if (connectedChainId === expectedChainId) return null

  const handleSwitch = async () => {
    if (isPending) return
    try {
      await switchChainAsync({ chainId: expectedChainId })
    } catch (err) {
      // MetaMask code 4902 = chain unknown; code 4001 = user rejected.
      const code = (err as { code?: number })?.code
      if (code === 4001) {
        toast.error('Network switch cancelled', {
          body: 'You declined the request in your wallet.',
        })
      } else if (code === 4902) {
        toast.error(`${expectedChainName ?? 'Network'} not in wallet`, {
          body: 'Add the network to your wallet to continue.',
        })
      } else {
        const message = err instanceof Error ? err.message : 'Unknown wallet error.'
        toast.error('Could not switch network', { body: message })
      }
    }
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
