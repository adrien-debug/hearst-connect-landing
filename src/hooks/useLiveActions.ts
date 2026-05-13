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
  const { isConnected } = useAccount()
  const { isAuthenticated } = useBackendUser()
  const { actions: userActions, positions: livePositions } = useUserData()

  const vaultConfig = useVaultById(vaultId)
  const vaultAddress = vaultConfig?.vaultAddress
  const vaultName = vaultConfig?.name || 'Unknown Vault'
  const isTestVault = vaultConfig?.isTest ?? false

  const { deposit, claim, withdraw, isPending: isChainPending } = useVaultActions(
    vaultAddress ? (vaultAddress as Address) : undefined
  )

  // Per-action pending flags so simultaneous-but-distinct actions (claim vs
  // withdraw) don't disable each other's UI based on the wrong label.
  const [isDepositPending, setIsDepositPending] = useState(false)
  const [isClaimPending, setIsClaimPending] = useState(false)
  const [isWithdrawPending, setIsWithdrawPending] = useState(false)
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
      setIsDepositPending(true)
      let txHash: `0x${string}`

      if (isTestVault) {
        const rand = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join('')
        txHash = `0x${rand}` as `0x${string}`
      } else {
        const amountBigInt = parseUnits(amount.toString(), 6)
        txHash = await deposit(amountBigInt)
      }

      setLastTxHash(txHash)
      const lockDays = vaultConfig?.lockPeriodDays || 365
      const maturityDate = Date.now() + lockDays * 24 * 60 * 60 * 1000
      await userActions.deposit({
        vaultId,
        amount: Math.floor(amount * 1e6),
        maturityDate,
        vaultName,
        txHash,
      })
      return { success: true, txHash }
    } catch (error) {
      console.error('[useLiveActions] Deposit error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Deposit failed' }
    } finally {
      setIsDepositPending(false)
    }
  }, [isConnected, isAuthenticated, vaultAddress, vaultConfig, deposit, userActions, vaultId, vaultName, isTestVault])

  // --- CLAIM ---
  const executeClaim = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found' }
    }

    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsClaimPending(true)
      let txHash: `0x${string}`

      if (isTestVault) {
        const rand = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join('')
        txHash = `0x${rand}` as `0x${string}`
      } else {
        txHash = await claim()
      }

      setLastTxHash(txHash)
      await userActions.claim({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(existingPosition.claimable * 1e6),
        txHash,
      })
      return { success: true, txHash }
    } catch (error) {
      console.error('[useLiveActions] Claim error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Claim failed' }
    } finally {
      setIsClaimPending(false)
    }
  }, [isConnected, isAuthenticated, existingPosition, claim, userActions, vaultId, vaultName, isTestVault])

  // --- WITHDRAW ---
  const executeWithdraw = useCallback(async (): Promise<LiveActionResult> => {
    if (!existingPosition) {
      return { success: false, error: 'No position found' }
    }

    if (!isConnected || !isAuthenticated) {
      return { success: false, error: 'Wallet not connected or not authenticated' }
    }

    try {
      setIsWithdrawPending(true)
      const total = existingPosition.deposited + existingPosition.claimable
      let txHash: `0x${string}`

      if (isTestVault) {
        const rand = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0')).join('')
        txHash = `0x${rand}` as `0x${string}`
      } else {
        const amountBigInt = parseUnits(total.toString(), 6)
        txHash = await withdraw(amountBigInt)
      }

      setLastTxHash(txHash)
      await userActions.withdraw({
        positionId: existingPosition.id,
        vaultId,
        vaultName,
        amount: Math.floor(total * 1e6),
        txHash,
      })
      return { success: true, txHash }
    } catch (error) {
      console.error('[useLiveActions] Withdraw error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Withdraw failed' }
    } finally {
      setIsWithdrawPending(false)
    }
  }, [isConnected, isAuthenticated, existingPosition, withdraw, userActions, vaultId, vaultName, isTestVault])

  const anyPending = isDepositPending || isClaimPending || isWithdrawPending || isChainPending

  return {
    deposit: executeDeposit,
    claim: executeClaim,
    withdraw: executeWithdraw,
    // Aggregate (kept for backwards-compat with existing callers).
    isPending: anyPending,
    // Per-action flags — prefer these for correctly labelled CTAs.
    isDepositPending: isDepositPending || isChainPending,
    isClaimPending: isClaimPending || isChainPending,
    isWithdrawPending: isWithdrawPending || isChainPending,
    lastTxHash,
    existingPosition,
    canDeposit: isConnected && !!vaultAddress,
    canClaim: !!existingPosition && existingPosition.claimable > 0,
    canWithdraw: !!existingPosition && ('canWithdraw' in existingPosition ? existingPosition.canWithdraw : false),
  }
}
