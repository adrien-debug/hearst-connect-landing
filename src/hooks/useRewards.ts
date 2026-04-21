'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { VAULT_ADDRESS, USDC_DECIMALS } from '@/config/contracts'
import { formatUnits } from 'viem'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

export function useRewards() {
  const { address, isConnected } = useAccount()

  const { data: pendingRaw, isLoading, refetch } = useReadContract({
    address: VAULT_ADDRESS,
    abi: EPOCH_VAULT_ABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10_000,
    },
  })

  const {
    writeContract,
    data: txHash,
    isPending: isClaiming,
    error: claimError,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash })

  const claim = () => {
    writeContract(
      {
        address: VAULT_ADDRESS,
        abi: EPOCH_VAULT_ABI,
        functionName: 'claimRewards',
      },
      { onError: () => {} },
    )
  }

  return {
    pending: pendingRaw ? formatUnits(pendingRaw as bigint, USDC_DECIMALS) : '0',
    pendingRaw: (pendingRaw as bigint) ?? BigInt(0),
    isLoading,
    refetch,

    claim,
    isClaiming,
    isConfirming,
    isConfirmed,
    claimError,
    txHash,
    resetClaim: reset,
  }
}
