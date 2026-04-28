'use client'

import '@/styles/connect/dashboard-vars.css'
import { useEffect, useState } from 'react'
import { useConnectRouting } from './use-connect-routing'
import { TOKENS, MONO, fmtUsdCompact } from './constants'
import { PortfolioSummary } from './portfolio-summary'
import { VaultDetailPanel } from './vault-detail-panel'
import { SubscribePanel } from './subscribe-panel'
import { SimulationPanel } from './simulation-panel'
import { AvailableVaultsPanel } from './available-vaults-panel'
import { LoadingState } from './empty-states'
import { Modal } from './modal'
import { NetworkMismatchBanner } from './network-mismatch-banner'
import type { VaultLine, Aggregate, ActiveVault, MaturedVault, AvailableVault } from './data'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'
import { DockRadial } from './dock-radial'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import { DEMO_WALLET_ADDRESS } from '@/lib/demo/demo-data'
import { useLiveActions } from '@/hooks/useLiveActions'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { useToast } from './toast'


export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation, isLoading } = useConnectRouting()
  const isAvailableVaultsList = selectedId === AVAILABLE_VAULTS_VIEW_ID
  const panelKey = isSimulation ? SIMULATION_VIEW_ID : isAvailableVaultsList ? AVAILABLE_VAULTS_VIEW_ID : selected?.id ?? 'portfolio'

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
  }

  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')

  // Show loading state (keep same bottom dock as post-load so chrome does not disappear)
  if (isLoading) {
    return (
      <div
        className="connect-scope fixed inset-0 z-1 flex flex-col overflow-hidden antialiased isolate"
        data-demo-offset="canvas"
        style={{
          top: 'var(--demo-banner-h, 0px)',
          background: TOKENS.colors.bgApp,
          color: TOKENS.colors.textPrimary,
          fontFamily: TOKENS.fonts.sans,
        }}
      >
        <header
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: TOKENS.spacing[16],
            width: '100%',
            background: TOKENS.colors.black,
            borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            paddingLeft: TOKENS.spacing[6],
            paddingRight: TOKENS.spacing[6],
            zIndex: 'var(--z-dropdown)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <img
              src="/logos/hearst-connect.svg"
              alt="Hearst Connect"
              style={{
                height: TOKENS.spacing[8],
                width: 'auto',
                display: 'block',
              }}
            />
          </div>
        </header>
        <main
          className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
        >
          <LoadingState />
        </main>
        <footer
          style={{
            height: TOKENS.spacing[16],
            width: '100%',
            background: TOKENS.colors.black,
            borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            flexShrink: 0,
          }}
        />
        <DockRadial onSelect={setSelectedId} activeId={selectedId} />
      </div>
    )
  }

  return (
    <div
      className="connect-scope fixed inset-0 z-1 flex flex-col overflow-hidden antialiased isolate"
      data-demo-offset="canvas"
      style={{
        top: 'var(--demo-banner-h, 0px)',
        right: 0,
        bottom: 0,
        left: 0,
        background: TOKENS.colors.bgApp,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: TOKENS.spacing[16],
          width: '100%',
          background: TOKENS.colors.black,
          borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          paddingLeft: TOKENS.spacing[6],
          paddingRight: TOKENS.spacing[6],
          zIndex: TOKENS.zIndex.dropdown,
        }}
      >
        {/* Logo - aligné à gauche */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: TOKENS.spacing[4] }}>
          <img
            src="/logos/hearst-connect.svg"
            alt="Hearst Connect"
            style={{
              height: TOKENS.spacing[8],
              width: 'auto',
              display: 'block',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: TOKENS.spacing[3] }}>
          <ThemeToggle variant="minimal" size="sm" />
          <WalletButton />
        </div>
      </header>

      <main
        className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        <section
          className="connect-main-scene min-h-0 min-w-0 flex-1 overflow-hidden"
          aria-label="Main scene"
        >
          <div key={panelKey} className="connect-panel-stage h-full min-h-0">
            <MainPanel
              vaults={vaults}
              availableVaults={availableVaults}
              selected={selected}
              agg={agg}
              isSimulation={isSimulation}
              isAvailableVaultsList={isAvailableVaultsList}
              onBack={() => handleSelect(null)}
              onVaultSelect={handleSelect}
            />
          </div>
        </section>
      </main>

      <footer
        style={{
          height: TOKENS.spacing[16],
          width: '100%',
          background: TOKENS.colors.black,
          borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          flexShrink: 0,
        }}
      />

      {/* Dock Radial Navigation */}
      <DockRadial onSelect={handleSelect} activeId={selectedId} />
    </div>
  )
}

