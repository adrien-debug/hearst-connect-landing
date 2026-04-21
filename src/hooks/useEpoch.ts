'use client'

import { EPOCH_VAULT_ABI } from '@/config/abi/epoch-vault'
import { VAULT_ADDRESS } from '@/config/contracts'
import { useReadContracts } from 'wagmi'
import { useCallback, useEffect, useState } from 'react'

const contract = { address: VAULT_ADDRESS, abi: EPOCH_VAULT_ABI } as const

export function useEpoch() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: 'getCurrentEpochInfo' },
      { ...contract, functionName: 'EPOCH_DURATION' },
    ],
    query: { refetchInterval: 30_000 },
  })

  const epochInfo = data?.[0]?.result as
    | [bigint, bigint, bigint, bigint, boolean]
    | undefined
  const durationRaw = data?.[1]?.result as bigint | undefined

  const epoch = epochInfo ? Number(epochInfo[0]) : 0
  const startTime = epochInfo ? Number(epochInfo[1]) : 0
  const duration = durationRaw ? Number(durationRaw) : 0
  const elapsed = epochInfo ? Number(epochInfo[3]) : 0
  const shouldAdvance = epochInfo ? epochInfo[4] : false

  const [countdown, setCountdown] = useState(0)

  const computeCountdown = useCallback(() => {
    if (!startTime || !duration) return 0
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, startTime + duration - now)
  }, [startTime, duration])

  useEffect(() => {
    setCountdown(computeCountdown())
    const id = setInterval(() => setCountdown(computeCountdown()), 1_000)
    return () => clearInterval(id)
  }, [computeCountdown])

  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 0

  const formatRemaining = (s: number) => {
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${s % 60}s`
  }

  return {
    epoch,
    startTime,
    duration,
    elapsed,
    shouldAdvance,
    progress,
    countdown,
    countdownFormatted: formatRemaining(countdown),
    isLoading,
  }
}
