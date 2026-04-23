'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { ERC20_ABI } from '@/config/abi/vault'
import { type Address, parseUnits } from 'viem'

const USDC_DECIMALS = 6

export function useTokenAllowance(tokenAddress?: Address, owner?: Address, spender?: Address) {
  const { data: allowance, isLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
      refetchInterval: 3000, // Check frequently during approve flow
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

  const { writeContract, isPending } = useWriteContract()

  const approve = async (amount: string) => {
    if (!tokenAddress || !spender) return
    const amountBigInt = parseUnits(amount, USDC_DECIMALS)
    return writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amountBigInt],
    })
  }

  const hasAllowance = (requiredAmount: string): boolean => {
    if (!allowance) return false
    const required = parseUnits(requiredAmount, USDC_DECIMALS)
    return allowance >= required
  }

  return {
    allowance,
    balance,
    approve,
    isPending,
    isLoading,
    hasAllowance,
  }
}
