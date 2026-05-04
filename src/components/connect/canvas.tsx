'use client'

import '@/styles/connect/dashboard-vars.css'
import { useEffect, useState } from 'react'
import { useConnectRouting } from './use-connect-routing'
import { TOKENS, MONO } from './constants'
import { PortfolioSummary } from './portfolio-summary'
import { VaultDetailPanel } from './vault-detail-panel'
import { SubscribePanel } from './subscribe-panel'
import { SimulationPanel } from './simulation-panel'
import { AvailableVaultsPanel } from './available-vaults-panel'
import { LoadingState } from './empty-states'
import type { VaultLine, Aggregate, AvailableVault } from './data'
import { SIMULATION_VIEW_ID, AVAILABLE_VAULTS_VIEW_ID } from './view-ids'
import { DockRadial } from './dock-radial'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ThemeToggle } from '@/components/theme/theme-toggle'


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
        className="connect-scope fixed inset-0 z-1 flex h-dvh flex-col overflow-hidden antialiased isolate"
        style={{
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
            background: TOKENS.colors.bgApp,
            borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            paddingLeft: TOKENS.spacing[6],
            paddingRight: TOKENS.spacing[6],
            zIndex: 'var(--z-dropdown)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <img
              src="/logos/hearst-ai-black.svg"
              alt="Hearst AI"
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
          style={{ paddingBottom: `calc(6 * ${TOKENS.spacing[4]})` }}
        >
          <LoadingState />
        </main>
        <DockRadial onSelect={setSelectedId} />
      </div>
    )
  }

  return (
    <div
      className="connect-scope fixed inset-0 z-1 flex h-dvh flex-col overflow-hidden antialiased isolate"
      style={{
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
          background: TOKENS.colors.bgApp,
          borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          paddingLeft: TOKENS.spacing[6],
          paddingRight: TOKENS.spacing[6],
          zIndex: 100,
        }}
      >
        {/* Logo - aligné à gauche */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: TOKENS.spacing[4] }}>
          <img
            src="/logos/hearst-ai-black.svg"
            alt="Hearst AI"
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
        style={{ paddingBottom: `calc(6 * ${TOKENS.spacing[4]})` }}
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

      {/* Dock Radial Navigation */}
      <DockRadial onSelect={handleSelect} />
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
    return <VaultDetailPanel vault={selected} onBack={onBack} />
  }
  if (isAvailableVaultsList) {
    return <AvailableVaultsPanel vaults={availableVaults} onVaultSelect={onVaultSelect} onBack={onBack} />
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

function WalletButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

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
          background: TOKENS.colors.accent,
          color: TOKENS.colors.black,
          border: TOKENS.borders.none,
          borderRadius: TOKENS.radius.md,
          fontFamily: MONO,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: !mounted ? 'default' : isConnecting ? 'wait' : 'pointer',
          opacity: !mounted || isConnecting ? 0.7 : 1,
          transition: 'all var(--transition-fast)',
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
