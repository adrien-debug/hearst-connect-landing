'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { VAULT_ADDRESS, USDC_DECIMALS } from '@/config/contracts'
import { parseUnits } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export function useWithdraw() {
  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash })

  const withdraw = (amount: string) => {
    if (!amount || amount === '0') return
    writeContract({
      address: VAULT_ADDRESS,
      abi: EPOCH_VAULT_ABI,
      functionName: 'withdraw',
      args: [parseUnits(amount, USDC_DECIMALS)],
    })
  }

  return {
    withdraw,
    isPending,
    isConfirming,
    isConfirmed,
    txHash,
    error,
    reset,
  }
}
