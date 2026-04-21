'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { ERC20_ABI } from '@/config/abi/usdc'
import { VAULT_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from '@/config/contracts'
import { formatUnits } from 'viem'
import { useAccount, useReadContracts } from 'wagmi'

const vault = { address: VAULT_ADDRESS, abi: EPOCH_VAULT_ABI } as const
const usdc = { address: USDC_ADDRESS, abi: ERC20_ABI } as const

export function useUserPosition() {
  const { address, isConnected } = useAccount()

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { ...vault, functionName: 'userInfo', args: address ? [address] : undefined },
      { ...vault, functionName: 'getWithdrawalLockInfo', args: address ? [address] : undefined },
      { ...vault, functionName: 'canWithdraw', args: address ? [address] : undefined },
      { ...usdc, functionName: 'balanceOf', args: address ? [address] : undefined },
      { ...usdc, functionName: 'allowance', args: address ? [address, VAULT_ADDRESS] : undefined },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 15_000,
    },
  })

  const [userInfoRaw, lockInfoRaw, canWithdrawRaw, balanceRaw, allowanceRaw] = data ?? []

  const userInfo = userInfoRaw?.result as
    | [bigint, bigint, bigint, bigint, bigint]
    | undefined

  const lockInfo = lockInfoRaw?.result as
    | [bigint, bigint, boolean, bigint]
    | undefined

  return {
    depositAmount: userInfo ? formatUnits(userInfo[0], USDC_DECIMALS) : '0',
    lastClaimedEpoch: userInfo ? Number(userInfo[1]) : 0,
    lastDepositEpoch: userInfo ? Number(userInfo[3]) : 0,
    firstDepositTime: userInfo ? Number(userInfo[4]) : 0,

    lockStart: lockInfo ? Number(lockInfo[0]) : 0,
    lockEnd: lockInfo ? Number(lockInfo[1]) : 0,
    canWithdraw: (canWithdrawRaw?.result as boolean) ?? false,
    lockTimeRemaining: lockInfo ? Number(lockInfo[3]) : 0,

    usdcBalance: balanceRaw?.result
      ? formatUnits(balanceRaw.result as bigint, USDC_DECIMALS)
      : '0',
    usdcAllowance: allowanceRaw?.result
      ? formatUnits(allowanceRaw.result as bigint, USDC_DECIMALS)
      : '0',

    isConnected,
    isLoading,
    refetch,
  }
}
