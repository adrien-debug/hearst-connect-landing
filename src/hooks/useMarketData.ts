'use client'

import { useQuery } from '@tanstack/react-query'
import { MarketApi, AgentsApi } from '@/lib/api-client'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import {
  DEMO_MARKET_LATEST,
  DEMO_MARKET_HISTORY,
  DEMO_AGENTS_STATUS,
} from '@/lib/demo/demo-data'

export function useMarketLatest() {
  const isDemo = useDemoMode()
  const query = useQuery({
    queryKey: ['market', 'latest'],
    queryFn: () => MarketApi.latest(),
    refetchInterval: 30_000,
    enabled: !isDemo,
  })
  if (isDemo) {
    return { ...query, data: DEMO_MARKET_LATEST, isLoading: false, isFetching: false, error: null }
  }
  return query
}

export function useMarketHistory(limit = 100, from?: number) {
  const isDemo = useDemoMode()
  const query = useQuery({
    queryKey: ['market', 'history', limit, from],
    queryFn: () => MarketApi.history(limit, from),
    refetchInterval: 60_000,
    enabled: !isDemo,
  })
  if (isDemo) {
    return { ...query, data: DEMO_MARKET_HISTORY, isLoading: false, isFetching: false, error: null }
  }
  return query
}

export function useAgentsStatus() {
  const isDemo = useDemoMode()
  const query = useQuery({
    queryKey: ['agents', 'status'],
    queryFn: () => AgentsApi.status(),
    refetchInterval: 30_000,
    enabled: !isDemo,
  })
  if (isDemo) {
    return { ...query, data: DEMO_AGENTS_STATUS, isLoading: false, isFetching: false, error: null }
  }
  return query
}
