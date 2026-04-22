'use client'

import { useEffect, useState } from 'react'
import '@/styles/connect/dashboard-vars.css'
import { useConnectRouting } from './use-connect-routing'
import { TOKENS, MONO } from './constants'
import { getSidebarWidthPx, useSmartFit } from './smart-fit'
import { Sidebar } from './sidebar'
import { PortfolioSummary } from './portfolio-summary'
import { VaultDetailPanel } from './vault-detail-panel'
import { SubscribePanel } from './subscribe-panel'
import { SimulationPanel } from './simulation-panel'
import type { VaultLine, Aggregate } from './data'
import { SIMULATION_VIEW_ID } from './view-ids'

const WALLET = '0x5F…AA57'
const ON_DARK_GHOST = 'rgba(255,255,255,0.35)'
const MOBILE_SIDEBAR_BREAKPOINT_PX = 768

function useMobileSidebar() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_SIDEBAR_BREAKPOINT_PX
  })

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_SIDEBAR_BREAKPOINT_PX - 1}px)`)
    const update = () => setIsMobile(media.matches)

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}

export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation } = useConnectRouting()
  const { mode } = useSmartFit({
    tightHeight: 760,
    limitHeight: 680,
    reserveHeight: 64,
  })
  const sidebarPx = getSidebarWidthPx(mode)
  const isMobileSidebar = useMobileSidebar()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const panelKey = isSimulation ? SIMULATION_VIEW_ID : selected?.id ?? 'portfolio'

  const handleSelect = (id: string | null) => {
    setSelectedId(id)
    if (isMobileSidebar) {
      setIsSidebarOpen(false)
    }
  }

  useEffect(() => {
    if (!isMobileSidebar) {
      setIsSidebarOpen(false)
    }
  }, [isMobileSidebar])

  useEffect(() => {
    if (!isSidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

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
        className="grid h-16 w-full min-w-0 shrink-0 select-none items-stretch"
        style={{
          gridTemplateColumns: isMobileSidebar
            ? 'minmax(0,1fr) auto'
            : `${sidebarPx}px minmax(0,1fr)`,
          background: TOKENS.colors.bgApp,
          borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
        }}
      >
        <div
          className="flex h-full min-w-0 items-center gap-3 px-4"
          style={{ paddingLeft: isMobileSidebar ? TOKENS.spacing[3] : TOKENS.spacing[4] }}
        >
          {isMobileSidebar && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-controls="connect-mobile-sidebar"
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                background: isSidebarOpen ? TOKENS.colors.accentDim : TOKENS.colors.bgSurface,
                color: isSidebarOpen ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
                transition: 'background var(--transition-base), color var(--transition-base), border-color var(--transition-base)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: MONO,
                  fontSize: TOKENS.fontSizes.sm,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                }}
              >
                NAV
              </span>
            </button>
          )}
          <img
            src="/logos/hearst-connect-blackbg.svg"
            alt="Hearst Connect"
            className="block h-[42px] w-auto max-w-[180px] object-contain"
          />
        </div>
        <div
          className="flex h-full min-w-0 items-center justify-end"
          style={{ paddingRight: isMobileSidebar ? TOKENS.spacing[3] : TOKENS.spacing[8] }}
        >
          <span
            className="text-right uppercase"
            style={{
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              color: ON_DARK_GHOST,
            }}
          >
            {WALLET}
          </span>
        </div>
      </header>

      <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!isMobileSidebar && (
          <Sidebar vaults={vaults} selectedId={selectedId} onSelect={handleSelect} />
        )}
        <section
          className="connect-main-scene min-h-0 min-w-0 flex-1 overflow-hidden"
          aria-label="Main scene"
        >
          <div key={panelKey} className="connect-panel-stage h-full min-h-0">
            <MainPanel
              vaults={vaults}
              selected={selected}
              agg={agg}
              isSimulation={isSimulation}
              onBack={() => handleSelect(null)}
              onVaultSelect={handleSelect}
            />
          </div>
        </section>
      </main>

      {isMobileSidebar && (
        <>
          <div
            aria-hidden={!isSidebarOpen}
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'absolute',
              inset: '64px 0 0 0',
              background: 'rgba(0,0,0,0.58)',
              opacity: isSidebarOpen ? 1 : 0,
              pointerEvents: isSidebarOpen ? 'auto' : 'none',
              transition: 'opacity var(--transition-base)',
              zIndex: 20,
            }}
          />
          <div
            id="connect-mobile-sidebar"
            aria-hidden={!isSidebarOpen}
            style={{
              position: 'absolute',
              top: '64px',
              bottom: 0,
              left: 0,
              width: 'min(320px, calc(100vw - 24px))',
              maxWidth: '100%',
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(calc(-100% - 12px))',
              opacity: isSidebarOpen ? 1 : 0,
              pointerEvents: isSidebarOpen ? 'auto' : 'none',
              transition: 'transform var(--transition-slow), opacity var(--transition-base)',
              zIndex: 30,
            }}
          >
            <Sidebar
              vaults={vaults}
              selectedId={selectedId}
              onSelect={handleSelect}
              mobile
            />
          </div>
        </>
      )}
    </div>
  )
}

function MainPanel({
  vaults,
  selected,
  agg,
  isSimulation,
  onBack,
  onVaultSelect,
}: {
  vaults: VaultLine[]
  selected: VaultLine | null
  agg: Aggregate
  isSimulation: boolean
  onBack: () => void
  onVaultSelect: (vaultId: string) => void
}) {
  if (isSimulation) return <SimulationPanel />
  if (selected) {
    if (selected.type === 'available') return <SubscribePanel vault={selected} />
    return <VaultDetailPanel vault={selected} onBack={onBack} />
  }
  return <PortfolioSummary vaults={vaults} agg={agg} onVaultSelect={onVaultSelect} />
}