function MainPanel({
  vaults,
  availableVaults,
  selected,
  agg,
  isSimulation,
  isAvailableVaultsList,
  onBack,
  onVaultSelect,
}: {
  vaults: VaultLine[]
  availableVaults: AvailableVault[]
  selected: VaultLine | null
  agg: Aggregate
  isSimulation: boolean
  isAvailableVaultsList: boolean
  onBack: () => void
  onVaultSelect: (vaultId: string) => void
}) {
  if (isSimulation) return <SimulationPanel />
  if (selected) {
    if (selected.type === 'available') return <SubscribePanel vault={selected} onBack={onBack} />
    return <PositionDetailContainer vault={selected} onBack={onBack} />
  }
  if (isAvailableVaultsList) {
    return <AvailableVaultsPanel vaults={availableVaults} onVaultSelect={onVaultSelect} />
  }
  return (
    <PortfolioSummary
      vaults={vaults}
      agg={agg}
      onVaultSelect={onVaultSelect}
      onAvailableVaultsClick={() => onVaultSelect(AVAILABLE_VAULTS_VIEW_ID)}
    />
  )
}

/** PositionDetailContainer — Wires the read-only VaultDetailPanel to the live
 * action layer. Owns the per-vault `useLiveActions` hook (legal here because
 * each container hosts one position), the withdraw confirmation modal, and
 * surfaces the claim/exit handlers + pending flags down to the panel.
 *
 * Claim is one-click (recurring action, no confirmation). Withdraw goes
 * through a modal because it's irreversible: a wrong click ends the position. */
