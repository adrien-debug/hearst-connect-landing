'use client'

import { TOKENS } from './constants'
import { prefersReducedMotion } from '@/lib/reduced-motion'

export function EmptyState({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: TOKENS.spacing[3],
        padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[6]}`,
        textAlign: 'center',
        color: TOKENS.colors.textSecondary,
      }}
    >
      {icon && (
        <div style={{ color: TOKENS.colors.textGhost }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: TOKENS.fontSizes.lg, fontWeight: 600, color: TOKENS.colors.textPrimary }}>
        {title}
      </div>
      <div style={{ fontSize: TOKENS.fontSizes.sm, maxWidth: '280px', lineHeight: 'var(--dashboard-line-height-normal)' }}>
        {description}
      </div>
      {children}
    </div>
  )
}

export function VaultNotConfigured({ onBack }: { onBack?: () => void }) {
  return (
    <EmptyState
      title="Vault not configured"
      description="This vault hasn't been wired up to a chain registry yet. Pick another position from your portfolio."
      icon={
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
    >
      {onBack && <PrimaryEmptyAction label="Back to portfolio" onClick={onBack} />}
    </EmptyState>
  )
}

function PrimaryEmptyAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
        background: TOKENS.colors.accentSubtle,
        color: TOKENS.colors.accent,
        border: `${TOKENS.borders.thin} solid ${TOKENS.colors.accent}`,
        borderRadius: TOKENS.radius.md,
        fontFamily: TOKENS.fonts.mono,
        fontSize: TOKENS.fontSizes.xs,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

export function WalletNotConnected({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      title="Wallet not connected"
      description="Connect your wallet to view your positions and subscribe to vaults."
      icon={
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" />
          <path d="M16 11h0" />
        </svg>
      }
    >
      {onConnect && <PrimaryEmptyAction label="Connect wallet" onClick={onConnect} />}
    </EmptyState>
  )
}

export function LoadingState() {
  // Skip the infinite rotation for users who opted out of motion. The
  // accent-coloured arc still reads as a loading indicator on its own.
  const reduceMotion = prefersReducedMotion()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: TOKENS.spacing[8],
      }}
    >
      <div
        role="status"
        aria-label="Loading"
        style={{
          width: TOKENS.icon.xl,
          height: TOKENS.icon.xl,
          border: `${TOKENS.borders.thick} solid ${TOKENS.colors.borderSubtle}`,
          borderTopColor: TOKENS.colors.accent,
          borderRadius: TOKENS.radius.full,
          animation: reduceMotion
            ? 'none'
            : 'spin var(--dashboard-duration-loader, 1s) linear infinite',
        }}
      />
    </div>
  )
}

export function OnChainError({ error }: { error?: Error }) {
  return (
    <EmptyState
      title="Something went wrong"
      description={error?.message || "We couldn't load the data. Please try again."}
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TOKENS.colors.danger} strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
    />
  )
}
