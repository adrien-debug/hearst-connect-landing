'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { VAULT_ADDRESS, USDC_DECIMALS } from '@/config/contracts'
import { formatUnits } from 'viem'
import { useReadContracts } from 'wagmi'

const contract = { address: VAULT_ADDRESS, abi: EPOCH_VAULT_ABI } as const

export function useVaultData() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'totalDeposits' },
      { ...contract, functionName: 'monthlyAPR' },
      { ...contract, functionName: 'getAnnualAPR' },
    ],
    query: {
      refetchInterval: 30_000,
    },
  })

  const [totalDepositsRaw, monthlyAPRRaw, annualAPRRaw] = data ?? []

  return {
    totalDeposits: totalDepositsRaw?.result
      ? formatUnits(totalDepositsRaw.result as bigint, USDC_DECIMALS)
      : '0',
    monthlyAPR: monthlyAPRRaw?.result
      ? Number(monthlyAPRRaw.result) / 100
      : 0,
    annualAPR: annualAPRRaw?.result
      ? Number(annualAPRRaw.result) / 100
      : 0,
    isLoading,
    error,
  }
}
