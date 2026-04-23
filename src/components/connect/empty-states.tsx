'use client'

import { useConnect } from 'wagmi'
import { TOKENS } from './constants'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${TOKENS.spacing[8]}px`,
        textAlign: 'center',
        background: TOKENS.colors.bgSecondary,
        borderRadius: TOKENS.radius.lg,
        border: `1px dashed ${TOKENS.colors.borderSubtle}`,
        minHeight: '200px',
      }}
    >
      {icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: TOKENS.colors.bgTertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: `${TOKENS.spacing[4]}px`,
            color: TOKENS.colors.textSecondary,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: TOKENS.fontSizes.md,
          fontWeight: TOKENS.fontWeights.bold,
          color: TOKENS.colors.textPrimary,
          margin: `0 0 ${TOKENS.spacing[2]}px 0`,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: TOKENS.fontSizes.sm,
            color: TOKENS.colors.textSecondary,
            margin: `0 0 ${TOKENS.spacing[4]}px 0`,
            maxWidth: '300px',
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[4]}px`,
            background: TOKENS.colors.accent,
            color: TOKENS.colors.black,
            border: 'none',
            borderRadius: TOKENS.radius.md,
            fontSize: TOKENS.fontSizes.sm,
            fontWeight: TOKENS.fontWeights.bold,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function VaultNotConfigured({ onConfigure }: { onConfigure?: () => void }) {
  return (
    <EmptyState
      title="No Vault Configured"
      description="An admin needs to configure a vault before you can view positions or make deposits."
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
      action={
        onConfigure
          ? {
              label: 'Configure Vault',
              onClick: onConfigure,
            }
          : undefined
      }
    />
  )
}

export function WalletNotConnected({ onConnect }: { onConnect?: () => void }) {
  const { connect, connectors, isPending } = useConnect()

  const handleConnect = () => {
    if (onConnect) {
      onConnect()
    } else {
      const connector = connectors[0]
      if (connector) connect({ connector })
    }
  }

  return (
    <EmptyState
      title="Wallet Not Connected"
      description="Connect your wallet to view your vault positions and manage your deposits."
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M16 11.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H12" />
        </svg>
      }
      action={{
        label: isPending ? 'Connecting...' : 'Connect Wallet',
        onClick: handleConnect,
      }}
    />
  )
}

export function NoPosition({ vaultName }: { vaultName?: string }) {
  return (
    <EmptyState
      title="No Active Position"
      description={
        vaultName
          ? `You don't have an active position in ${vaultName} yet. Make a deposit to start earning yield.`
          : "You don't have an active position in this vault yet. Make a deposit to start earning yield."
      }
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      }
    />
  )
}

export function NoVaultsAvailable() {
  return (
    <EmptyState
      title="No Vaults Available"
      description="There are currently no active vaults. Please check back later or contact support."
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      }
    />
  )
}

export function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${TOKENS.spacing[8]}px`,
        minHeight: '200px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${TOKENS.colors.bgTertiary}`,
          borderTopColor: TOKENS.colors.accent,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function OnChainError({
  error,
  onRetry,
}: {
  error: { code: string; message: string }
  onRetry?: () => void
}) {
  const isRpcError = error.code === 'FETCH_ERROR' || error.message.includes('RPC')
  const isVaultError = error.code === 'VAULT_NOT_FOUND'

  const getErrorTitle = () => {
    if (isRpcError) return 'Connection Error'
    if (isVaultError) return 'Vault Configuration Error'
    return 'Error'
  }

  const getErrorDescription = () => {
    if (isRpcError) {
      return 'Unable to connect to the blockchain. Please check your network connection and try again.'
    }
    if (isVaultError) {
      return 'The vault configuration is missing or invalid. Please configure a vault in the admin panel.'
    }
    return error.message
  }

  return (
    <EmptyState
      title={getErrorTitle()}
      description={getErrorDescription()}
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
      action={
        onRetry
          ? {
              label: 'Retry',
              onClick: onRetry,
            }
          : undefined
      }
    />
  )
}
