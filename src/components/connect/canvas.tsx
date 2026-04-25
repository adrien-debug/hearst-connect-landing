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
import { useAppMode } from '@/hooks/useAppMode'
import { useDemoPortfolio } from '@/hooks/useDemoPortfolio'
import { ThemeToggle } from '@/components/theme/theme-toggle'


export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation, isLoading } = useConnectRouting()
  const { toggleMode, isDemo, setMode } = useAppMode()
  const { actions: { reset } } = useDemoPortfolio()
  const [confirmReset, setConfirmReset] = useState(false)
  const isAvailableVaultsList = selectedId === AVAILABLE_VAULTS_VIEW_ID
  const panelKey = isSimulation ? SIMULATION_VIEW_ID : isAvailableVaultsList ? AVAILABLE_VAULTS_VIEW_ID : selected?.id ?? 'portfolio'

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
  }

  useEffect(() => {
    if (!confirmReset) return
    const t = setTimeout(() => setConfirmReset(false), 3000)
    return () => clearTimeout(t)
  }, [confirmReset])

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
            src="/logos/hearst.svg"
            alt="Hearst"
            style={{
              height: TOKENS.spacing[8],
              width: 'auto',
              display: 'block',
            }}
          />
        </div>

        {/* Demo: indicator (one-way to live) + reset + wallet. Live: wallet only */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: TOKENS.spacing[3] }}>
          {isDemo && (
            <>
              {/* Demo indicator - one way switch to live only */}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: TOKENS.spacing[2],
                  padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[1]} ${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
                  background: TOKENS.colors.accentDim,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accentSubtle}`,
                  borderRadius: TOKENS.radius.full,
                  color: TOKENS.colors.accent,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  textTransform: 'uppercase',
                  letterSpacing: TOKENS.letterSpacing.wide,
                  cursor: 'pointer',
                  transition: 'all var(--transition-default)',
                }}
                title="Passer en mode Live (registre + chaîne)"
              >
                <span>DÉMO</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: TOKENS.spacing[6],
                    height: TOKENS.spacing[6],
                    borderRadius: TOKENS.radius.full,
                    background: TOKENS.colors.accent,
                    transition: 'all var(--transition-default)',
                    boxShadow: `0 ${TOKENS.spacing[1]} ${TOKENS.spacing[2]} ${TOKENS.colors.accentSubtle}`,
                  }}
                >
                  <svg
                    width={TOKENS.spacing[3]}
                    height={TOKENS.spacing[3]}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={TOKENS.colors.black}
                    strokeWidth={TOKENS.borders.thick}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: 'rotate(0deg)',
                      transition: 'transform var(--transition-default)',
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmReset) {
                    reset()
                    setConfirmReset(false)
                  } else {
                    setConfirmReset(true)
                  }
                }}
                style={{
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                  background: confirmReset ? TOKENS.colors.danger : `${TOKENS.colors.danger}26`,
                  border: `${TOKENS.borders.thin} solid ${confirmReset ? TOKENS.colors.danger : `${TOKENS.colors.danger}80`}`,
                  borderRadius: TOKENS.radius.sm,
                  color: confirmReset ? TOKENS.colors.white : TOKENS.colors.danger,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  textTransform: 'uppercase',
                  letterSpacing: TOKENS.letterSpacing.wide,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                title="Réinitialiser le portefeuille démo"
                onMouseEnter={(e) => {
                  if (!confirmReset) {
                    e.currentTarget.style.background = `${TOKENS.colors.danger}40`
                    e.currentTarget.style.borderColor = `${TOKENS.colors.danger}CC`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!confirmReset) {
                    e.currentTarget.style.background = `${TOKENS.colors.danger}26`
                    e.currentTarget.style.borderColor = `${TOKENS.colors.danger}80`
                  }
                }}
              >
                {confirmReset ? 'Confirmer ?' : 'Reset'}
              </button>
            </>
          )}
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
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  if (!mounted || !isConnected) {
    return (
      <button
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
