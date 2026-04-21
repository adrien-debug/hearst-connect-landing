'use client'

import { FONT, MONO, fmtUsd } from './constants'
import { MonthlyGauge } from './monthly-gauge'
import type { VaultLine, Aggregate } from './data'

interface PortfolioSummaryProps {
  vaults: VaultLine[]
  agg: Aggregate
}

export function PortfolioSummary({ vaults, agg }: PortfolioSummaryProps) {
  const activeVaults = vaults.filter(v => v.type === 'active')
  const availableVaults = vaults.filter(v => v.type === 'available')

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ overflow: 'hidden', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

      {/* HERO: Monthly gauge — dominant, centered */}
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '48px', paddingBottom: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
          <MonthlyGauge
            deposited={agg.totalDeposited}
            apr={agg.avgApr}
            label={`${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ${agg.avgApr.toFixed(1)}% Avg APR`}
          />
          <NextDistribution />
        </div>
      </div>

      {/* SECONDARY: Active positions — subdued */}
      <div style={{ opacity: 0.6, marginTop: '16px' }}>
        <VaultList vaults={activeVaults} />
      </div>

      {/* TERTIARY: Available vaults — background level */}
      <div style={{ opacity: 0.5, transform: 'scale(0.98)', transformOrigin: 'top left' }}>
        <AvailableVaultCards vaults={availableVaults} />
      </div>
    </div>
  )
}

// ─── VaultList (Active Positions Table) ──────────────────────────────────

function VaultList({ vaults }: { vaults: VaultLine[] }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SectionLabel>Active Positions</SectionLabel>
      <div style={{ border: '1px solid var(--dashboard-border)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr 1fr',
          padding: '8px 14px',
          borderBottom: '1px solid var(--dashboard-border)',
          background: 'var(--dashboard-surface)',
        }}>
          {['Vault', 'Deposited', 'Current Value', 'APR', 'Lock Progress', 'Matures'].map(h => (
            <span key={h} style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)' }}>{h}</span>
          ))}
        </div>

        {vaults.map(v => <VaultRow key={v.id} vault={v} />)}
      </div>
    </div>
  )
}

function VaultRow({ vault: v }: { vault: VaultLine }) {
  const currentValue = (v.deposited || 0) + (v.claimable || 0)
  const gainPct = (((v.claimable || 0) / (v.deposited || 1)) * 100).toFixed(1)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr 1fr',
      padding: '12px 14px',
      borderBottom: '1px solid var(--dashboard-border)',
      alignItems: 'center',
    }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: '0.8rem', fontWeight: 500 }}>{v.name}</div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)', marginTop: '2px' }}>{v.strategy}</div>
      </div>
      <span style={{ fontFamily: MONO, fontSize: '12px' }}>{fmtUsd(v.deposited || 0)}</span>
      <div>
        <div style={{ fontFamily: MONO, fontSize: '12px' }}>{fmtUsd(currentValue)}</div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-accent)' }}>+{gainPct}%</div>
      </div>
      <span style={{ fontFamily: MONO, fontSize: '12px', color: 'var(--dashboard-accent)' }}>{v.apr}%</span>
      <div>
        <div style={{ height: '4px', background: 'var(--dashboard-border)', marginBottom: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${v.progress || 0}%`, background: 'var(--dashboard-accent)' }} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)' }}>{v.progress}% of {v.target}</div>
      </div>
      <span style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--dashboard-text-ghost)' }}>{v.maturity}</span>
    </div>
  )
}

// ─── Available Vault Cards ───────────────────────────────────────────────

function AvailableVaultCards({ vaults }: { vaults: VaultLine[] }) {
  return (
    <div>
      <SectionLabel>Available Vaults</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {vaults.map(v => (
          <div key={v.id} style={{ border: '1px solid var(--dashboard-border)', padding: '16px', background: 'var(--dashboard-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)', marginTop: '3px' }}>{v.strategy}</div>
              </div>
              <div style={{ fontFamily: MONO, fontSize: '1.4rem', fontWeight: 700, color: 'var(--dashboard-accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {v.apr}%<span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--dashboard-text-ghost)' }}> APY</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--dashboard-border)' }}>
              {[
                { k: 'Lock', val: v.lockPeriod || '' },
                { k: 'Target', val: (v.target || '') + ' Cumul.' },
                { k: 'Risk', val: v.risk || '' },
              ].map(item => (
                <div key={item.k}>
                  <div style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dashboard-text-ghost)', marginBottom: '2px' }}>{item.k}</div>
                  <div style={{ fontFamily: MONO, fontSize: '11px', color: 'var(--dashboard-text-primary)' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Next Distribution ───────────────────────────────────────────────────

function NextDistribution() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

  return (
    <div style={{ border: '1px solid var(--dashboard-border)', padding: '14px 18px', minWidth: '160px' }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)', marginBottom: '6px' }}>Next Distribution</div>
      <div style={{ fontFamily: MONO, fontSize: '16px', fontWeight: 600, color: 'var(--dashboard-text-primary)' }}>Tomorrow</div>
      <div style={{ fontFamily: MONO, fontSize: '10px', color: 'var(--dashboard-text-ghost)', marginTop: '4px' }}>{dateStr} · 00:00 UTC</div>
    </div>
  )
}

// ─── Shared ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)', marginBottom: '12px' }}>
      {children}
    </div>
  )
}
