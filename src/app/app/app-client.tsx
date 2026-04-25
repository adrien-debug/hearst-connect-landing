'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useAccount, useConnect } from 'wagmi'
import { Canvas } from '@/components/connect/canvas'
import { NavigationProvider } from '@/components/connect/use-connect-routing'
import { useAppMode } from '@/hooks/useAppMode'
import { toAvailableVault } from '@/lib/default-vaults'
import { TOKENS, fmtUsdCompact, MONO } from '@/components/connect/constants'
import { useVaultRegistry } from '@/hooks/useVaultRegistry'

const VAULT_ACCENT_COLORS = [
  TOKENS.colors.accent,
  TOKENS.colors.gray500,
  TOKENS.colors.textSecondary,
]

function AccessGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isConnected } = useAccount()
  const { isDemo } = useAppMode()
  const { connect, connectors, isPending, reset } = useConnect()
  const { activeVaults } = useVaultRegistry()
  const availableVaults = useMemo(() => activeVaults.map(toAvailableVault), [activeVaults])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = useCallback(() => {
    const connector = connectors[0]
    if (connector) {
      reset()
      connect({ connector })
    }
  }, [connectors, connect, reset])

  if (!mounted) {
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

  const hasAccess = isDemo || isConnected

  if (!hasAccess) {
    return (
      <div 
        className="connect-scope"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          background: TOKENS.colors.bgApp,
        }}
      >
        {/* LEFT - 1/3 Marketing */}
        <div 
          style={{
            width: '33.333%',
            minWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: TOKENS.spacing[8],
            borderRight: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            background: TOKENS.colors.black,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], marginBottom: TOKENS.spacing[8] }}>
            <img src="/logos/hearst.svg" alt="Hearst" style={{ width: '40px', height: '40px' }} />
            <span style={{ fontSize: TOKENS.fontSizes.lg, fontWeight: TOKENS.fontWeights.black, color: TOKENS.colors.textPrimary }}>
              Hearst
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: TOKENS.fontSizes.xxxl,
            fontWeight: TOKENS.fontWeights.black,
            lineHeight: 1.1,
            color: TOKENS.colors.textPrimary,
            margin: `0 0 ${TOKENS.spacing[4]} 0`,
          }}>
            Institutional
            <br />
            <span style={{ color: TOKENS.colors.accent }}>Mining Yield</span>
            <br />
            Vaults
          </h1>

          {/* Description */}
          <p style={{
            fontSize: TOKENS.fontSizes.md,
            lineHeight: 1.6,
            color: TOKENS.colors.textSecondary,
            margin: `0 0 ${TOKENS.spacing[8]} 0`,
            maxWidth: '320px',
          }}>
            Access industrial-grade Bitcoin mining yields through transparent, audited on-chain vaults.
          </p>

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: `0 0 ${TOKENS.spacing[8]} 0`, display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
            {[
              'Real mining infrastructure',
              'Monthly distributions',
              'On-chain proof of reserves',
              'Audited smart contracts',
            ].map((feature) => (
              <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3], fontSize: TOKENS.fontSizes.sm, color: TOKENS.colors.textSecondary }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.accent} strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: TOKENS.spacing[3] }}>
            {['Audited', 'On-Chain', 'Base'].map((badge) => (
              <span 
                key={badge}
                style={{
                  fontFamily: MONO,
                  fontSize: TOKENS.fontSizes.micro,
                  fontWeight: TOKENS.fontWeights.bold,
                  letterSpacing: TOKENS.letterSpacing.display,
                  textTransform: 'uppercase',
                  color: TOKENS.colors.textGhost,
                  padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.sm,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT - 2/3 Vaults */}
        <div 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: TOKENS.spacing[8],
            background: TOKENS.colors.bgApp,
            overflow: 'auto',
          }}
        >
          {/* Header with Connect */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: TOKENS.spacing[6],
            paddingBottom: TOKENS.spacing[6],
            borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
          }}>
            <span style={{
              fontFamily: MONO,
              fontSize: TOKENS.fontSizes.micro,
              fontWeight: TOKENS.fontWeights.bold,
              letterSpacing: TOKENS.letterSpacing.display,
              textTransform: 'uppercase',
              color: TOKENS.colors.textSecondary,
            }}>
              Available Vaults ({availableVaults.length})
            </span>
            <button
              onClick={handleConnect}
              disabled={isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: TOKENS.spacing[2],
                padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
                background: TOKENS.colors.accent,
                color: TOKENS.colors.black,
                border: TOKENS.borders.none,
                borderRadius: TOKENS.radius.md,
                fontSize: TOKENS.fontSizes.sm,
                fontWeight: TOKENS.fontWeights.bold,
                letterSpacing: TOKENS.letterSpacing.display,
                textTransform: 'uppercase',
                cursor: isPending ? 'wait' : 'pointer',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 11h0" />
              </svg>
              {isPending ? 'Connecting…' : 'Connect Wallet'}
            </button>
          </div>

          {/* Vault Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[4] }}>
            {availableVaults.length === 0 ? (
              <div
                style={{
                  background: TOKENS.colors.bgSurface,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.lg,
                  padding: TOKENS.spacing[6],
                  textAlign: 'center',
                  color: TOKENS.colors.textSecondary,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: TOKENS.fontSizes.micro,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    color: TOKENS.colors.textGhost,
                    marginBottom: TOKENS.spacing[3],
                  }}
                >
                  No vaults configured
                </div>
                <p style={{ margin: 0, fontSize: TOKENS.fontSizes.sm, lineHeight: 1.6 }}>
                  Create vaults in the admin console to make them available in the app.
                </p>
              </div>
            ) : availableVaults.map((vault, index) => (
              <div 
                key={vault.id}
                style={{
                  background: TOKENS.colors.bgSurface,
                  border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radius.lg,
                  overflow: 'hidden',
                }}
              >
                {/* Card Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${TOKENS.spacing[4]} ${TOKENS.spacing[5]}`,
                  background: TOKENS.colors.bgSecondary,
                  borderBottom: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: TOKENS.spacing[3],
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: VAULT_ACCENT_COLORS[index % VAULT_ACCENT_COLORS.length],
                      borderRadius: TOKENS.radius.md,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: TOKENS.fontSizes.lg,
                      fontWeight: TOKENS.fontWeights.black,
                      color: TOKENS.colors.black,
                    }}>
                      {vault.name.charAt(7)}
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: TOKENS.fontSizes.lg,
                        fontWeight: TOKENS.fontWeights.black,
                        color: TOKENS.colors.textPrimary,
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: TOKENS.letterSpacing.tight,
                      }}>
                        {vault.name}
                      </h3>
                      <p style={{
                        fontSize: TOKENS.fontSizes.xs,
                        color: TOKENS.colors.textSecondary,
                        margin: 0,
                      }}>
                        {vault.strategy}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: TOKENS.fontSizes.micro,
                    fontWeight: TOKENS.fontWeights.bold,
                    letterSpacing: TOKENS.letterSpacing.display,
                    textTransform: 'uppercase',
                    color: TOKENS.colors.textGhost,
                    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
                    border: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radius.full,
                  }}>
                    {vault.risk} Risk
                  </span>
                </div>

                {/* Card Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: TOKENS.spacing[4],
                  padding: TOKENS.spacing[5],
                }}>
                  {[
                    { label: 'APR', value: `${vault.apr}%`, accent: true },
                    { label: 'Target', value: vault.target },
                    { label: 'Min', value: fmtUsdCompact(vault.minDeposit) },
                      { label: 'Lock', value: vault.term },
                  ].map((stat) => (
                    <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[2] }}>
                      <span style={{
                        fontFamily: MONO,
                        fontSize: TOKENS.fontSizes.micro,
                        fontWeight: TOKENS.fontWeights.bold,
                        letterSpacing: TOKENS.letterSpacing.display,
                        textTransform: 'uppercase',
                        color: TOKENS.colors.textGhost,
                      }}>
                        {stat.label}
                      </span>
                      <span style={{
                        fontSize: TOKENS.fontSizes.md,
                        fontWeight: TOKENS.fontWeights.black,
                        color: stat.accent ? TOKENS.colors.accent : TOKENS.colors.textPrimary,
                        letterSpacing: TOKENS.letterSpacing.tight,
                      }}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[5]}`,
                  borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
                  background: TOKENS.colors.bgTertiary,
                }}>
                  <span style={{
                    fontFamily: MONO,
                    fontSize: TOKENS.fontSizes.xs,
                    color: TOKENS.colors.textGhost,
                  }}>
                    {vault.fees}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div style={{
            marginTop: 'auto',
            paddingTop: TOKENS.spacing[6],
            borderTop: `${TOKENS.borders.thin} solid ${TOKENS.colors.borderSubtle}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: TOKENS.fontSizes.sm,
              color: TOKENS.colors.textSecondary,
              margin: 0,
            }}>
              Connect your wallet to view detailed metrics and subscribe to vaults.
            </p>
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
