'use client'

import Link from 'next/link'
import { useMemo, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import { useVaultRegistry } from '@/hooks/useVaultRegistry'
import { fmtUsdCompact } from '@/components/connect/constants'
import { formatVaultName } from '@/components/connect/formatting'
import type { AvailableVault } from '@/components/connect/data'
import { toAvailableVault } from '@/lib/default-vaults'
import { ThemeToggle } from '@/components/theme/theme-toggle'

const PILLARS = [
  'Industrial mining yield',
  'Monthly USDC distributions',
  'Institutional controls',
  'On-chain proof of reserves',
  'Audited smart contracts',
] as const

function formatShortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// Header Wallet - Top right like standard DeFi apps
function HeaderWallet() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending, reset } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  useEffect(() => {
    setMounted(true)
  }, [])

  const wrongChain = isConnected && chainId !== base.id

  if (!mounted) {
    return (
      <button className="vaults-header-btn" disabled>
        <span className="vaults-header-btn-text">Connect</span>
      </button>
    )
  }

  if (!isConnected) {
    return (
      <button
        type="button"
        className="vaults-header-btn vaults-header-btn--primary"
        disabled={isPending}
        onClick={() => {
          const connector = connectors[0]
          if (connector) {
            reset()
            connect({ connector })
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 11h0" />
        </svg>
        <span className="vaults-header-btn-text">{isPending ? '…' : 'Connect'}</span>
      </button>
    )
  }

  if (wrongChain) {
    return (
      <button
        type="button"
        className="vaults-header-btn vaults-header-btn--warning"
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: base.id })}
      >
        <span className="vaults-header-btn-text">{isSwitching ? '…' : 'Switch Network'}</span>
      </button>
    )
  }

  return (
    <div className="vaults-header-wallet">
      <span className="vaults-header-address">{formatShortAddress(address)}</span>
      <button
        type="button"
        className="vaults-header-btn vaults-header-btn--ghost"
        onClick={() => disconnect()}
        title="Disconnect"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  )
}

