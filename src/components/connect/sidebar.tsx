'use client'

import { FONT, MONO, fmtUsd } from './constants'
import type { VaultLine, Aggregate } from './data'

interface SidebarProps {
  vaults: VaultLine[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  agg: Aggregate
  selected: VaultLine | null
}

export function Sidebar({ vaults, selectedId, onSelect, agg, selected }: SidebarProps) {
  const activeVaults = vaults.filter(v => v.type === 'active')
  const availableVaults = vaults.filter(v => v.type === 'available')

  const deposited = selected?.type === 'active' ? (selected.deposited || 0) : agg.totalDeposited
  const claimable = selected?.type === 'active' ? (selected.claimable || 0) : agg.totalClaimable
  const apr = selected ? selected.apr : agg.avgApr
  const portfolioValue = deposited + claimable

  return (
    <aside className="flex flex-col shrink-0" style={{ width: 'clamp(260px, 28vw, 340px)', padding: '28px clamp(1rem, 2.5vw, 1.75rem)', overflowY: 'auto' }}>

      {/* Big Number */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)', marginBottom: '6px' }}>
          {selected ? selected.name : 'Portfolio Value'}
        </div>
        {selected?.type === 'available' ? (
          <div style={{ fontFamily: FONT, fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            <span style={{ color: 'var(--dashboard-accent)' }}>{selected.apr.toFixed(1)}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--dashboard-text-ghost)' }}>% APY</span>
          </div>
        ) : (
          <BigNum value={portfolioValue} />
        )}
      </div>

      {/* Contextual Metrics */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '11px', paddingBottom: '20px', borderBottom: '1px solid var(--dashboard-border)' }}>
        {selected?.type === 'available' ? (<>
          <MetricRow label="Min Deposit" value={fmtUsd(selected.minDeposit || 0)} />
          <MetricRow label="Lock Period" value={selected.lockPeriod || ''} />
          <MetricRow label="Target" value={(selected.target || '') + ' Cumul.'} />
          <MetricRow label="Risk" value={selected.risk || ''} />
          <MetricRow label="Fees" value={selected.fees || ''} />
          <MetricRow label="Strategy" value={selected.strategy || ''} small />
        </>) : (<>
          <MetricRow label="Deposited" value={fmtUsd(deposited)} />
          <MetricRow label="Claimable" value={fmtUsd(claimable)} accent />
          <MetricRow label="APR" value={`${apr.toFixed(1)}%`} />
          <MetricRow label="Status" value={selected ? (selected.canWithdraw ? 'Unlocked' : 'Locked') : 'Locked'} />
          {selected?.maturity && <MetricRow label="Matures" value={selected.maturity} />}
          {selected?.target && <MetricRow label="Target" value={selected.target + ' Cumul.'} />}
        </>)}
      </div>

      {/* MY VAULTS */}
      <VaultGroup label="My Vaults" vaults={activeVaults} selectedId={selectedId} onSelect={onSelect} />

      {/* AVAILABLE VAULTS */}
      <VaultGroup label="Available Vaults" vaults={availableVaults} selectedId={selectedId} onSelect={onSelect} available />
    </aside>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────

function VaultGroup({ label, vaults, selectedId, onSelect, available = false }: {
  label: string
  vaults: VaultLine[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  available?: boolean
}) {
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)', marginBottom: '10px' }}>{label}</div>
      {vaults.map(v => (
        <button
          key={v.id}
          onClick={() => onSelect(selectedId === v.id ? null : v.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '9px 0',
            background: 'none',
            backgroundColor: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '1px solid var(--dashboard-border)',
            borderRadius: 0,
            boxShadow: 'none',
            fontWeight: 400,
            fontSize: 'inherit',
            color: 'inherit',
            gap: 0,
            cursor: 'pointer',
            opacity: selectedId === v.id ? 1 : 0.55,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = selectedId === v.id ? '1' : '0.55' }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: FONT, fontSize: '0.78rem', fontWeight: 500, color: 'var(--dashboard-text-primary)' }}>{v.name}</div>
            <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)', marginTop: '2px' }}>{v.strategy}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
            {available ? (<>
              <div style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--dashboard-accent)', fontWeight: 600 }}>{v.apr}% APY</div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)', marginTop: '2px' }}>from {fmtUsd(v.minDeposit || 0)}</div>
            </>) : (<>
              <div style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--dashboard-text-primary)' }}>{fmtUsd(v.deposited || 0)}</div>
              <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-accent)', marginTop: '2px' }}>{v.apr}% APR</div>
            </>)}
          </div>
        </button>
      ))}
    </div>
  )
}

function BigNum({ value }: { value: number }) {
  const [whole, dec] = value.toFixed(2).split('.')
  return (
    <div style={{ fontFamily: FONT, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}>
      <span style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)' }}>${Number(whole).toLocaleString('en-US')}</span>
      <span style={{ fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)', color: 'var(--dashboard-text-ghost)' }}>.{dec}</span>
    </div>
  )
}

function MetricRow({ label, value, accent = false, small = false }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ fontFamily: FONT, fontSize: small ? '0.72rem' : '0.78rem', color: 'var(--dashboard-text-muted)' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: small ? '10px' : '12px', color: accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)', letterSpacing: '0.02em', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
    </div>
  )
}
