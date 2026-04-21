'use client'

import { FONT, MONO, fmtUsd } from './constants'
import { MonthlyGauge } from './monthly-gauge'
import type { VaultLine } from './data'

interface VaultDetailPanelProps {
  vault: VaultLine
}

export function VaultDetailPanel({ vault }: VaultDetailPanelProps) {
  const currentValue = (vault.deposited || 0) + (vault.claimable || 0)

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ overflow: 'hidden', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '28px' }}>
        {([
          { k: 'Deposited', v: fmtUsd(vault.deposited || 0) },
          { k: 'Current Value', v: fmtUsd(currentValue), accent: true },
          { k: 'Yield Paid', v: fmtUsd(vault.claimable || 0), accent: true },
          { k: 'Matures', v: vault.maturity || '—' },
        ] as const).map(item => (
          <div key={item.k} style={{ border: '1px solid var(--dashboard-border)', padding: '14px', background: 'var(--dashboard-surface)' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)', marginBottom: '6px' }}>{item.k}</div>
            <div style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 600, color: 'accent' in item && item.accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)' }}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* Cumulative target progress */}
      <div style={{ border: '1px solid var(--dashboard-border)', padding: '16px', background: 'var(--dashboard-surface)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)' }}>Cumulative Target Progress</span>
          <span style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)' }}>{vault.progress}% of {vault.target}</span>
        </div>
        <div style={{ height: '6px', background: 'var(--dashboard-border)', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${vault.progress || 0}%`, background: 'var(--dashboard-accent)', transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)' }}>
          Capital unlocks when {vault.target} cumulative target is reached or at maturity — whichever comes first. Yield distributed daily.
        </div>
      </div>

      {/* Monthly gauge */}
      <div style={{ marginBottom: '20px' }}>
        <MonthlyGauge deposited={vault.deposited || 0} apr={vault.apr} />
      </div>

      {/* Capital recovery + Strategy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ border: '1px solid var(--dashboard-border)', padding: '14px', background: 'var(--dashboard-surface)' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dashboard-accent)', marginBottom: '6px' }}>✓ Capital Recovery</div>
          <div style={{ fontFamily: FONT, fontSize: '0.78rem', color: 'var(--dashboard-text-muted)', lineHeight: 1.5 }}>
            Safeguard active — not triggered. If principal is below initial deposit at maturity, mining infrastructure operates for up to 2 additional years to restore capital.
          </div>
        </div>
        <div style={{ border: '1px solid var(--dashboard-border)', padding: '14px', background: 'var(--dashboard-surface)' }}>
          <div style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)', marginBottom: '8px' }}>Strategy · Sideways Regime</div>
          <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-primary)', marginBottom: '8px' }}>{vault.strategy}</div>
          <div style={{ display: 'flex', height: '6px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ width: '40%', background: 'var(--dashboard-accent)' }} />
            <div style={{ width: '30%', background: 'var(--dashboard-text-primary)' }} />
            <div style={{ width: '30%', background: 'var(--dashboard-text-ghost)' }} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: '9px', color: 'var(--dashboard-text-ghost)' }}>40% RWA · 30% USDC · 30% BTC</div>
        </div>
      </div>

    </div>
  )
}
