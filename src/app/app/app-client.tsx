'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { useRouter } from 'next/navigation'
import { Canvas } from '@/components/connect/canvas'
import { NavigationProvider } from '@/components/connect/use-connect-routing'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { TOKENS, MONO } from '@/components/connect/constants'

const WALLET_ICONS = [
  { name: 'MetaMask', icon: '/icons/wallets/metamask.svg' },
  { name: 'WalletConnect', icon: '/icons/wallets/walletconnect.svg' },
  { name: 'Coinbase', icon: '/icons/wallets/coinbase.svg' },
  { name: 'Fireblocks', icon: '/icons/wallets/fireblocks.svg' },
  { name: 'Ledger', icon: '/icons/wallets/ledger.svg' },
  { name: 'Safe', icon: '/icons/wallets/safe.svg' },
]

function AccessGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { isConnected } = useAccount()
  const { connect, connectors, isPending, reset } = useConnect()
  const router = useRouter()
  const wasAuthenticated = useRef(false)
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

  if (!mounted || isRedirecting || !sessionChecked) {
    return (
      <div 
        className="connect-scope"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: TOKENS.colors.bgApp,
        }}
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            borderTopColor: TOKENS.colors.accent,
            borderRadius: TOKENS.radius.full,
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  const hasAccess = isConnected && isAuthenticated

  if (!hasAccess) {
    return (
      <div 
        className="connect-scope access-gate-layout"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: TOKENS.colors.bgApp,
          overflow: 'auto',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .access-gate-layout { flex-direction: row !important; overflow: hidden !important; }
            .access-gate-left { width: 50%; border-right: ${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}; border-bottom: none !important; max-height: none !important; }
            .access-gate-right { width: 50%; }
          }
        `}</style>
        {/* LEFT - Marketing */}
        <div 
          className="access-gate-left"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: TOKENS.spacing[8],
            background: TOKENS.colors.black,
            borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            maxHeight: '45vh',
            overflow: 'auto',
          }}
        >
          {/* Logo - Solo */}
          <div style={{ marginBottom: TOKENS.spacing[10] }}>
            <img 
              src="/logos/hearst-connect.svg" 
              alt="Hearst Connect" 
              style={{ width: '72px', height: '72px', filter: 'drop-shadow(0 0 30px rgba(167, 251, 144, 0.15))' }} 
            />
          </div>

          {/* Refined Title */}
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: TOKENS.fontWeights.black,
            lineHeight: 1.08,
            color: TOKENS.colors.textPrimary,
            margin: `0 0 ${TOKENS.spacing[4]} 0`,
            maxWidth: '520px',
            letterSpacing: '-0.03em',
          }}>
            Institutional
            <br />
            <span style={{ color: TOKENS.colors.accent }}>Mining Yield</span>
            <br />
            Vaults
          </h1>

          {/* Subtle Description */}
          <p style={{
            fontSize: TOKENS.fontSizes.md,
            lineHeight: 1.8,
            color: TOKENS.colors.textSecondary,
            margin: `0 0 ${TOKENS.spacing[8]} 0`,
            maxWidth: '380px',
            fontWeight: TOKENS.fontWeights.regular,
          }}>
            Bitcoin mining yields, on-chain. Transparent. Audited. Institutional-grade.
          </p>

          {/* Minimal Features */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: TOKENS.spacing[3], marginBottom: TOKENS.spacing[8] }}>
            {[
              { label: 'Real infrastructure', value: 'Mining operations' },
              { label: 'Monthly distributions', value: 'USDC yield' },
              { label: 'On-chain proof', value: 'Verified reserves' },
            ].map((item) => (
              <div key={item.label} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: TOKENS.spacing[2],
              }}>
                <span style={{ 
                  fontFamily: MONO, 
                  fontSize: TOKENS.fontSizes.xs, 
                  color: TOKENS.colors.accent,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                }}>
                  {item.label}
                </span>
                <span style={{ color: TOKENS.colors.borderSubtle }}>—</span>
                <span style={{ 
                  fontSize: TOKENS.fontSizes.xs, 
                  color: TOKENS.colors.textGhost,
                  fontWeight: TOKENS.fontWeights.medium,
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Minimal Trust Badges */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: TOKENS.spacing[6],
            borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            paddingTop: TOKENS.spacing[6],
            marginTop: TOKENS.spacing[4],
          }}>
            {['Audited', 'Base', 'Institutional'].map((badge) => (
              <span 
                key={badge}
                style={{
                  fontFamily: MONO,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textGhost,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT - Wallet Connect */}
        <div 
          className="access-gate-right"
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: TOKENS.spacing[8],
            background: TOKENS.colors.bgApp,
            overflow: 'auto',
            minHeight: 0,
          }}
        >
          {/* Wallet Connect Box */}
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: TOKENS.colors.bgSurface,
              border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radius.xl,
              padding: `${TOKENS.spacing[10]} ${TOKENS.spacing[8]}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: TOKENS.spacing[8],
              boxShadow: `0 0 60px ${TOKENS.colors.accent}10`,
            }}
          >
            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontSize: TOKENS.fontSizes.xxl,
                fontWeight: TOKENS.fontWeights.black,
                color: TOKENS.colors.textPrimary,
                margin: `0 0 ${TOKENS.spacing[3]} 0`,
                textTransform: 'uppercase',
                letterSpacing: TOKENS.letterSpacing.tight,
              }}>
                Connect Wallet
              </h2>
              <p style={{
                fontSize: TOKENS.fontSizes.md,
                color: TOKENS.colors.textSecondary,
                margin: 0,
                lineHeight: 1.6,
              }}>
                Access your vaults and portfolio
              </p>
            </div>

            {/* Wallet Icons Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: TOKENS.spacing[4],
                width: '100%',
              }}
            >
              {WALLET_ICONS.map((wallet) => (
                <div
                  key={wallet.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: TOKENS.spacing[3],
                    padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[3]}`,
                    borderRadius: TOKENS.radius.lg,
                    background: TOKENS.colors.bgTertiary,
                    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: TOKENS.radius.md,
                      background: TOKENS.colors.bgApp,
                      border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                    }}
                  >
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      style={{
                        width: '28px',
                        height: '28px',
                        objectFit: 'contain',
                      }}
                      onError={(e) => {
                        // Fallback if icon not found
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: TOKENS.fontSizes.xs,
                      fontWeight: TOKENS.fontWeights.bold,
                      letterSpacing: TOKENS.letterSpacing.display,
                      textTransform: 'uppercase',
                      color: TOKENS.colors.textSecondary,
                    }}
                  >
                    {wallet.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Auth error */}
            {authError && (
              <p style={{
                fontSize: TOKENS.fontSizes.sm,
                color: '#f87171',
                margin: 0,
                textAlign: 'center',
              }}>
                {authError}
              </p>
            )}

            {/* Connect / Sign-in Button */}
            {isConnected && !isAuthenticated ? (
              <button
                onClick={() => { retryAuth(); authenticate(); }}
                disabled={authLoading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: TOKENS.spacing[3],
                  padding: `${TOKENS.spacing[5]} ${TOKENS.spacing[6]}`,
                  background: TOKENS.colors.accent,
                  color: TOKENS.colors.black,
                  border: TOKENS.borders.none,
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSizes.lg,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: authLoading ? 'wait' : 'pointer',
                  opacity: authLoading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 24px ${TOKENS.colors.accent}40`,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {authLoading ? 'Signing…' : hasRejected ? 'Retry Sign In' : 'Sign In with Wallet'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isPending}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: TOKENS.spacing[3],
                  padding: `${TOKENS.spacing[5]} ${TOKENS.spacing[6]}`,
                  background: TOKENS.colors.accent,
                  color: TOKENS.colors.black,
                  border: TOKENS.borders.none,
                  borderRadius: TOKENS.radius.md,
                  fontSize: TOKENS.fontSizes.lg,
                  fontWeight: TOKENS.fontWeights.black,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 24px ${TOKENS.colors.accent}40`,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  <path d="M16 11h0" />
                </svg>
                {isPending ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}

            {/* Security Note */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.accent} strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <p style={{
                fontSize: TOKENS.fontSizes.xs,
                color: TOKENS.colors.textGhost,
                margin: 0,
                textAlign: 'center',
              }}>
                Secure connection. We never store your keys.
              </p>
            </div>
          </div>
        </div>
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
