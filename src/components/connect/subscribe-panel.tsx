'use client'

import { useState } from 'react'
import { FONT, MONO, fmtUsd } from './constants'
import type { VaultLine } from './data'

interface SubscribePanelProps {
  vault: VaultLine
}

export function SubscribePanel({ vault }: SubscribePanelProps) {
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)

  const num = parseFloat(amount) || 0
  const isValid = num >= (vault.minDeposit || 0)
  const isReady = isValid && agreed
  const yearlyYield = num * (vault.apr / 100)
  const totalYield = num * (parseFloat(vault.target || '0') / 100)

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ overflow: 'hidden', padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '28px' }}>
        {[
          { k: 'Target APY', v: vault.apr + '%', accent: true },
          { k: 'Lock Period', v: vault.lockPeriod || '' },
          { k: 'Min Deposit', v: fmtUsd(vault.minDeposit || 0) },
          { k: 'Risk Profile', v: vault.risk || '' },
        ].map(item => (
          <div key={item.k} style={{ border: '1px solid var(--dashboard-border)', padding: '14px', background: 'var(--dashboard-surface)' }}>
            <div style={{ fontFamily: MONO, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dashboard-text-ghost)', marginBottom: '6px' }}>{item.k}</div>
            <div style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 600, color: item.accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)' }}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dashboard-text-ghost)', marginBottom: '8px' }}>
          Amount (USDC)
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${isValid ? 'var(--dashboard-accent)' : 'var(--dashboard-border)'}`,
          paddingBottom: '8px',
          transition: 'border-color 0.2s ease',
        }}>
          <span style={{ fontFamily: MONO, fontSize: '2rem', color: 'var(--dashboard-text-ghost)', marginRight: '12px' }}>&gt;</span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--dashboard-text-primary)', fontSize: '2.2rem', fontFamily: MONO, width: '100%' }}
          />
          <span style={{ fontFamily: MONO, fontSize: '1rem', color: 'var(--dashboard-text-ghost)' }}>USDC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontFamily: MONO, fontSize: '10px' }}>
          <span style={{ color: 'var(--dashboard-text-ghost)' }}>Wallet balance: 742,110 USDC</span>
          {num > 0 && !isValid && (
            <span style={{ color: '#EF4444' }}>Min. deposit is {fmtUsd(vault.minDeposit || 0)}</span>
          )}
          {isValid && (
            <span style={{ color: 'var(--dashboard-accent)' }}>✓ Minimum reached</span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        border: '1px solid var(--dashboard-border)',
        background: 'var(--dashboard-surface)',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <SummaryRow label="You deposit" value={num > 0 ? fmtUsd(num) + ' USDC' : '—'} />
        <SummaryRow label="Est. yearly yield" value={num > 0 ? '+ ' + fmtUsd(yearlyYield) : '—'} accent />
        <SummaryRow label="Total yield at close" value={num > 0 ? '+ ' + fmtUsd(totalYield) : '—'} accent />
        <SummaryRow label="Capital unlocks" value={`When ${vault.target} target hit · max 3 years`} />
        <SummaryRow label="Fees" value={vault.fees || ''} />
      </div>

      {/* Agree + CTA */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ accentColor: 'var(--dashboard-accent)', width: '14px', height: '14px' }}
        />
        <span style={{ fontFamily: FONT, fontSize: '0.82rem', color: 'var(--dashboard-text-muted)' }}>
          I have read and accept the term sheet.
        </span>
      </label>

      <button
        disabled={!isReady}
        style={{
          width: '100%',
          padding: '14px',
          background: isReady ? 'var(--dashboard-accent)' : 'transparent',
          color: isReady ? '#000' : 'var(--dashboard-text-ghost)',
          border: `1px solid ${isReady ? 'var(--dashboard-accent)' : 'var(--dashboard-border)'}`,
          borderRadius: 0,
          boxShadow: 'none',
          fontFamily: MONO,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: isReady ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {isReady ? '[ CONFIRM DEPOSIT ]' : '[ AWAITING INPUT ]'}
      </button>

    </div>
  )
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: FONT, fontSize: '0.78rem', color: 'var(--dashboard-text-muted)' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: '12px', color: accent ? 'var(--dashboard-accent)' : 'var(--dashboard-text-primary)' }}>{value}</span>
    </div>
  )
}
