'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { VAULT_ABI } from '@/config/abi/vault'
import { formatUnits, type Address } from 'viem'

// USDC has 6 decimals
const USDC_DECIMALS = 6

export interface VaultPosition {
  depositAmount: number
  rewardDebt: number
  lockEnd: Date
  pendingRewards: number
  canWithdraw: boolean
}

export interface VaultGlobal {
  totalDeposits: number
  monthlyAPR: number
  annualAPR: number
  currentEpoch: number
  shouldAdvanceEpoch: boolean
}

export function useVaultPosition(vaultAddress?: Address) {
  const { address: userAddress } = useAccount()

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'userInfo',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      refetchInterval: 12000, // Poll every 12s (block time)
    },
  })

  const { data: pendingRewards, refetch: refetchPending } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'pendingRewards',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      refetchInterval: 12000,
    },
  })

  const { data: canWithdraw, refetch: refetchCanWithdraw } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'canWithdraw',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      refetchInterval: 12000,
    },
  })

  const position: VaultPosition | null = userInfo && pendingRewards !== undefined && canWithdraw !== undefined
    ? {
        depositAmount: Number(formatUnits(userInfo[0], USDC_DECIMALS)),
        rewardDebt: Number(formatUnits(userInfo[1], USDC_DECIMALS)),
        lockEnd: new Date(Number(userInfo[2]) * 1000),
        pendingRewards: Number(formatUnits(pendingRewards, USDC_DECIMALS)),
        canWithdraw: canWithdraw,
      }
    : null

  const refetch = async () => {
    await Promise.all([
      refetchUserInfo(),
      refetchPending(),
      refetchCanWithdraw(),
    ])
  }

  return {
    position,
    isLoading: !position,
    refetch,
  }
}

export function useVaultGlobal(vaultAddress?: Address) {
  const { data: totalDeposits, refetch: refetchDeposits } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'totalDeposits',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 12000,
    },
  })

  const { data: monthlyAPR, refetch: refetchMonthly } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'monthlyAPR',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 60000, // APR changes less frequently
    },
  })

  const { data: annualAPR, refetch: refetchAnnual } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getAnnualAPR',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 60000,
    },
  })

  const { data: currentEpoch, refetch: refetchEpoch } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'currentEpoch',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 12000,
    },
  })

  const { data: shouldAdvanceEpoch, refetch: refetchShouldAdvance } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'shouldAdvanceEpoch',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 12000,
    },
  })

  const global: VaultGlobal | null = totalDeposits !== undefined && monthlyAPR !== undefined && annualAPR !== undefined
    ? {
        totalDeposits: Number(formatUnits(totalDeposits, USDC_DECIMALS)),
        monthlyAPR: Number(monthlyAPR) / 100, // Assuming basis points
        annualAPR: Number(annualAPR) / 100,
        currentEpoch: Number(currentEpoch || 0),
        shouldAdvanceEpoch: shouldAdvanceEpoch || false,
      }
    : null

  const refetch = async () => {
    await Promise.all([
      refetchDeposits(),
      refetchMonthly(),
      refetchAnnual(),
      refetchEpoch(),
      refetchShouldAdvance(),
    ])
  }

  return {
    global,
    isLoading: !global,
    refetch,
  }
}

export function useVaultActions(vaultAddress?: Address) {
  const { writeContract, isPending, data: hash } = useWriteContract()

  const deposit = async (amount: bigint) => {
    if (!vaultAddress) return
    return writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [amount],
    })
  }

  const claim = async () => {
    if (!vaultAddress) return
    return writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'claim',
    })
  }

  const withdraw = async (amount: bigint) => {
    if (!vaultAddress) return
    return writeContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [amount],
    })
  }

  return {
    deposit,
    claim,
    withdraw,
    isPending,
    hash,
  }
}
