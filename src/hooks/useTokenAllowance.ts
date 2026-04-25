'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { ERC20_ABI } from '@/config/abi/vault'
import { type Address, parseUnits } from 'viem'
import { USDC_DECIMALS } from '@/lib/constants'

const ALLOWANCE_STALE_MS = 12_000

export function useTokenAllowance(tokenAddress?: Address, owner?: Address, spender?: Address) {
  const enabled = Boolean(tokenAddress && owner && spender)

  const {
    data: allowance,
    isLoading,
    isError: isAllowanceError,
    error: allowanceError,
    refetch: refetchAllowance,
  } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled,
      staleTime: ALLOWANCE_STALE_MS,
      refetchOnWindowFocus: true,
    },
  })

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner,
    },
  })

  const { writeContractAsync, isPending } = useWriteContract()

  const approve = async (amount: string) => {
    if (!tokenAddress || !spender) return
    const amountBigInt = parseUnits(amount, USDC_DECIMALS)
    const out = await writeContractAsync({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountBigInt],
    })
    void refetchAllowance()
    return out
  }

  const hasAllowance = (requiredAmount: string): boolean => {
    if (allowance === undefined) return false
    try {
      const trimmed = requiredAmount.trim()
      const required = parseUnits(trimmed || '0', USDC_DECIMALS)
      return allowance >= required
    } catch {
      return false
    }
  }

  return {
    allowance,
    balance,
    approve,
    isPending,
    /** True only while the first successful read is in flight (not background refetch). */
    isLoading,
    isAllowanceError,
    allowanceError,
    refetchAllowance,
    hasAllowance,
  }
}
