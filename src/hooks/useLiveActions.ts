'use client'

import { useCallback, useState } from 'react'
import { useAccount } from 'wagmi'
import { useVaultActions } from './useVault'
import { useUserData } from './useUserData'
import { useBackendUser } from './useBackendUser'
import { useVaultById } from './useVaultRegistry'
import type { Address } from 'viem'
import { parseUnits } from 'viem'

interface LiveActionResult {
  success: boolean
  txHash?: string
  error?: string
}

export function useLiveActions(vaultId: string) {
  const { address, isConnected } = useAccount()
  const { isAuthenticated } = useBackendUser()
  const { actions: userActions, positions: livePositions } = useUserData()

  const vaultConfig = useVaultById(vaultId)
  const vaultAddress = vaultConfig?.vaultAddress
  const vaultName = vaultConfig?.name || 'Unknown Vault'

  const { deposit, claim, withdraw, isPending: isChainPending } = useVaultActions(
    vaultAddress ? (vaultAddress as Address) : undefined
  )

  const [isPending, setIsPending] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | undefined>()

  const existingPosition = livePositions.find(p => p.vaultId === vaultId && p.state !== 'withdrawn')

  // --- DEPOSIT ---
  const executeDeposit = useCallback(async (amount: number): Promise<LiveActionResult> => {
    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }
    if (!vaultAddress) {
      return { success: false, error: 'Vault not configured' }
    }

    try {
      setIsPending(true)
      const amountBigInt = parseUnits(amount.toString(), 6)
      await deposit(amountBigInt)

      const lockDays = vaultConfig?.lockPeriodDays || 365
      const maturityDate = Date.now() + lockDays * 24 * 60 * 60 * 1000
      await userActions.deposit({
        vaultId,
        amount: Math.floor(amount * 1e6),
        maturityDate,
        vaultName,
        txHash: 'pending',
      })
      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Deposit error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Deposit failed' }
    } finally {
      setIsPending(false)
    }
  }, [isConnected, isAuthenticated, vaultAddress, vaultConfig, deposit, userActions, vaultId, vaultName])

  // --- CLAIM ---
  const executeClaim = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found' }
    }

    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsPending(true)
      await claim()
      await userActions.claim({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(existingPosition.claimable * 1e6),
        txHash: 'pending',
      })
      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Claim error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Claim failed' }
    } finally {
      setIsPending(false)
    }
  }, [isConnected, isAuthenticated, existingPosition, claim, userActions, vaultId, vaultName])

  // --- WITHDRAW ---
  const executeWithdraw = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found' }
    }

    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsPending(true)
      const total = existingPosition.deposited + existingPosition.claimable
      const amountBigInt = parseUnits(total.toString(), 6)
      await withdraw(amountBigInt)

      await userActions.withdraw({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(total * 1e6),
        txHash: 'pending',
      })
      return { success: true }
    } catch (error) {
      console.error('[useLiveActions] Withdraw error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Withdraw failed' }
    } finally {
      setIsPending(false)
    }
  }, [isConnected, isAuthenticated, existingPosition, withdraw, userActions, vaultId, vaultName])

  return {
    deposit: executeDeposit,
    claim: executeClaim,
    withdraw: executeWithdraw,
    isPending: isPending || isChainPending,
    lastTxHash,
    existingPosition,
    canDeposit: isConnected && !!vaultAddress,
    canClaim: !!existingPosition && existingPosition.claimable > 0,
    canWithdraw: !!existingPosition && ('canWithdraw' in existingPosition ? existingPosition.canWithdraw : false),
  }
}
