'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SignalsApi } from '@/lib/api-client'
import { useDemoMode } from '@/lib/demo/use-demo-mode'
import { DEMO_SIGNALS } from '@/lib/demo/demo-data'

export function useSignals(status?: string) {
  const isDemo = useDemoMode()
  const query = useQuery({
    queryKey: ['signals', status],
    queryFn: () => SignalsApi.list(status),
    refetchInterval: 10_000,
    enabled: !isDemo,
  })
  if (isDemo) {
    const filtered = status
      ? { signals: DEMO_SIGNALS.signals.filter((s) => s.status === status) }
      : DEMO_SIGNALS
    return { ...query, data: filtered, isLoading: false, isFetching: false, error: null }
  }
  return query
}

export function useSignalMutations() {
  const qc = useQueryClient()
  const isDemo = useDemoMode()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['signals'] })
  }

  const approve = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return { signal: null as unknown }
      return SignalsApi.approve(id)
    },
    onSuccess: invalidate,
  })

  const reject = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return { signal: null as unknown }
      return SignalsApi.reject(id)
    },
    onSuccess: invalidate,
  })

  const execute = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return { signal: null as unknown }
      return SignalsApi.execute(id)
    },
    onSuccess: invalidate,
  })

  return { approve, reject, execute }
}
