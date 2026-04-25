/**
 * Live Actions Hook
 * Combines on-chain blockchain actions with backend persistence
 * Ensures positions and activity are recorded after successful on-chain transactions
 */

'use client'

import { useCallback, useState } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { useVaultActions } from './useVault'
import { useUserData } from './useUserData'
import { useBackendUser } from './useBackendUser'
import { useVaultById } from './useVaultRegistry'
import { useAppMode } from './useAppMode'
import type { Address } from 'viem'
import { parseUnits } from 'viem'

interface LiveActionResult {
  success: boolean
  txHash?: string
  error?: string
}

export function useLiveActions(vaultId: string) {
  const { address, isConnected } = useAccount()
  const { isDemo } = useAppMode()
  const { isAuthenticated } = useBackendUser()
  const { actions: userActions, positions } = useUserData()
  const vaultConfig = useVaultById(vaultId)
  const vaultAddress = vaultConfig?.vaultAddress
  const vaultName = vaultConfig?.name || 'Unknown Vault'

  // On-chain actions
  const { deposit, claim, withdraw, isPending: isChainPending } = useVaultActions(
    vaultAddress as Address | undefined
  )

  const [isPending, setIsPending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | undefined>()

  // Find existing position for this vault
  const existingPosition = positions.find(p => p.vaultId === vaultId && p.state !== 'withdrawn')

  // DEPOSIT: On-chain + backend persistence
  const executeDeposit = useCallback(async (amount: number): Promise<LiveActionResult> => {
    if (isDemo) {
      // Demo mode - no on-chain, just backend simulation
      try {
        setIsPending(true)
        const maturityDate = Date.now() + (vaultConfig?.lockPeriodDays || 365) * 24 * 60 * 60 * 1000
        await userActions.deposit({
          vaultId,
          amount: Math.floor(amount * 1e6), // Convert to USDC 6 decimals
          maturityDate,
          vaultName,
          txHash: 'demo-tx',
        })
        return { success: true, txHash: 'demo-tx' }
      } catch (error) {
        console.error('[useLiveActions] Demo deposit failed:', error)
        return { success: false, error: 'Demo deposit failed' }
      } finally {
        setIsPending(false)
      }
    }

    // Live mode - on-chain first, then backend
    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    if (!vaultAddress) {
      return { success: false, error: 'Vault not configured' }
    }

    try {
      setIsPending(true)

      // 1. Execute on-chain deposit
      const amountBigInt = parseUnits(amount.toString(), 6)
      await deposit(amountBigInt)

      // Note: In a real implementation, you would wait for the transaction receipt
      // and get the actual txHash. For now, we proceed with backend persistence.

      // 2. Persist to backend after on-chain success
      const maturityDate = Date.now() + (vaultConfig?.lockPeriodDays || 365) * 24 * 60 * 60 * 1000
      await userActions.deposit({
        vaultId,
        amount: Math.floor(amount * 1e6),
        maturityDate,
        vaultName,
        txHash: 'pending', // Would be actual txHash from receipt
      })

      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Deposit failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed'
      }
    } finally {
      setIsPending(false)
    }
  }, [isDemo, isConnected, isAuthenticated, vaultAddress, vaultConfig, deposit, userActions, vaultId, vaultName])

  // CLAIM: On-chain + backend persistence
  const executeClaim = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found for this vault' }
    }

    const claimableAmount = existingPosition.claimable

    if (isDemo) {
      // Demo mode
      try {
        setIsPending(true)
        await userActions.claim({
          positionId: existingPosition.id,
          vaultId,
          vaultName,
          amount: Math.floor(claimableAmount * 1e6),
          txHash: 'demo-claim-tx',
        })
        return { success: true, txHash: 'demo-claim-tx' }
      } catch (error) {
        console.error('[useLiveActions] Demo claim failed:', error)
        return { success: false, error: 'Demo claim failed' }
      } finally {
        setIsPending(false)
      }
    }

    // Live mode
    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsPending(true)

      // 1. Execute on-chain claim
      await claim()

      // 2. Persist to backend
      await userActions.claim({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(claimableAmount * 1e6),
        txHash: 'pending',
      })

      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Claim failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Claim failed'
      }
    } finally {
      setIsPending(false)
    }
  }, [isDemo, isConnected, isAuthenticated, existingPosition, claim, userActions, vaultId, vaultName])

  // WITHDRAW: On-chain + backend persistence
  const executeWithdraw = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found for this vault' }
    }

    const withdrawAmount = existingPosition.deposited + existingPosition.claimable

    if (isDemo) {
      // Demo mode
      try {
        setIsPending(true)
        await userActions.withdraw({
          positionId: existingPosition.id,
          vaultId,
          vaultName,
          amount: Math.floor(withdrawAmount * 1e6),
          txHash: 'demo-withdraw-tx',
        })
        return { success: true, txHash: 'demo-withdraw-tx' }
      } catch (error) {
        console.error('[useLiveActions] Demo withdraw failed:', error)
        return { success: false, error: 'Demo withdraw failed' }
      } finally {
        setIsPending(false)
      }
    }

    // Live mode
    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsPending(true)

      // 1. Execute on-chain withdraw
      const amountBigInt = parseUnits(withdrawAmount.toString(), 6)
      await withdraw(amountBigInt)

      // 2. Persist to backend
      await userActions.withdraw({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(withdrawAmount * 1e6),
        txHash: 'pending',
      })

      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Withdraw failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Withdraw failed'
      }
    } finally {
      setIsPending(false)
    }
  }, [isDemo, isConnected, isAuthenticated, existingPosition, withdraw, userActions, vaultId, vaultName])

  return {
    // Actions
    deposit: executeDeposit,
    claim: executeClaim,
    withdraw: executeWithdraw,

    // State
    isPending: isPending || isChainPending,
    lastTxHash,
    existingPosition,

    // Conditions
    canDeposit: isDemo || (isConnected && !!vaultAddress),
    canClaim: existingPosition && existingPosition.claimable > 0,
    canWithdraw: existingPosition && existingPosition.canWithdraw,
  }
}