// Sidebar Wallet Section
function WalletSection() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending, error, reset } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  useEffect(() => {
    setMounted(true)
  }, [])

  const wrongChain = isConnected && chainId !== base.id

  if (!mounted) {
    return (
      <div className="vaults-wallet-section" aria-busy="true">
        <span>…</span>
      </div>
    )
  }

  // Not connected - show connect buttons
  if (!isConnected) {
    return (
      <div className="vaults-wallet-section">
        <p className="vaults-wallet-hint">Connect your wallet to access the platform</p>
        <div className="vaults-wallet-buttons">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="vaults-btn vaults-btn--primary"
              disabled={isPending || !connector.ready}
              onClick={() => {
                reset()
                connect({ connector })
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 11h0" />
              </svg>
              {isPending ? 'Connecting…' : connector.name}
            </button>
          ))}
        </div>
        {error ? (
          <p className="vaults-error" role="alert">
            {error.message.length > 120 ? `${error.message.slice(0, 120)}…` : error.message}
          </p>
        ) : null}
      </div>
    )
  }

  // Wrong chain - show switch button
  if (wrongChain) {
    return (
      <div className="vaults-wallet-section">
        <p className="vaults-wallet-hint vaults-wallet-hint--warning">
          Wrong network detected
        </p>
        <button
          type="button"
          className="vaults-btn vaults-btn--accent"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: base.id })}
        >
          {isSwitching ? 'Switching…' : 'Switch to Base'}
        </button>
      </div>
    )
  }

  // Connected - show address and enter button
  return (
    <div className="vaults-wallet-section vaults-wallet-section--connected">
      <div className="vaults-wallet-info">
        <span className="vaults-wallet-badge">Connected</span>
        {address ? <span className="vaults-wallet-address">{formatShortAddress(address)}</span> : null}
      </div>
      <div className="vaults-wallet-actions">
        <Link href="/app" className="vaults-btn vaults-btn--enter">
          <span>Enter Platform</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <button
          type="button"
          className="vaults-btn vaults-btn--ghost"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

function VaultCard({ vault, index }: { vault: AvailableVault; index: number }) {
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0
  const isEven = index % 2 === 0

  return (
    <div className="vaults-card">
      <div className="vaults-card-header">
        <div className="vaults-card-title-group">
          {vault.image && (
            <img
              src={vault.image}
              alt={vault.name}
              className="vaults-card-image"
              width="48"
              height="48"
            />
          )}
          <div>
            <h3 className="vaults-card-name">{formatVaultName(vault.name)}</h3>
            <p className="vaults-card-strategy">{vault.strategy}</p>
          </div>
        </div>
        <div className={`vaults-card-apr ${isEven ? 'vaults-card-apr--accent' : ''}`}>
          {vault.apr}%
          <span className="vaults-card-apr-label">APR</span>
        </div>
      </div>

      <div className="vaults-card-stats">
        <div className="vaults-stat">
          <span className="vaults-stat-label">Target</span>
          <span className="vaults-stat-value">{vault.target}</span>
        </div>
        <div className="vaults-stat">
          <span className="vaults-stat-label">Lock Period</span>
          <span className="vaults-stat-value">{vault.lockPeriod}</span>
        </div>
        <div className="vaults-stat">
          <span className="vaults-stat-label">Min Deposit</span>
          <span className="vaults-stat-value">{fmtUsdCompact(vault.minDeposit)}</span>
        </div>
        <div className="vaults-stat">
          <span className="vaults-stat-label">Risk Level</span>
          <span className="vaults-stat-value">{vault.risk}</span>
        </div>
      </div>

      <div className="vaults-card-progress">
        <div className="vaults-progress-header">
          <span>Target Yield</span>
          <span className={isEven ? 'text-accent' : ''}>{vault.target}</span>
        </div>
        <div className="vaults-progress-bar">
          <div
            className="vaults-progress-fill"
            style={{ width: '0%', background: isEven ? 'var(--accent)' : 'var(--white)' }}
          />
        </div>
        <p className="vaults-progress-note">
          Potential return: ~{targetPct}% cumulative over {vault.lockPeriod.toLowerCase()}
        </p>
      </div>

      <div className="vaults-card-footer">
        <span className="vaults-card-fees">{vault.fees}</span>
        <span className="vaults-card-cta">Connect to subscribe →</span>
      </div>
    </div>
  )
}

export function VaultsClient() {
  const { vaults, isLoading } = useVaultRegistry()

  const availableVaults = useMemo(() => {
    return vaults.filter((v) => v.isActive !== false).map(toAvailableVault)
  }, [vaults])

  return (
    <div className="vaults-shell" data-theme="dark">
      <header className="vaults-header">
        <div className="vaults-header-left">
          <Link href="/" className="vaults-logo-link">
            <img
              src="/logos/hearst-connect-blackbg.svg"
              alt="Hearst Connect"
              className="vaults-wordmark"
            />
          </Link>
        </div>
        <div className="vaults-header-right">
          <ThemeToggle variant="minimal" size="sm" />
          <HeaderWallet />
        </div>
      </header>

      <main className="vaults-main">
        {/* Left column - Info + Wallet */}
        <div className="vaults-left">
          <div className="vaults-hero">
            <h1 className="vaults-title">Investment Vaults</h1>
            <p className="vaults-subtitle">
              Access institutional-grade yield from industrial Bitcoin mining operations.
              USDC-backed vaults with transparent reporting and audited smart contracts.
            </p>
          </div>

          <ul className="vaults-pillars">
            {PILLARS.map((label) => (
              <li key={label} className="vaults-pillar">
                <span className="vaults-pillar-dot" aria-hidden />
                <span className="vaults-pillar-label">{label}</span>
              </li>
            ))}
          </ul>

          <WalletSection />
        </div>

        {/* Right column - Vault Cards */}
        <div className="vaults-right">
          <div className="vaults-section-header">
            <h2 className="vaults-section-title">
              Available Vaults
              {availableVaults.length > 0 && (
                <span className="vaults-count">{availableVaults.length}</span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="vaults-loading">
              <div className="vaults-spinner" />
              <p>Loading vaults…</p>
            </div>
          ) : availableVaults.length === 0 ? (
            <div className="vaults-empty">
              <p>No vaults available at the moment.</p>
              <p className="vaults-empty-hint">Check back soon or contact us for early access.</p>
            </div>
          ) : (
            <div className="vaults-grid">
              {availableVaults.map((vault, index) => (
                <VaultCard key={vault.id} vault={vault} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="vaults-footer">
        <p>© 2026 Hearst · Audited smart contracts on Base</p>
        <div className="vaults-footer-links">
          <Link href="/">Home</Link>
          <a href="mailto:hello@hearstvault.com">Contact</a>
        </div>
      </footer>
    </div>
  )
}
