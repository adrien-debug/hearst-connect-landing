'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { ERC20_ABI } from '@/config/abi/usdc'
import { VAULT_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from '@/config/contracts'
import { parseUnits, formatUnits } from 'viem'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useState, useCallback } from 'react'

type DepositPhase = 'idle' | 'approving' | 'depositing' | 'confirmed' | 'error'

export function useDeposit() {
  const { address } = useAccount()
  const [phase, setPhase] = useState<DepositPhase>('idle')

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  })

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
    error: approveError,
  } = useWriteContract()

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
    error: depositError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: depositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositHash })

  const needsApproval = useCallback(
    (amount: string) => {
      if (!allowanceRaw) return true
      const current = BigInt(allowanceRaw as bigint)
      return current < parseUnits(amount, USDC_DECIMALS)
    },
    [allowanceRaw],
  )

  const approve = useCallback(
    (amount: string) => {
      setPhase('approving')
      writeApprove({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, parseUnits(amount, USDC_DECIMALS)],
      })
    },
    [writeApprove],
  )

  const deposit = useCallback(
    (amount: string) => {
      setPhase('depositing')
      writeDeposit({
        address: VAULT_ADDRESS,
        abi: EPOCH_VAULT_ABI,
        functionName: 'deposit',
        args: [parseUnits(amount, USDC_DECIMALS)],
      })
    },
    [writeDeposit],
  )

  const execute = useCallback(
    async (amount: string) => {
      if (!amount || amount === '0') return
      if (needsApproval(amount)) {
        approve(amount)
      } else {
        deposit(amount)
      }
    },
    [needsApproval, approve, deposit],
  )

  const allowance = allowanceRaw
    ? formatUnits(allowanceRaw as bigint, USDC_DECIMALS)
    : '0'

  const error = approveError || depositError
  if (error && phase !== 'error') setPhase('error')
  if (depositConfirmed && phase !== 'confirmed') setPhase('confirmed')

  return {
    execute,
    approve,
    deposit,
    needsApproval,
    allowance,
    refetchAllowance,
    phase,
    setPhase,
    isApproving,
    approveConfirmed,
    isDepositing,
    isConfirming,
    depositConfirmed,
    approveHash,
    depositHash,
    error,
  }
}
