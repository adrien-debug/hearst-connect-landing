'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { VAULT_ABI } from '@/config/abi/vault'
import { formatUnits, type Address } from 'viem'
import { USDC_DECIMALS, POLL_INTERVAL_BLOCK, POLL_INTERVAL_SLOW, MS_PER_SECOND, BASIS_POINTS_DIVISOR } from '@/lib/constants'

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
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const { data: pendingRewards, refetch: refetchPending } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'pendingRewards',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const { data: canWithdraw, refetch: refetchCanWithdraw } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'canWithdraw',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!vaultAddress && !!userAddress,
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const position: VaultPosition | null = userInfo && pendingRewards !== undefined && canWithdraw !== undefined
    ? {
        depositAmount: Number(formatUnits(userInfo[0], USDC_DECIMALS)),
        rewardDebt: Number(formatUnits(userInfo[1], USDC_DECIMALS)),
        lockEnd: new Date(Number(userInfo[2]) * MS_PER_SECOND),
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
  const { data: totalDeposits, isError: errDeposits, refetch: refetchDeposits } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'totalDeposits',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const { data: monthlyAPR, isError: errMonthly, refetch: refetchMonthly } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'monthlyAPR',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: POLL_INTERVAL_SLOW, // APR changes less frequently
    },
  })

  const { data: annualAPR, isError: errAnnual, refetch: refetchAnnual } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'getAnnualAPR',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: POLL_INTERVAL_SLOW,
    },
  })

  const { data: currentEpoch, isError: errEpoch, refetch: refetchEpoch } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'currentEpoch',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const { data: shouldAdvanceEpoch, isError: errAdvance, refetch: refetchShouldAdvance } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'shouldAdvanceEpoch',
    query: {
      enabled: !!vaultAddress,
      refetchInterval: POLL_INTERVAL_BLOCK,
    },
  })

  const vaultReadsReady =
    totalDeposits !== undefined &&
    monthlyAPR !== undefined &&
    annualAPR !== undefined &&
    currentEpoch !== undefined &&
    shouldAdvanceEpoch !== undefined

  const global: VaultGlobal | null = vaultReadsReady
    ? {
        totalDeposits: Number(formatUnits(totalDeposits, USDC_DECIMALS)),
        monthlyAPR: Number(monthlyAPR) / BASIS_POINTS_DIVISOR,
        annualAPR: Number(annualAPR) / BASIS_POINTS_DIVISOR,
        currentEpoch: Number(currentEpoch),
        shouldAdvanceEpoch: Boolean(shouldAdvanceEpoch),
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

  const readError =
    errDeposits || errMonthly || errAnnual || errEpoch || errAdvance

  return {
    global,
    /** True while required vault view calls have not returned (and none failed yet). */
    isLoading: Boolean(vaultAddress) && !vaultReadsReady && !readError,
    isError: Boolean(vaultAddress) && !vaultReadsReady && readError,
    refetch,
  }
}

export function useVaultActions(vaultAddress?: Address) {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()

  const deposit = async (amount: bigint): Promise<`0x${string}`> => {
    if (!vaultAddress) throw new Error('Vault address not configured')
    return writeContractAsync({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [amount],
    })
  }

  const claim = async (): Promise<`0x${string}`> => {
    if (!vaultAddress) throw new Error('Vault address not configured')
    return writeContractAsync({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'claim',
    })
  }

  const withdraw = async (amount: bigint): Promise<`0x${string}`> => {
    if (!vaultAddress) throw new Error('Vault address not configured')
    return writeContractAsync({
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
