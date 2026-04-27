'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Canvas } from '@/components/connect/canvas'
import { NavigationProvider } from '@/components/connect/use-connect-routing'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { useDemoMode, isDemoModeSync } from '@/lib/demo/use-demo-mode'

const WALLET_ICONS = [
  { name: 'MetaMask', icon: '/icons/wallets/metamask.svg' },
  { name: 'WalletConnect', icon: '/icons/wallets/walletconnect.svg' },
  { name: 'Coinbase', icon: '/icons/wallets/coinbase.svg' },
  { name: 'Fireblocks', icon: '/icons/wallets/fireblocks.svg' },
  { name: 'Ledger', icon: '/icons/wallets/ledger.svg' },
  { name: 'Safe', icon: '/icons/wallets/safe.svg' },
] as const

const FEATURES = [
  { label: 'Real infrastructure', value: 'Mining operations' },
  { label: 'Monthly distributions', value: 'USDC yield' },
  { label: 'On-chain proof', value: 'Verified reserves' },
] as const

const TRUST_BADGES = ['Audited', 'Base', 'Institutional'] as const

const ACCESS_GATE_CSS = `
.access-gate {
  /* Local layout tokens — values used only here. */
  --gate-bp: 900px;
  --gate-card-max: 24rem;
  --gate-title-measure: 16ch;
  --gate-lede-measure: 42ch;
  --gate-trust-measure: 36ch;
  --gate-spinner-duration: 1s;

  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  background: var(--hc-bg-app);
  overflow: auto;
}

.access-gate__pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  min-height: 0;
  min-width: 0;
}

.access-gate__pane--marketing {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(
      ellipse 55% 60% at 50% 50%,
      var(--hc-bg-app) 0%,
      transparent 60%,
      var(--hc-bg-app) 100%
    ),
    url('/backgrounds/pattern-sidebar.svg') center / cover no-repeat,
    var(--hc-bg-app);
  text-align: center;
  border-bottom: 1px solid var(--hc-border-subtle);
  gap: var(--space-10);
}

.access-gate__pane--connect {
  background: var(--hc-bg-app);
}

@media (min-width: 900px) {
  .access-gate {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    overflow: hidden;
  }
  .access-gate__pane--marketing {
    border-bottom: 0;
    border-right: 1px solid var(--hc-border-subtle);
  }
  .access-gate__pane {
    padding: var(--space-10) var(--space-8);
  }
}

.access-gate__brand {
  display: flex;
  align-items: center;
  justify-content: center;
}
.access-gate__brand-logo {
  width: var(--space-16);
  height: var(--space-16);
  filter: drop-shadow(0 0 var(--space-8) var(--hc-accent-glow));
}

.access-gate__title {
  font-size: var(--dashboard-text-display);
  font-weight: var(--weight-black);
  line-height: var(--leading-tight);
  color: var(--hc-text-primary);
  margin: 0;
  max-width: var(--gate-title-measure);
  letter-spacing: var(--tracking-tight);
  text-wrap: balance;
}
.access-gate__title-accent {
  color: var(--hc-accent);
}

.access-gate__lede {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--hc-text-secondary);
  margin: 0;
  max-width: var(--gate-lede-measure);
  font-weight: var(--weight-medium);
  text-wrap: balance;
}

.access-gate__features-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  width: 100%;
}
.access-gate__features-title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  color: var(--hc-text-ghost);
  margin: 0;
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
}
.access-gate__features-title::before,
.access-gate__features-title::after {
  content: '';
  width: var(--space-8);
  height: 1px;
  background: var(--hc-border-subtle);
}
.access-gate__features {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
  column-gap: var(--space-4);
  row-gap: var(--space-4);
  list-style: none;
  padding: 0;
  margin: 0;
}
.access-gate__feature {
  display: contents;
}
.access-gate__feature-label {
  font-family: var(--font-mono);
  color: var(--hc-accent);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  font-size: var(--text-sm);
  text-align: right;
  white-space: nowrap;
}
.access-gate__feature-sep {
  color: var(--hc-border-subtle);
  text-align: center;
}
.access-gate__feature-value {
  color: var(--hc-text-secondary);
  font-weight: var(--weight-medium);
  font-size: var(--text-md);
  text-align: left;
  white-space: nowrap;
}

.access-gate__trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  border-top: 1px solid var(--hc-border-subtle);
  padding-top: var(--space-6);
  width: 100%;
  max-width: var(--gate-trust-measure);
  list-style: none;
  margin: 0;
}
.access-gate__trust-item {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  color: var(--hc-text-ghost);
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}
.access-gate__trust-item:not(:last-child)::after {
  content: '';
  width: var(--space-1);
  height: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--hc-accent);
  display: inline-block;
}

.access-gate__card {
  width: 100%;
  max-width: var(--gate-card-max);
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  box-shadow: none;
}

.access-gate__card-head {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.access-gate__card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-black);
  color: var(--hc-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-tight);
}
.access-gate__card-sub {
  font-size: var(--text-sm);
  color: var(--hc-text-ghost);
  margin: 0;
  line-height: var(--leading-relaxed);
}

.access-gate__wallets {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5) var(--space-3);
  width: 100%;
}

.access-gate__wallet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-3);
  padding: var(--space-2);
  background: transparent;
  border: 0;
  transition: var(--transition-base);
  cursor: pointer;
}
.access-gate__wallet:hover .access-gate__wallet-img {
  transform: scale(1.08);
}
.access-gate__wallet:hover .access-gate__wallet-name {
  color: var(--hc-accent);
}
.access-gate__wallet-img {
  width: var(--dashboard-control-height-md);
  height: var(--dashboard-control-height-md);
  object-fit: contain;
  transition: var(--transition-base);
}
.access-gate__wallet-name {
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  color: var(--hc-text-ghost);
  transition: var(--transition-base);
}

.access-gate__error {
  font-size: var(--text-sm);
  color: var(--dashboard-error);
  margin: 0;
  text-align: center;
}

.access-gate__cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--dashboard-control-height-lg);
  padding: 0 var(--space-5);
  background: var(--hc-accent);
  color: var(--hc-bg-app);
  border: 0;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-black);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--transition-base);
}
.access-gate__cta:hover:not(:disabled) {
  filter: brightness(1.08);
}
.access-gate__cta:disabled {
  cursor: wait;
  opacity: var(--opacity-strong);
}
.access-gate__cta svg {
  width: var(--dashboard-icon-size-sm);
  height: var(--dashboard-icon-size-sm);
}

.access-gate__note {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--hc-text-ghost);
  text-align: center;
  margin: 0;
}
.access-gate__note svg {
  width: var(--dashboard-icon-size-sm);
  height: var(--dashboard-icon-size-sm);
  color: var(--hc-accent);
  flex-shrink: 0;
}

.access-gate__loader {
  --gate-spinner-duration: 1s;
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hc-bg-app);
}
.access-gate__loader-spinner {
  width: var(--space-10);
  height: var(--space-10);
  border: 1px solid var(--hc-border-subtle);
  border-top-color: var(--hc-accent);
  border-radius: var(--radius-full);
  animation: access-gate-spin var(--gate-spinner-duration) linear infinite;
}
@keyframes access-gate-spin {
  to { transform: rotate(360deg); }
}
`

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path d="M16 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
    </svg>
  )
}

function AccessGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { isConnected } = useAccount()
  const { connect, connectors, isPending, reset } = useConnect()
  const router = useRouter()
  const wasAuthenticated = useRef(false)
  const isDemo = useDemoMode()
  const {
    isAuthenticated,
    isLoading: authLoading,
    sessionChecked,
    error: authError,
    hasRejected,
    retry: retryAuth,
    authenticate,
  } = useSiweAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true
    }
    if (wasAuthenticated.current && !isAuthenticated && !authLoading && mounted) {
      wasAuthenticated.current = false
      router.push('/')
      setIsRedirecting(true)
    }
  }, [isAuthenticated, authLoading, mounted, router])

  const handleConnect = useCallback(() => {
    const connector = connectors[0]
    if (connector) {
      reset()
      connect({ connector })
    }
  }, [connectors, connect, reset])

  // Demo mode bypass — no wallet, no signature, straight to the canvas.
  if (isDemo) {
    return <>{children}</>
  }

  // Hold the loader during the first paint if ?demo=true is in the URL but
  // useDemoMode hasn't synced yet — prevents the AccessGate from flashing.
  const demoPending = mounted && !isDemo && isDemoModeSync()

  if (!mounted || isRedirecting || !sessionChecked || demoPending) {
    return (
      <div className="connect-scope access-gate__loader">
        <style>{ACCESS_GATE_CSS}</style>
        <div className="access-gate__loader-spinner" />
      </div>
    )
  }

  const hasAccess = isConnected && isAuthenticated

  if (!hasAccess) {
    const showSignIn = isConnected && !isAuthenticated
    const ctaLabel = showSignIn
      ? authLoading
        ? 'Signing…'
        : hasRejected
          ? 'Retry Sign In'
          : 'Sign In with Wallet'
      : isPending
        ? 'Connecting…'
        : 'Connect Wallet'
    const ctaDisabled = showSignIn ? authLoading : isPending
    const ctaOnClick = showSignIn
      ? () => {
          retryAuth()
          authenticate()
        }
      : handleConnect

    return (
      <div className="connect-scope access-gate">
        <style>{ACCESS_GATE_CSS}</style>

        <section className="access-gate__pane access-gate__pane--marketing" aria-label="Hearst Connect">
          <div className="access-gate__brand">
            <img
              src="/logos/hearst-connect.svg"
              alt="Hearst Connect"
              className="access-gate__brand-logo"
            />
          </div>

          <h1 className="access-gate__title">
            Institutional
            <br />
            <span className="access-gate__title-accent">Mining Yield</span>
            <br />
            Vaults
          </h1>

          <h2 className="access-gate__lede">
            Bitcoin mining yields, on-chain. Transparent. Audited. Institutional-grade.
          </h2>

          <div className="access-gate__features-section">
            <h3 className="access-gate__features-title">Why Hearst</h3>
            <ul className="access-gate__features">
              {FEATURES.map(({ label, value }) => (
                <li key={label} className="access-gate__feature">
                  <span className="access-gate__feature-label">{label}</span>
                  <span className="access-gate__feature-sep" aria-hidden>—</span>
                  <span className="access-gate__feature-value">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="access-gate__trust">
            {TRUST_BADGES.map((badge) => (
              <li key={badge} className="access-gate__trust-item">
                {badge}
              </li>
            ))}
          </ul>
        </section>

        <section className="access-gate__pane access-gate__pane--connect" aria-label="Connect wallet">
          <div className="access-gate__card">
            <header className="access-gate__card-head">
              <h2 className="access-gate__card-title">Connect Wallet</h2>
              <p className="access-gate__card-sub">Access your vaults and portfolio</p>
            </header>

            <div className="access-gate__wallets">
              {WALLET_ICONS.map((wallet) => (
                <div key={wallet.name} className="access-gate__wallet">
                  <img
                    src={wallet.icon}
                    alt=""
                    className="access-gate__wallet-img"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="access-gate__wallet-name">{wallet.name}</span>
                </div>
              ))}
            </div>

            {authError && (
              <p className="access-gate__error" role="alert">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={ctaOnClick}
              disabled={ctaDisabled}
              className="access-gate__cta"
            >
              {showSignIn ? <ShieldIcon /> : <WalletIcon />}
              {ctaLabel}
            </button>

            <p className="access-gate__note">
              <ShieldIcon />
              Secure connection. We never store your keys.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return <>{children}</>
}

export function AppClient() {
  return (
    <NavigationProvider>
      <AccessGate>
        <Canvas />
      </AccessGate>
    </NavigationProvider>
  )
}
