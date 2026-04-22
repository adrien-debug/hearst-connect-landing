'use client'

import { useState } from 'react'
import { MONO, TOKENS } from './constants'
import { VAULTS, aggregate, type VaultLine, type Aggregate } from './data'
import { Sidebar } from './sidebar'
import { PortfolioSummary } from './portfolio-summary'
import { VaultDetailPanel } from './vault-detail-panel'
import { SubscribePanel } from './subscribe-panel'
import { SimulationPanel } from './simulation-panel'
import { SIMULATION_VIEW_ID } from './view-ids'

const WALLET = '0x5F...AA57'
const ON_DARK_GHOST = 'rgba(255,255,255,0.35)' // ghost text sur fond noir

export function Canvas() {
  const agg = aggregate(VAULTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isSimulation = selectedId === SIMULATION_VIEW_ID

  const selected = selectedId && !isSimulation ? VAULTS.find(v => v.id === selectedId) ?? null : null

  return (
    <div
      className="connect-scope fixed inset-0 flex flex-col"
      style={{
        background: TOKENS.colors.bgPage,
        color: TOKENS.colors.textPrimary,
        fontFamily: TOKENS.fonts.sans,
        WebkitFontSmoothing: 'antialiased',
        zIndex: 1,
        isolation: 'isolate',
        overflow: 'hidden',
      }}
    >
      {/* ══ HEADER NOIR 64px ══ */}
      <header
        className="shrink-0 flex items-center select-none"
        style={{
          height: TOKENS.spacing[16],
          background: TOKENS.colors.black,
          borderBottom: `${TOKENS.borders.thin} solid rgba(255,255,255,0.12)`,
          padding: `0 ${TOKENS.spacing[8]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <img
          src="/logos/hearst-connect-blackbg.svg"
          alt="Hearst Connect"
          style={{
            display: 'block',
            height: '180px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <span style={{
          fontFamily: MONO,
          fontSize: TOKENS.fontSizes.xs,
          fontWeight: TOKENS.fontWeights.bold,
          letterSpacing: TOKENS.letterSpacing.display,
          textTransform: 'uppercase' as const,
          color: ON_DARK_GHOST,
        }}>{WALLET}</span>
      </header>

      <main className="flex-1 flex min-h-0 min-w-0" style={{ overflow: 'hidden' }}>
        <Sidebar
          vaults={VAULTS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          agg={agg}
        />
        <MainPanel selected={selected} agg={agg} isSimulation={isSimulation} />
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
