'use client'

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
import { VAULTS } from './data'

const WALLET = '0x5F…AA57'
const ON_DARK_GHOST = 'rgba(255,255,255,0.35)'

export function Canvas() {
  const { vaults, agg, selectedId, setSelectedId, selected, isSimulation } = useConnectRouting()
  const { mode } = useSmartFit({
    tightHeight: 760,
    limitHeight: 680,
    reserveHeight: 64,
  })
  const sidebarPx = getSidebarWidthPx(mode)

  return (
    <div
      className="connect-scope fixed inset-0 z-[1] flex flex-col overflow-hidden antialiased [isolation:isolate] h-[100dvh]"
      style={{
        background: TOKENS.colors.bgApp,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
      }}
    >
      <header
        className="grid h-16 w-full min-w-0 shrink-0 select-none items-stretch bg-[#050505] border-b border-[rgba(255,255,255,0.08)]"
        style={{ gridTemplateColumns: `${sidebarPx}px minmax(0,1fr)` }}
      >
        <div className="flex h-full min-w-0 items-center px-4">
          <img
            src="/logos/hearst-connect-blackbg.svg"
            alt="Hearst Connect"
            className="block h-[42px] w-auto max-w-[180px] object-contain"
          />
        </div>
        <div className="flex h-full min-w-0 items-center justify-end pr-8">
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
        <Sidebar vaults={vaults} selectedId={selectedId} onSelect={setSelectedId} />
        <section
          className="connect-main-scene min-h-0 min-w-0 flex-1 overflow-hidden"
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
