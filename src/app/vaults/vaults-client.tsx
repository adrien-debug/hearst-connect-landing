'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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

function useWalletConnect() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending, reset } = useConnect()

  const triggerConnect = useCallback(() => {
    const connector = connectors[0]
    if (connector) {
      reset()
      connect({ connector })
    }
  }, [connectors, connect, reset])

  const wrongChain = isConnected && chainId !== base.id

  return { address, isConnected, isPending, wrongChain, triggerConnect }
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
      <span className="vaults-header-address">{formatShortAddress(address ?? '0x')}</span>
      <Link href="/app" className="vaults-header-btn vaults-header-btn--primary">
        Enter Platform
      </Link>
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

function VaultCard({ vault, onClick }: { vault: AvailableVault; onClick: () => void }) {
  return (
    <button type="button" className="vaults-card" onClick={onClick}>
      <div className="vaults-card-header">
        <div className="vaults-card-title-group">
          {vault.image && (
            <img
              src={vault.image}
              alt={vault.name}
              className="vaults-card-image"
              width="44"
              height="44"
            />
          )}
          <div>
            <h3 className="vaults-card-name">{formatVaultName(vault.name)}</h3>
            <p className="vaults-card-strategy">{vault.strategy}</p>
          </div>
        </div>
        <div className="vaults-card-apr">
          {vault.apr}%
          <span className="vaults-card-apr-label">APR</span>
        </div>
      </div>

      <div className="vaults-card-meta">
        <span className="vaults-card-meta-item">{vault.lockPeriod}</span>
        <span className="vaults-card-meta-sep" aria-hidden>·</span>
        <span className="vaults-card-meta-item">Min {fmtUsdCompact(vault.minDeposit)}</span>
        <span className="vaults-card-meta-sep" aria-hidden>·</span>
        <span className="vaults-card-meta-item">{vault.risk} risk</span>
      </div>

      <div className="vaults-card-footer">
        <span className="vaults-card-fees">{vault.fees}</span>
        <span className="vaults-card-view">View details →</span>
      </div>
    </button>
  )
}

function VaultModal({
  vault,
  onClose,
}: {
  vault: AvailableVault
  onClose: () => void
}) {
  const { isConnected, isPending, wrongChain, triggerConnect } = useWalletConnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const targetPct = parseFloat(vault.target.replace('%', '')) || 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="vault-modal-overlay" onClick={onClose}>
      <div className="vault-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vault-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="vault-modal-header">
          {vault.image && (
            <img src={vault.image} alt={vault.name} className="vault-modal-image" width="52" height="52" />
          )}
          <div>
            <h2 className="vault-modal-name">{formatVaultName(vault.name)}</h2>
            <p className="vault-modal-strategy">{vault.strategy}</p>
          </div>
          <div className="vault-modal-apr">
            {vault.apr}%
            <span className="vault-modal-apr-label">APR</span>
          </div>
        </div>

        <div className="vault-modal-stats">
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Target Return</span>
            <span className="vault-modal-stat-value">{vault.target}</span>
          </div>
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Lock Period</span>
            <span className="vault-modal-stat-value">{vault.lockPeriod}</span>
          </div>
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Min Deposit</span>
            <span className="vault-modal-stat-value">{fmtUsdCompact(vault.minDeposit)}</span>
          </div>
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Risk Level</span>
            <span className="vault-modal-stat-value">{vault.risk}</span>
          </div>
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Fees</span>
            <span className="vault-modal-stat-value">{vault.fees}</span>
          </div>
          <div className="vault-modal-stat">
            <span className="vault-modal-stat-label">Potential Return</span>
            <span className="vault-modal-stat-value">~{targetPct}% cumulative</span>
          </div>
        </div>

        <div className="vault-modal-actions">
          {!isConnected ? (
            <button
              type="button"
              className="vault-modal-cta"
              disabled={isPending}
              onClick={triggerConnect}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 11h0" />
              </svg>
              {isPending ? 'Connecting…' : 'Connect Wallet to Subscribe'}
            </button>
          ) : wrongChain ? (
            <button
              type="button"
              className="vault-modal-cta vault-modal-cta--warning"
              disabled={isSwitching}
              onClick={() => switchChain({ chainId: base.id })}
            >
              {isSwitching ? 'Switching…' : 'Switch to Base Network'}
            </button>
          ) : (
            <Link href="/app" className="vault-modal-cta" onClick={onClose}>
              Enter Platform →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function VaultsClient() {
  const { activeVaults, isLoading } = useVaultRegistry()
  const [selectedVault, setSelectedVault] = useState<AvailableVault | null>(null)

  const availableVaults = activeVaults.map(toAvailableVault)

  return (
    <div className="vaults-shell">
      <header className="vaults-header">
        <div className="vaults-header-left">
          <Link href="/" className="vaults-logo-link">
            <img
              src="/logos/hearst-logo.svg"
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
        </div>

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
              {availableVaults.map((vault) => (
                <VaultCard key={vault.id} vault={vault} onClick={() => setSelectedVault(vault)} />
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

      {selectedVault && (
        <VaultModal vault={selectedVault} onClose={() => setSelectedVault(null)} />
      )}
    </div>
  )
}
