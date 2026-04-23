'use client'

import { useAccount, useChainId } from 'wagmi'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useVaultGlobal } from '@/hooks/useVault'
import { TOKENS, MONO } from './constants'
import type { AvailableVault } from './data'

type PreFlightStatus = {
  wallet: 'connected' | 'disconnected'
  network: 'valid' | 'invalid' | 'unknown'
  allowance: 'sufficient' | 'insufficient' | 'checking'
  epoch: 'active' | 'ending' | 'unknown'
}

export function usePreFlightCheck(vault: AvailableVault, depositAmount: string): PreFlightStatus {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // USDC contract - would come from env/config
  const USDC_ADDRESS = '0xA0b86a33E6441E6C7D3D4B4f6e8C2d9E4f5A1B2C' as const
  const VAULT_ADDRESS = '0x1234567890123456789012345678901234567890' as const
  
  const { hasAllowance, isLoading: isAllowanceLoading } = useTokenAllowance(
    USDC_ADDRESS,
    address,
    VAULT_ADDRESS
  )
  
  const { global } = useVaultGlobal(VAULT_ADDRESS)
  
  const status: PreFlightStatus = {
    wallet: isConnected ? 'connected' : 'disconnected',
    network: chainId === 1 ? 'valid' : chainId ? 'invalid' : 'unknown',
    allowance: isAllowanceLoading 
      ? 'checking' 
      : hasAllowance(depositAmount) 
        ? 'sufficient' 
        : 'insufficient',
    epoch: global?.shouldAdvanceEpoch 
      ? 'ending' 
      : global?.currentEpoch 
        ? 'active' 
        : 'unknown',
  }
  
  return status
}

export function PreFlightCheck({ 
  vault, 
  depositAmount,
  onApprove,
  isApproving,
}: { 
  vault: AvailableVault
  depositAmount: string
  onApprove: () => void
  isApproving: boolean
}) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined
  const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined
  
  const { hasAllowance, isLoading: isAllowanceLoading } = useTokenAllowance(
    USDC_ADDRESS,
    address,
    VAULT_ADDRESS
  )
  
  const { global } = useVaultGlobal(VAULT_ADDRESS)
  
  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }
  
  const allGood = isConnected && 
    chainId === 1 && 
    hasAllowance(depositAmount) && 
    global?.currentEpoch && 
    !global?.shouldAdvanceEpoch
  
  return (
    <div style={{
      background: TOKENS.colors.bgSecondary,
      border: `1px solid ${TOKENS.colors.borderSubtle}`,
      borderRadius: TOKENS.radius.lg,
      padding: TOKENS.spacing[4],
    }}>
      {/* Header */}
      <div style={{
        fontFamily: MONO,
        fontSize: TOKENS.fontSizes.micro,
        fontWeight: TOKENS.fontWeights.bold,
        letterSpacing: TOKENS.letterSpacing.display,
        textTransform: 'uppercase',
        color: TOKENS.colors.textSecondary,
        marginBottom: TOKENS.spacing[4],
      }}>
        Pre-flight Check
      </div>
      
      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: TOKENS.spacing[3] }}>
        {/* Wallet */}
        <CheckItem 
          status={isConnected ? 'success' : 'error'}
          label="Wallet"
          value={isConnected ? `✓ Connected · ${formatAddress(address)}` : '✗ Connect wallet'}
        />
        
        {/* Network */}
        <CheckItem 
          status={chainId === 1 ? 'success' : chainId ? 'warning' : 'error'}
          label="Network"
          value={chainId === 1 ? '✓ Ethereum Mainnet' : chainId ? '⚠ Switch to Mainnet' : '✗ Unknown network'}
        />
        
        {/* Allowance */}
        {isConnected && (
          <CheckItem 
            status={isAllowanceLoading ? 'pending' : hasAllowance(depositAmount) ? 'success' : 'action'}
            label="Allowance"
            value={isAllowanceLoading 
              ? 'Checking…' 
              : hasAllowance(depositAmount) 
                ? '✓ USDC approved' 
                : 'Approve USDC first'}
            action={!isAllowanceLoading && !hasAllowance(depositAmount) ? {
              label: isApproving ? 'Approving…' : 'Approve',
              onClick: onApprove,
              disabled: isApproving,
            } : undefined}
          />
        )}
        
        {/* Epoch */}
        {global && (
          <CheckItem 
            status={global.shouldAdvanceEpoch ? 'warning' : 'success'}
            label="Epoch"
            statusLabel={global.shouldAdvanceEpoch ? 'ENDING' : 'ACTIVE'}
            value={global.shouldAdvanceEpoch 
              ? `⚠ Epoch ${global.currentEpoch} ending soon` 
              : `✓ Epoch ${global.currentEpoch} active`}
          />
        )}
      </div>
      
      {/* Summary */}
      {allGood && (
        <div style={{
          marginTop: TOKENS.spacing[4],
          paddingTop: TOKENS.spacing[4],
          borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
          fontSize: TOKENS.fontSizes.sm,
          color: TOKENS.colors.accent,
          fontFamily: MONO,
          textAlign: 'center',
        }}>
          ✓ Ready to deploy capital
        </div>
      )}
    </div>
  )
}

function CheckItem({ 
  status, 
  label, 
  statusLabel,
  value, 
  action 
}: { 
  status: 'success' | 'warning' | 'error' | 'pending' | 'action'
  label: string
  statusLabel?: string
  value: string
  action?: { label: string; onClick: () => void; disabled?: boolean }
}) {
  const statusColors = {
    success: TOKENS.colors.accent,
    warning: '#F59E0B',
    error: TOKENS.colors.danger,
    pending: TOKENS.colors.textGhost,
    action: TOKENS.colors.accent,
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: TOKENS.spacing[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: TOKENS.spacing[3] }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColors[status],
        }} />
        <div>
          <div style={{
            fontSize: TOKENS.fontSizes.micro,
            fontFamily: MONO,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            color: TOKENS.colors.textSecondary,
          }}>
            {label}
            {statusLabel && (
              <span style={{ 
                marginLeft: TOKENS.spacing[2],
                color: statusColors[status],
              }}>
                · {statusLabel}
              </span>
            )}
          </div>
          <div style={{
            fontSize: TOKENS.fontSizes.sm,
            color: status === 'error' ? TOKENS.colors.danger : TOKENS.colors.textPrimary,
          }}>
            {value}
          </div>
        </div>
      </div>
      
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: `${TOKENS.spacing[2]}px ${TOKENS.spacing[3]}px`,
            background: TOKENS.colors.accent,
            color: TOKENS.colors.black,
            border: 'none',
            borderRadius: TOKENS.radius.md,
            fontFamily: MONO,
            fontSize: TOKENS.fontSizes.xs,
            fontWeight: TOKENS.fontWeights.bold,
            letterSpacing: TOKENS.letterSpacing.display,
            textTransform: 'uppercase',
            cursor: action.disabled ? 'wait' : 'pointer',
            opacity: action.disabled ? 0.7 : 1,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