function PositionDetailContainer({
  vault,
  onBack,
}: {
  vault: ActiveVault | MaturedVault
  onBack: () => void
}) {
  const productId = vault.productId ?? vault.id
  const live = useLiveActions(productId)
  const vaultConfig = useVaultById(productId)
  const explorerBase = vaultConfig?.chain?.blockExplorers?.default?.url
  const toast = useToast()
  const [exitModalOpen, setExitModalOpen] = useState(false)
  const explorerTxUrl = (txHash: string) =>
    explorerBase ? `${explorerBase.replace(/\/$/, '')}/tx/${txHash}` : undefined

  const handleClaim = async () => {
    const result = await live.claim()
    if (result.success) {
      toast.success(`Claimed from ${vault.name}`, {
        body: 'Yield distributed to your wallet.',
        action: result.txHash && explorerTxUrl(result.txHash)
          ? { label: 'View tx', href: explorerTxUrl(result.txHash)! }
          : undefined,
      })
    } else {
      toast.error('Claim failed', {
        body: result.error ?? 'Unknown error. Check your wallet and try again.',
      })
    }
  }

  const handleConfirmExit = async () => {
    setExitModalOpen(false)
    const result = await live.withdraw()
    if (result.success) {
      toast.success(`Exited ${vault.name}`, {
        body: 'Principal and pending yield returned to your wallet.',
        action: result.txHash && explorerTxUrl(result.txHash)
          ? { label: 'View tx', href: explorerTxUrl(result.txHash)! }
          : undefined,
      })
    } else {
      toast.error('Exit failed', {
        body: result.error ?? 'Unknown error. Check your wallet and try again.',
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <NetworkMismatchBanner
        expectedChainId={vaultConfig?.chain?.id}
        expectedChainName={vaultConfig?.chain?.name}
      />
      <VaultDetailPanel
        vault={vault}
        onBack={onBack}
        onClaim={live.canClaim ? handleClaim : undefined}
        onExit={live.canWithdraw ? () => setExitModalOpen(true) : undefined}
        isClaiming={live.isPending}
        isExiting={live.isPending}
      />
      <Modal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        title="Exit position"
        size="sm"
        footer={
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: TOKENS.spacing[3],
          }}>
            <button
              type="button"
              onClick={() => setExitModalOpen(false)}
              disabled={live.isPending}
              style={{
                padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                background: 'transparent',
                color: TOKENS.colors.textSecondary,
                border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radius.sm,
                fontFamily: MONO,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                cursor: live.isPending ? 'wait' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmExit}
              disabled={live.isPending}
              style={{
                padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
                background: TOKENS.colors.accent,
                color: TOKENS.colors.black,
                border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
                borderRadius: TOKENS.radius.sm,
                fontFamily: MONO,
                fontSize: TOKENS.fontSizes.xs,
                fontWeight: TOKENS.fontWeights.black,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                cursor: live.isPending ? 'wait' : 'pointer',
                opacity: live.isPending ? 0.6 : 1,
              }}
            >
              {live.isPending ? 'Exiting…' : 'Confirm exit →'}
            </button>
          </div>
        }
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: TOKENS.spacing[4],
          color: TOKENS.colors.textSecondary,
          fontSize: TOKENS.fontSizes.sm,
          lineHeight: 1.5,
        }}>
          <p style={{ margin: 0 }}>
            You are about to withdraw your position from <strong style={{ color: TOKENS.colors.textPrimary }}>{vault.name}</strong>.
            This is a one-time, irreversible action.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            columnGap: TOKENS.spacing[4],
            rowGap: TOKENS.spacing[2],
            padding: TOKENS.spacing[4],
            background: TOKENS.colors.bgTertiary,
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            borderRadius: TOKENS.radius.md,
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.xs,
          }}>
            <span style={{
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              Principal
            </span>
            <span style={{
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.textPrimary,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtUsdCompact(vault.deposited)}
            </span>
            <span style={{
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textGhost,
            }}>
              + Pending yield
            </span>
            <span style={{
              fontWeight: TOKENS.fontWeights.black,
              color: TOKENS.colors.accent,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}>
              +{fmtUsdCompact(vault.claimable ?? 0)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: TOKENS.fontSizes.xs, color: TOKENS.colors.textGhost }}>
            You will sign one transaction. Funds will arrive in your wallet within ~1 block.
          </p>
        </div>
      </Modal>
    </div>
  )
}

function WalletButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const isDemo = useDemoMode()

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`
  }

  const handleConnect = () => {
    const connector =
      connectors.find((c) => c.id === 'metaMask' || c.name === 'MetaMask') ?? connectors[0]
    if (connector) connect({ connector })
  }

  // Demo mode: compact pill with address only (banner already says "Demo Mode")
  if (isDemo) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
          background: TOKENS.colors.bgTertiary,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.md,
        }}
      >
        <span
          style={{
            width: TOKENS.dot.xs,
            height: TOKENS.dot.xs,
            borderRadius: TOKENS.radius.full,
            background: TOKENS.colors.accent,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            color: TOKENS.colors.textPrimary,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {formatAddress(DEMO_WALLET_ADDRESS)}
        </span>
      </div>
    )
  }

  if (!mounted || !isConnected) {
    return (
      <button
        type="button"
        title="Connect with MetaMask (Base)"
        onClick={handleConnect}
        disabled={!mounted || isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
          background: TOKENS.colors.accentSubtle,
          color: TOKENS.colors.accent,
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
          borderRadius: TOKENS.radius.md,
          fontFamily: MONO,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: !mounted ? 'default' : isConnecting ? 'wait' : 'pointer',
          opacity: !mounted || isConnecting ? 0.7 : 1,
          transition: TOKENS.transitions.fast,
        }}
        onMouseEnter={(e) => {
          if (mounted && !isConnecting) e.currentTarget.style.opacity = '0.9'
        }}
        onMouseLeave={(e) => {
          if (mounted && !isConnecting) e.currentTarget.style.opacity = '1'
        }}
      >
        <svg width={TOKENS.spacing[4]} height={TOKENS.spacing[4]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TOKENS.borders.thin}>
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 11h0" />
        </svg>
        {!mounted ? 'Connect' : isConnecting ? 'Connecting…' : 'Connect'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[2] }}>
      <span
        style={{
          fontFamily: MONO,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          color: TOKENS.colors.textGhost,
          textTransform: 'uppercase',
        }}
      >
        {address ? formatAddress(address) : 'Connected'}
      </span>
      <button
        onClick={() => disconnect()}
        style={{
          padding: TOKENS.spacing[2],
          background: 'transparent',
          border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: TOKENS.colors.textSecondary,
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = TOKENS.colors.accent
          e.currentTarget.style.color = TOKENS.colors.accent
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
          e.currentTarget.style.color = TOKENS.colors.textSecondary
        }}
        title="Disconnect"
      >
        <svg width={TOKENS.spacing[3]} height={TOKENS.spacing[3]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={TOKENS.borders.thin}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  )
}
