'use client'

import Link from 'next/link'
import { useMemo, useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import { useVaultLines } from '@/hooks/useVaultLines'
import { fmtUsdCompact } from '@/components/connect/constants'
import { formatVaultName } from '@/components/connect/formatting'
import type { AvailableVault, VaultLine } from '@/components/connect/data'

const PILLARS = [
  'Industrial mining yield',
  'Monthly USDC distributions',
  'Institutional controls',
  'On-chain proof of reserves',
  'Audited smart contracts',
] as const

/** Prefer subscribe-able vaults; fallback to full list (e.g. all positions active in demo). */
function rowsForIntro(vaults: VaultLine[]): VaultLine[] {
  const available = vaults.filter((v): v is AvailableVault => v.type === 'available')
  return available.length > 0 ? available : vaults
}

function vaultSubtitle(line: VaultLine): string {
  if (line.type === 'available') {
    return `${line.apr}% APR · Target ${line.target} · Min ${fmtUsdCompact(line.minDeposit)} · ${line.lockPeriod}`
  }
  if (line.type === 'active') {
    return `${line.apr}% APR · Active position · +${fmtUsdCompact(line.claimable)} claimable`
  }
  return `${line.apr}% APR · ${line.maturity}`
}

function formatShortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

function IntroHeaderWallet() {
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
      <div className="intro-header-wallet" aria-busy="true">
        <button className="intro-btn-wallet intro-btn-wallet--primary" disabled>
          Connect Wallet
        </button>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="intro-header-wallet">
        <button
          type="button"
          className="intro-btn-wallet intro-btn-wallet--primary"
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
          {isPending ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {error ? (
          <p className="intro-connect-error" role="alert">
            {error.message.length > 120 ? `${error.message.slice(0, 120)}…` : error.message}
          </p>
        ) : null}
      </div>
    )
  }

  if (wrongChain) {
    return (
      <div className="intro-header-wallet">
        <button
          type="button"
          className="intro-btn-wallet intro-btn-wallet--accent-outline"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: base.id })}
        >
          Switch to Base
        </button>
      </div>
    )
  }

  return (
    <div className="intro-header-wallet">
      <span className="intro-wallet-address">{formatShortAddress(address)}</span>
      <Link href="/app" className="intro-btn-wallet intro-btn-wallet--primary">
        Enter Platform
      </Link>
      <button
        type="button"
        className="intro-btn-wallet intro-btn-wallet--ghost"
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

export function IntroClient() {
  const { vaults, hasVaults, isLoading } = useVaultLines()
  const displayRows = useMemo(() => rowsForIntro(vaults), [vaults])

  return (
    <div className="intro-shell" data-theme="dark">
      <header className="intro-header">
        <div className="intro-header-left">
          <Link href="/" className="intro-back">
            ← Back to Home
          </Link>
          <nav className="intro-nav">
            <Link href="/vaults" className="intro-nav-link">Vaults</Link>
          </nav>
        </div>
        <IntroHeaderWallet />
      </header>

      <main className="intro-main">
        <div className="intro-left">
          <img
            src="/logos/hearst-connect-blackbg.svg"
            alt="Hearst Connect"
            className="intro-wordmark"
          />

          <ul className="intro-pillars">
            {PILLARS.map((label) => (
              <li key={label} className="intro-pillar">
                <span className="intro-pillar-dot" aria-hidden />
                <strong className="intro-pillar-label">{label}</strong>
              </li>
            ))}
          </ul>

          <section className="intro-programs" aria-labelledby="intro-programs-heading">
            <h2 id="intro-programs-heading" className="intro-programs-title">
              Programmes
            </h2>
            {isLoading ? (
              <p className="intro-programs-empty">Chargement des vaults…</p>
            ) : !hasVaults || displayRows.length === 0 ? (
              <p className="intro-programs-empty">
                Aucun vault n’est enregistré pour l’instant. Connectez un wallet puis ouvrez la plateforme, ou
                demandez à un admin d’ajouter des vaults (mode live).
              </p>
            ) : (
              <ul className="intro-programs-list">
                {displayRows.map((line) => (
                  <li key={line.id} className="intro-program-row">
                    <span className="intro-program-name">{formatVaultName(line.name)}</span>
                    <span className="intro-program-meta">{vaultSubtitle(line)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="intro-cta-group">
            <Link href="/vaults" className="intro-cta-primary">
              <span>Invest in Vaults</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="intro-cta-hint">
              Connect your wallet above to access vaults on Base, or browse available strategies.
            </p>
          </div>
        </div>

        <div className="intro-right">
          <div className="intro-video-card">
            <video className="intro-video" src="/intro-bg.mp4" autoPlay loop muted playsInline />
            <div className="intro-video-vignette" aria-hidden />
          </div>
        </div>
      </main>

      <footer className="intro-footer">
        <p>© 2026 Hearst · Audited smart contracts on Base</p>
      </footer>
    </div>
  )
}
