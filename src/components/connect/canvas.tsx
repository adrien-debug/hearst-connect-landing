'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CapitalFlow } from './capital-flow'
import { TimeAxis } from './time-axis'
import { VaultStream } from './vault-stream'
import { FlowActions } from './flow-actions'

export function Canvas() {
  return (
    <div
      className="connect-canvas"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--dashboard-page)',
        color: 'var(--dashboard-text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          width: '100%',
          maxWidth: '64rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem clamp(1rem, 4vw, 2rem)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--dashboard-text-xs)',
            letterSpacing: 'var(--dashboard-letter-spacing-panel-label)',
            color: 'var(--dashboard-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Hearst · Connect
        </span>
        <ConnectButton
          accountStatus="address"
          chainStatus="icon"
          showBalance={false}
        />
      </header>

      {/* Main continuous stream */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '42rem',
          padding: '0 clamp(1rem, 4vw, 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Time flows first — temporal context */}
        <TimeAxis />

        {/* Separator */}
        <div
          style={{
            height: '1px',
            background: 'var(--dashboard-border)',
            margin: '0.5rem 0',
          }}
        />

        {/* Capital flow — the main data visualization */}
        <CapitalFlow />

        {/* Separator */}
        <div
          style={{
            height: '1px',
            background: 'var(--dashboard-border)',
            margin: '0.5rem 0',
          }}
        />

        {/* Vault constraint stream */}
        <VaultStream />

        {/* Separator */}
        <div
          style={{
            height: '1px',
            background: 'var(--dashboard-border)',
            margin: '0.5rem 0',
          }}
        />

        {/* Actions — deposit / withdraw / claim */}
        <FlowActions />
      </main>

      {/* Ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translateX(-50%)',
          background:
            'radial-gradient(ellipse, var(--dashboard-accent-glow) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  )
}
