'use client'

import '@/styles/connect/dashboard-vars.css'
import { useConnectRouting } from './use-connect-routing'
import { TOKENS, SIDEBAR_WIDTH_PX, MONO } from './constants'
import { Sidebar } from './sidebar'
import { PortfolioSummary } from './portfolio-summary'
import { VaultDetailPanel } from './vault-detail-panel'
import { SubscribePanel } from './subscribe-panel'
import { SimulationPanel } from './simulation-panel'
import type { VaultLine, Aggregate } from './data'
import { VAULTS } from './data'

const WALLET = '0x5F…AA57'
const ON_DARK_GHOST = 'rgba(255,255,255,0.35)'

export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation } = useConnectRouting()

  return (
    <div
      className="connect-scope fixed inset-0 flex flex-col"
      style={{
        background: TOKENS.colors.bgApp,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
        WebkitFontSmoothing: 'antialiased',
        zIndex: 1,
        isolation: 'isolate',
        overflow: 'hidden',
        height: '100dvh',
      }}
    >
      <header
        className="shrink-0 flex items-center select-none"
        style={{
          height: TOKENS.spacing[16],
          width: '100%',
          minWidth: 0,
          background: TOKENS.colors.bgSidebar,
          boxShadow: 'inset 0 -1px 0 0 rgba(255,255,255,0.08)',
          padding: `0 ${TOKENS.spacing[6]} 0 0`,
          display: 'grid',
          gridTemplateColumns: `minmax(0,${SIDEBAR_WIDTH_PX}px) minmax(0,1fr)`,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${TOKENS.spacing[4]} 0 ${TOKENS.spacing[4]}`,
            minWidth: 0,
            height: '100%',
            borderRight: 'none',
          }}
        >
          <img
            src="/logos/hearst-connect-blackbg.svg"
            alt="Hearst Connect"
            style={{
              display: 'block',
              height: 42,
              maxWidth: 180,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
        <div
          className="flex min-w-0 items-center justify-end"
          style={{ height: '100%' }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.xs,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase' as const,
              color: ON_DARK_GHOST,
              marginRight: TOKENS.spacing[6],
            }}
          >
            {WALLET}
          </span>
        </div>
      </header>

      <main className="min-h-0 min-w-0 flex flex-1" style={{ overflow: 'hidden' }}>
        <Sidebar vaults={vaults} selectedId={selectedId} onSelect={setSelectedId} />
        <section
          className="min-h-0 min-w-0 flex-1"
          style={{ overflow: 'hidden', minWidth: 0, background: TOKENS.colors.bgPage }}
          aria-label="Main scene"
        >
          <MainPanel selected={selected} agg={agg} isSimulation={isSimulation} />
        </section>
      </main>
    </div>
  )
}

function MainPanel({
  selected,
  agg,
  isSimulation,
}: {
  selected: VaultLine | null
  agg: Aggregate
  isSimulation: boolean
}) {
  if (isSimulation) return <SimulationPanel />
  if (selected) {
    if (selected.type === 'available') return <SubscribePanel vault={selected} />
    return <VaultDetailPanel vault={selected} />
  }
  return <PortfolioSummary vaults={VAULTS} agg={agg} />
}
