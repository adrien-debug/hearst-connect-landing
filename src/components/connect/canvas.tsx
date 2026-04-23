'use client'

import '@/styles/connect/dashboard-vars.css'
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

const ON_DARK_GHOST = 'rgba(255,255,255,0.35)'

export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation, hasVaults, isLoading } = useConnectRouting()
  const isAvailableVaultsList = selectedId === AVAILABLE_VAULTS_VIEW_ID
  const panelKey = isSimulation ? SIMULATION_VIEW_ID : isAvailableVaultsList ? AVAILABLE_VAULTS_VIEW_ID : selected?.id ?? 'portfolio'

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
  }

  const availableVaults = vaults.filter((v): v is AvailableVault => v.type === 'available')

  // Show loading state
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
            height: '64px',
            width: '100%',
            background: TOKENS.colors.bgApp,
            borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
            paddingLeft: TOKENS.spacing[6],
            paddingRight: TOKENS.spacing[6],
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <img
              src="/logos/hearst.svg"
              alt="Hearst"
              style={{
                height: TOKENS.spacing[8],
                width: 'auto',
                display: 'block',
              }}
            />
          </div>
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
          <LoadingState />
        </main>
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
          height: '64px',
          width: '100%',
          background: TOKENS.colors.bgApp,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
          paddingLeft: TOKENS.spacing[6],
          paddingRight: TOKENS.spacing[6],
          zIndex: 100,
        }}
      >
        {/* Logo - aligné à gauche */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: TOKENS.spacing[4] }}>
          <img
            src="/logos/hearst.svg"
            alt="Hearst"
            style={{
              height: TOKENS.spacing[8],
              width: 'auto',
              display: 'block',
            }}
          />
          <a
            href="/admin"
            style={{
              padding: `${TOKENS.spacing[2 as 2]}px ${TOKENS.spacing[3 as 3]}px`,
              background: 'transparent',
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.md,
              color: TOKENS.colors.textGhost,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 120ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = TOKENS.colors.accent
              e.currentTarget.style.color = TOKENS.colors.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = TOKENS.colors.borderSubtle
              e.currentTarget.style.color = TOKENS.colors.textGhost
            }}
          >
            Admin
          </a>
        </div>

        {/* Wallet / Connect Button - aligné à droite */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <WalletButton />
        </div>
      </header>

      <main 
        className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
        style={{ paddingBottom: '96px' }} // Réserve l'espace pour le dock en bas
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
      <DockRadial
        selectedId={selectedId}
        onSelect={handleSelect}
        isSimulation={isSimulation}
      />
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
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`
  }

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: TOKENS.spacing[2],
          padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
          background: TOKENS.colors.accent,
          color: TOKENS.colors.black,
          border: 'none',
          borderRadius: TOKENS.radius.md,
          fontFamily: MONO,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase',
          cursor: isConnecting ? 'wait' : 'pointer',
          opacity: isConnecting ? 0.7 : 1,
          transition: 'all 120ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (!isConnecting) e.currentTarget.style.opacity = '0.9'
        }}
        onMouseLeave={(e) => {
          if (!isConnecting) e.currentTarget.style.opacity = '1'
        }}
      >
        <svg width={TOKENS.spacing[4]} height={TOKENS.spacing[4]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 11h0" />
        </svg>
        {isConnecting ? 'Connecting…' : 'Connect'}
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
          color: ON_DARK_GHOST,
          textTransform: 'uppercase',
        }}
      >
        {address ? formatAddress(address) : 'Connected'}
      </span>
      <button
        onClick={() => disconnect()}
        style={{
          padding: `${TOKENS.spacing[2]}px`,
          background: 'transparent',
          border: `1px solid ${TOKENS.colors.borderSubtle}`,
          borderRadius: TOKENS.radius.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: TOKENS.colors.textSecondary,
          transition: 'all 120ms ease-out',
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
        <svg width={TOKENS.spacing[3]} height={TOKENS.spacing[3]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  )
}
