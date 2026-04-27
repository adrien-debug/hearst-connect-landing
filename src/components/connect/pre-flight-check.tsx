'use client'

import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { useTokenAllowance } from '@/hooks/useTokenAllowance'
import { useVaultGlobal } from '@/hooks/useVault'
import { useVaultById } from '@/hooks/useVaultRegistry'
import { TOKENS, MONO } from './constants'
import type { AvailableVault } from './data'

export function PreFlightCheck({
  vault,
  depositAmount,
  onApprove,
  isApproving,
  onReadyChange,
}: {
  vault: AvailableVault
  depositAmount: string
  onApprove: () => void
  isApproving: boolean
  onReadyChange?: (ready: boolean) => void
}) {
  const { address, isConnected, chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const isOnBase = chain?.id === 8453
  const isTestVault = vault.isTest ?? false

  // Get vault addresses from registry
  const vaultConfig = useVaultById(vault.id)
  const usdcAddress = vaultConfig?.usdcAddress
  const vaultAddress = vaultConfig?.vaultAddress

  const {
    allowance,
    hasAllowance,
    isLoading: isAllowanceLoading,
    isAllowanceError,
    refetchAllowance,
  } = useTokenAllowance(usdcAddress, address, vaultAddress)

  const { global, isLoading: isGlobalLoading, isError: isGlobalError, refetch: refetchVaultGlobal } =
    useVaultGlobal(vaultAddress)
  
  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }
  
  const epochOk =
    global != null &&
    typeof global.currentEpoch === 'number' &&
    global.currentEpoch >= 0 &&
    !global.shouldAdvanceEpoch

  const allGood = isTestVault
    ? isConnected
    : isConnected &&
      isOnBase &&
      hasAllowance(depositAmount) &&
      epochOk

  useEffect(() => {
    onReadyChange?.(!!allGood)
  }, [allGood, onReadyChange])
  
  return (
    <div style={{
      paddingTop: TOKENS.spacing[3],
      borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
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
        
        {isTestVault ? (
          <CheckItem
            status="success"
            label="Mode"
            statusLabel="SIMULATED"
            value="✓ Test vault — no on-chain transaction required"
          />
        ) : (
        <>
        {/* Network */}
        <CheckItem 
          status={isOnBase ? 'success' : chain ? 'warning' : 'error'}
          label="Network"
          value={isOnBase ? `✓ Base` : chain ? `⚠ Switch to Base (on ${chain.name})` : '✗ Unknown network'}
          action={!isOnBase && isConnected ? {
            label: isSwitching ? 'Switching…' : 'Switch',
            onClick: () => switchChain({ chainId: 8453 }),
            disabled: isSwitching,
          } : undefined}
        />
        
        {/* Allowance */}
        {isConnected && (
          <CheckItem 
            status={
              isAllowanceError
                ? 'error'
                : isAllowanceLoading && allowance === undefined
                  ? 'pending'
                  : hasAllowance(depositAmount)
                    ? 'success'
                    : 'action'
            }
            label="Allowance"
            value={
              isAllowanceError
                ? '✗ Could not read USDC allowance (RPC/network)'
                : isAllowanceLoading && allowance === undefined
                  ? 'Checking…'
                  : hasAllowance(depositAmount)
                    ? '✓ USDC approved'
                    : 'Approve USDC first'}
            action={
              isAllowanceError
                ? {
                    label: 'Retry',
                    onClick: () => void refetchAllowance(),
                    disabled: isAllowanceLoading,
                  }
                : !isAllowanceLoading && allowance !== undefined && !hasAllowance(depositAmount)
                  ? {
                      label: isApproving ? 'Approving…' : 'Approve',
                      onClick: onApprove,
                      disabled: isApproving,
                    }
                  : undefined
            }
          />
        )}
        
        {/* Epoch — on-chain reads */}
        {vaultAddress && isConnected && (
          <CheckItem
            status={
              isGlobalLoading
                ? 'pending'
                : isGlobalError
                  ? 'error'
                  : global?.shouldAdvanceEpoch
                    ? 'warning'
                    : global
                      ? 'success'
                      : 'error'
            }
            label="Epoch"
            statusLabel={
              isGlobalLoading ? 'SYNC' : isGlobalError ? 'ERROR' : global?.shouldAdvanceEpoch ? 'ENDING' : global ? 'ACTIVE' : '—'
            }
            value={
              isGlobalLoading
                ? 'Reading vault epoch…'
                : isGlobalError
                  ? '✗ Could not read vault (wrong network, ABI, or RPC)'
                  : global
                    ? global.shouldAdvanceEpoch
                      ? `⚠ Epoch ${global.currentEpoch} ending soon`
                      : `✓ Epoch ${global.currentEpoch} active`
                    : '✗ Vault state incomplete'
            }
            action={
              isGlobalError
                ? {
                    label: 'Retry',
                    onClick: () => void refetchVaultGlobal(),
                    disabled: isGlobalLoading,
                  }
                : undefined
            }
          />
        )}
        </>
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
    warning: TOKENS.colors.warning,
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
          width: TOKENS.spacing[2],
          height: TOKENS.spacing[2],
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
