'use client'

import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import type { PositionData, PositionError } from '@/types/position'
import { useVaultPosition, useVaultGlobal } from './useVault'
import { useVaultById } from './useVaultRegistry'
import { MS_PER_DAY, EPOCH_PROGRESS_NEAR_END, EPOCH_PROGRESS_DEFAULT } from '@/lib/constants'

interface UsePositionDataOptions {
  vaultId: string
  walletAddress?: string
}

interface UsePositionDataReturn {
  data: PositionData | null
  isLoading: boolean
  error: PositionError | null
  refresh: () => void
  // Additional metadata
  vaultAddress: Address | undefined
  usdcAddress: Address | undefined
  isVaultConfigured: boolean
  isWalletConnected: boolean
}

export function usePositionData({
  vaultId,
  walletAddress: propWalletAddress,
}: UsePositionDataOptions): UsePositionDataReturn {
  const { address: connectedAddress } = useAccount()
  const vaultConfig = useVaultById(vaultId)

  // Use provided wallet address or connected address
  const effectiveWalletAddress = propWalletAddress || connectedAddress

  // Get vault addresses from registry
  const vaultAddress = vaultConfig?.vaultAddress
  const usdcAddress = vaultConfig?.usdcAddress
  const isVaultConfigured = !!vaultConfig && !!vaultAddress && !!usdcAddress
  const isWalletConnected = !!effectiveWalletAddress

  // Fetch on-chain position data
  const {
    position,
    isLoading: isPositionLoading,
    refetch: refetchPosition,
  } = useVaultPosition(isVaultConfigured ? vaultAddress : undefined)

  // Fetch global vault data
  const {
    global,
    isLoading: isGlobalLoading,
    isError: isGlobalError,
    refetch: refetchGlobal,
  } = useVaultGlobal(isVaultConfigured ? vaultAddress : undefined)

  // Build error state
  const error: PositionError | null = (() => {
    if (!isVaultConfigured) {
      return {
        code: 'VAULT_NOT_FOUND',
        message: 'Vault not configured. Please configure a vault first.',
      }
    }
    if (!isWalletConnected) {
      return {
        code: 'WALLET_NOT_CONNECTED',
        message: 'Wallet not connected. Please connect your wallet.',
      }
    }
    if (isGlobalError) {
      return {
        code: 'FETCH_ERROR',
        message: 'Could not load vault data from the network. Check Base + RPC.',
      }
    }
    return null
  })()

  // Build position data from on-chain results
  const data: PositionData | null = (() => {
    if (!isVaultConfigured || !isWalletConnected) return null
    if (!position || !global) return null

    // Calculate derived values
    const capitalDeployed = position.depositAmount
    const accruedYield = position.pendingRewards
    const positionValue = capitalDeployed + accruedYield

    // Calculate days remaining from lockEnd
    const now = Date.now()
    const lockEndTime = position.lockEnd.getTime()
    const daysRemaining = Math.max(0, Math.ceil((lockEndTime - now) / MS_PER_DAY))

    // Calculate progress to target (using APR and time elapsed)
    // This is a simplified calculation - the real target progress might need
    // additional contract data
    const lockDuration = vaultConfig.lockPeriodDays
    const elapsedDays = Math.max(0, lockDuration - daysRemaining)
    const targetPercent = parseFloat(vaultConfig.target.replace('%', ''))
    const progressPercent = Math.min(100, Math.round((elapsedDays / lockDuration) * 100))
    const isTargetReached = progressPercent >= 100

    return {
      capitalDeployed,
      accruedYield,
      positionValue,
      unlockTimeline: {
        daysRemaining,
        maturityDate: position.lockEnd.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        progressPercent,
      },
      epoch: {
        currentEpoch: global.currentEpoch,
        epochProgress: global.shouldAdvanceEpoch ? EPOCH_PROGRESS_NEAR_END : EPOCH_PROGRESS_DEFAULT,
        epochEndsAt: position.lockEnd.toISOString(),
      },
      canWithdraw: position.canWithdraw,
      isTargetReached,
      apr: global.annualAPR,
      target: vaultConfig.target,
    }
  })()

  const refresh = () => {
    refetchPosition()
    refetchGlobal()
  }

  return {
    data,
    isLoading: isPositionLoading || isGlobalLoading,
    error,
    refresh,
    vaultAddress,
    usdcAddress,
    isVaultConfigured,
    isWalletConnected,
  }
}
